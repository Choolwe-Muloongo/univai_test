<?php

namespace App\Services;

use App\Models\Invoice;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class LencoPaymentService
{
    public function initiatePayment(Invoice $invoice): array
    {
        $reference = $invoice->transaction_reference ?: 'univai-' . Str::orderedUuid();
        $callbackUrl = config('app.url') . '/api/payments/lenco/webhook';
        $returnUrl = $this->returnUrlFor($invoice);

        $payload = [
            'amount' => (float) $invoice->amount,
            'currency' => strtoupper($invoice->currency ?? 'ZMW'),
            'reference' => $reference,
            'email' => $invoice->student?->email,
            'firstName' => $invoice->student?->name,
            'description' => $invoice->description ?: $invoice->title,
            'callbackUrl' => $callbackUrl,
            'returnUrl' => $returnUrl,
        ];

        $frontend = rtrim((string) env('FRONTEND_URL', config('app.url')), '/');
        $checkoutUrl = $frontend . '/payments/lenco/checkout?' . http_build_query([
            'invoice' => $invoice->id,
            'reference' => $reference,
            'amount' => (string) (float) $invoice->amount,
            'currency' => strtoupper($invoice->currency ?? 'ZMW'),
            'email' => $invoice->student?->email,
            'name' => $invoice->student?->name,
            'label' => $invoice->title,
            'returnUrl' => $returnUrl,
        ]);

        $invoice->forceFill([
            'transaction_reference' => $reference,
            'checkout_url' => $checkoutUrl,
            'status' => $invoice->status === 'unpaid' ? 'pending' : $invoice->status,
            'metadata' => array_merge($invoice->metadata ?? [], ['lenco_payload' => $payload]),
        ])->save();

        return [
            'checkout_url' => $checkoutUrl,
            'reference' => $reference,
            'provider' => 'lenco',
        ];
    }

    public function verifyWebhook(array $payload, ?string $signature): bool
    {
        $secret = config('services.lenco.webhook_secret', env('LENCO_WEBHOOK_SECRET', env('LENCO_SECRET_KEY')));
        if (!$secret) {
            return true;
        }

        $expected = hash_hmac('sha256', json_encode($payload), $secret);
        return is_string($signature) && hash_equals($expected, $signature);
    }

    public function verifyCollection(string $reference): array
    {
        $secret = config('services.lenco.secret_key', env('LENCO_SECRET_KEY'));
        if (!$secret) {
            return [
                'verified' => false,
                'status' => 'unknown',
                'message' => 'Lenco secret key is not configured.',
                'payload' => null,
            ];
        }

        $endpoint = rtrim((string) config('services.lenco.base_url', env('LENCO_BASE_URL_V2', 'https://api.lenco.co/access/v2')), '/') . '/collections/status/' . rawurlencode($reference);
        $response = Http::withToken($secret)->acceptJson()->get($endpoint);
        if (!$response->successful()) {
            return [
                'verified' => false,
                'status' => 'unknown',
                'message' => 'Payment verification is not available yet.',
                'payload' => $response->json(),
            ];
        }

        $payload = $response->json();
        $status = strtolower((string) (data_get($payload, 'data.status') ?? data_get($payload, 'status') ?? 'unknown'));

        return [
            'verified' => in_array($status, ['successful', 'success', 'paid', 'completed'], true),
            'status' => $status,
            'message' => (string) (data_get($payload, 'message') ?? ''),
            'payload' => $payload,
        ];
    }

    private function returnUrlFor(Invoice $invoice): string
    {
        $frontend = rtrim((string) env('FRONTEND_URL', config('app.url')), '/');
        $metadata = $invoice->metadata ?? [];

        if (in_array($invoice->type, ['short_course_entry', 'short_course_access_plan', 'certificate_fee'], true) && isset($metadata['short_course_id'])) {
            return $frontend . '/student/courses/' . $metadata['short_course_id'] . '?payment=success&invoice=' . $invoice->id;
        }

        if ($invoice->type === 'short_course_bundle') {
            return $frontend . '/student/courses?payment=success&invoice=' . $invoice->id;
        }

        return $frontend . '/student/payments/invoices?invoice=' . $invoice->id;
    }
}

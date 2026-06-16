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

    public function verifyWebhookRaw(string $rawBody, ?string $signature): bool
    {
        $secret = config('services.lenco.secret_key', env('LENCO_SECRET_KEY'));
        if (!$secret || !$signature) {
            return false;
        }

        $webhookHashKey = hash('sha256', $secret);
        $expected = hash_hmac('sha512', $rawBody, $webhookHashKey);

        return hash_equals($expected, $signature);
    }

    public function verifyWebhook(array $payload, ?string $signature): bool
    {
        return $this->verifyWebhookRaw(json_encode($payload) ?: '', $signature);
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

        $endpoint = rtrim((string) config('services.lenco.base_url', env('LENCO_BASE_URL_V2', 'https://api.lenco.co/access/v2')), '/')
            . '/transaction-by-reference/' . rawurlencode($reference);
        $response = Http::withToken($secret)->acceptJson()->get($endpoint);

        if (!$response->successful()) {
            return [
                'verified' => false,
                'status' => 'unknown',
                'message' => 'Payment verification is not available yet.',
                'payload' => $response->json(),
            ];
        }

        $payload = $this->normalizeTransactionPayload($response->json(), $reference);
        $status = strtolower((string) (data_get($payload, 'data.status') ?? data_get($payload, 'status') ?? 'unknown'));

        return [
            'verified' => in_array($status, ['successful', 'success', 'paid', 'completed'], true),
            'status' => $status,
            'message' => (string) (data_get($payload, 'message') ?? ''),
            'payload' => $payload,
        ];
    }

    public function initiateMobileMoneyTransfer(array $payload): array
    {
        $secret = config('services.lenco.secret_key', env('LENCO_SECRET_KEY'));
        if (!$secret) {
            return [
                'successful' => false,
                'status' => 'unknown',
                'message' => 'Lenco secret key is not configured.',
                'payload' => null,
            ];
        }

        $endpoint = rtrim((string) config('services.lenco.base_url', env('LENCO_BASE_URL_V2', 'https://api.lenco.co/access/v2')), '/') . '/transfers/mobile-money';
        $response = Http::withToken($secret)->acceptJson()->post($endpoint, $payload);
        if (!$response->successful()) {
            return [
                'successful' => false,
                'status' => 'failed',
                'message' => 'Lenco transfer could not be started.',
                'payload' => $response->json(),
            ];
        }

        $json = $response->json();
        $status = strtolower((string) (data_get($json, 'data.status') ?? data_get($json, 'status') ?? 'unknown'));

        return [
            'successful' => in_array($status, ['successful', 'success', 'paid', 'completed'], true),
            'status' => $status,
            'message' => (string) (data_get($json, 'message') ?? ''),
            'reference' => (string) (data_get($json, 'data.reference') ?? data_get($json, 'reference') ?? ''),
            'payload' => $json,
        ];
    }

    public function verifyTransfer(string $reference): array
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

        $endpoint = rtrim((string) config('services.lenco.base_url', env('LENCO_BASE_URL_V2', 'https://api.lenco.co/access/v2')), '/') . '/transfers/status/' . rawurlencode($reference);
        $response = Http::withToken($secret)->acceptJson()->get($endpoint);
        if (!$response->successful()) {
            return [
                'verified' => false,
                'status' => 'unknown',
                'message' => 'Payout verification is not available yet.',
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

    private function normalizeTransactionPayload(?array $payload, string $fallbackReference): array
    {
        $payload = $payload ?? [];
        $data = data_get($payload, 'data');

        if (!is_array($data)) {
            $data = [];
        }

        $data['reference'] = $data['reference']
            ?? $data['clientReference']
            ?? $data['accountReference']
            ?? $fallbackReference;

        $data['amount'] = $data['amount']
            ?? $data['transactionAmount']
            ?? $data['settlementAmount']
            ?? 0;

        $payload['data'] = $data;

        return $payload;
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

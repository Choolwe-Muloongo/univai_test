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
        $returnUrl = rtrim((string) env('FRONTEND_URL', config('app.url')), '/') . '/student/payments/invoices?invoice=' . $invoice->id;

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

        $secret = env('LENCO_SECRET_KEY');
        $endpoint = rtrim((string) env('LENCO_BASE_URL', 'https://api.lenco.co/access/v1'), '/') . '/collections';

        if ($secret) {
            $response = Http::withToken($secret)->acceptJson()->post($endpoint, $payload)->throw()->json();
            $checkoutUrl = data_get($response, 'data.authorizationUrl')
                ?? data_get($response, 'data.checkoutUrl')
                ?? data_get($response, 'authorizationUrl')
                ?? data_get($response, 'checkout_url');
        }

        $checkoutUrl ??= rtrim((string) env('LENCO_CHECKOUT_STUB_URL', 'https://pay.lenco.co/checkout'), '/') . '/' . $reference;

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
        $secret = env('LENCO_WEBHOOK_SECRET', env('LENCO_SECRET_KEY'));
        if (!$secret) {
            return true;
        }

        $expected = hash_hmac('sha256', json_encode($payload), $secret);
        return is_string($signature) && hash_equals($expected, $signature);
    }
}

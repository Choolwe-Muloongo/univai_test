<?php

namespace App\Services;

use App\Models\Invoice;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

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

        $secret = config('services.lenco.secret_key');
        $endpoint = rtrim((string) config('services.lenco.base_url'), '/') . '/collections';

        if ($secret) {
            $response = Http::withToken($secret)->acceptJson()->post($endpoint, $payload)->throw()->json();
            $checkoutUrl = data_get($response, 'data.authorizationUrl')
                ?? data_get($response, 'data.checkoutUrl')
                ?? data_get($response, 'authorizationUrl')
                ?? data_get($response, 'checkout_url');
        } elseif ($this->allowsStubCheckout()) {
            $checkoutUrl = rtrim((string) config('services.lenco.checkout_stub_url'), '/') . '/' . $reference;
        } else {
            throw new RuntimeException('Lenco checkout is not configured. Set LENCO_SECRET_KEY or explicitly enable LENCO_ALLOW_STUB_CHECKOUT for non-production environments.');
        }

        if (empty($checkoutUrl)) {
            throw new RuntimeException('Lenco did not return a checkout URL for invoice ' . $invoice->id . '.');
        }

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
        $secret = config('services.lenco.webhook_secret') ?: config('services.lenco.secret_key');
        if (!$secret) {
            return false;
        }

        $encodedPayload = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($encodedPayload === false) {
            return false;
        }

        $expected = hash_hmac('sha256', $encodedPayload, $secret);
        return is_string($signature) && hash_equals($expected, $signature);
    }

    private function allowsStubCheckout(): bool
    {
        return !app()->isProduction() && (bool) config('services.lenco.allow_stub_checkout');
    }
}

<?php

namespace App\Services;

use App\Models\Invoice;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class LencoPaymentService
{
    private const SUCCESS_STATUSES = ['successful', 'success', 'paid', 'completed'];
    private const PROCESSING_STATUSES = ['pending', 'processing', 'queued', 'created'];

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
            'verified' => in_array($status, self::SUCCESS_STATUSES, true),
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
                'processing' => false,
                'status' => 'unknown',
                'message' => 'Lenco secret key is not configured.',
                'reference' => (string) ($payload['reference'] ?? ''),
                'payload' => null,
            ];
        }

        $endpoint = $this->payoutCreateEndpoint();
        $response = Http::withToken($secret)->acceptJson()->post($endpoint, $payload);

        if (!$response->successful()) {
            return [
                'successful' => false,
                'processing' => false,
                'status' => 'failed',
                'message' => $this->responseMessage($response) ?: 'Lenco transfer could not be started.',
                'reference' => (string) ($payload['reference'] ?? ''),
                'payload' => $response->json(),
            ];
        }

        $json = $response->json() ?? [];
        $status = $this->transferStatus($json);
        $successful = in_array($status, self::SUCCESS_STATUSES, true);
        $processing = in_array($status, self::PROCESSING_STATUSES, true);

        return [
            'successful' => $successful,
            'processing' => $processing,
            'status' => $status,
            'message' => (string) (data_get($json, 'message') ?? ''),
            'reference' => $this->transferReference($json, (string) ($payload['reference'] ?? '')),
            'payload' => $json,
        ];
    }

    public function verifyTransfer(string $reference): array
    {
        $secret = config('services.lenco.secret_key', env('LENCO_SECRET_KEY'));
        if (!$secret) {
            return [
                'verified' => false,
                'processing' => false,
                'status' => 'unknown',
                'message' => 'Lenco secret key is not configured.',
                'payload' => null,
            ];
        }

        $response = Http::withToken($secret)->acceptJson()->get($this->payoutVerifyEndpoint($reference));

        if (!$response->successful()) {
            $fallback = $this->publicTransferVerifyEndpoint($reference);
            if ($fallback !== $this->payoutVerifyEndpoint($reference)) {
                $fallbackResponse = Http::withToken($secret)->acceptJson()->get($fallback);
                if ($fallbackResponse->successful()) {
                    $response = $fallbackResponse;
                }
            }
        }

        if (!$response->successful()) {
            return [
                'verified' => false,
                'processing' => true,
                'status' => 'unknown',
                'message' => $this->responseMessage($response) ?: 'Payout verification is not available yet.',
                'payload' => $response->json(),
            ];
        }

        $payload = $response->json() ?? [];
        $status = $this->transferStatus($payload);

        return [
            'verified' => in_array($status, self::SUCCESS_STATUSES, true),
            'processing' => in_array($status, self::PROCESSING_STATUSES, true),
            'status' => $status,
            'message' => (string) (data_get($payload, 'message') ?? ''),
            'reference' => $this->transferReference($payload, $reference),
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

    private function payoutCreateEndpoint(): string
    {
        $path = (string) config('services.lenco.payout_create_path', env('LENCO_PAYOUT_CREATE_PATH', '/transfers/mobile-money'));
        return $this->urlFromPath($path, $this->payoutBaseUrl());
    }

    private function payoutVerifyEndpoint(string $reference): string
    {
        $path = (string) config('services.lenco.payout_verify_path', env('LENCO_PAYOUT_VERIFY_PATH', '/transfers/status/{reference}'));
        $path = str_replace('{reference}', rawurlencode($reference), $path);
        return $this->urlFromPath($path, $this->payoutBaseUrl());
    }

    private function publicTransferVerifyEndpoint(string $reference): string
    {
        $base = rtrim((string) config('services.lenco.transfer_base_url', env('LENCO_TRANSFER_BASE_URL', 'https://api.lenco.co/access/v1')), '/');
        return $base . '/transfer/by-reference/' . rawurlencode($reference);
    }

    private function payoutBaseUrl(): string
    {
        return rtrim((string) config('services.lenco.payout_base_url', env('LENCO_PAYOUT_BASE_URL', config('services.lenco.base_url', 'https://api.lenco.co/access/v2'))), '/');
    }

    private function urlFromPath(string $path, string $baseUrl): string
    {
        if (preg_match('/^https?:\/\//i', $path)) {
            return $path;
        }

        return rtrim($baseUrl, '/') . '/' . ltrim($path, '/');
    }

    private function transferStatus(array $payload): string
    {
        return strtolower((string) (
            data_get($payload, 'data.transaction.status')
            ?? data_get($payload, 'data.request.status')
            ?? data_get($payload, 'data.status')
            ?? data_get($payload, 'transaction.status')
            ?? data_get($payload, 'request.status')
            ?? data_get($payload, 'status')
            ?? 'unknown'
        ));
    }

    private function transferReference(array $payload, string $fallbackReference): string
    {
        return (string) (
            data_get($payload, 'data.transaction.reference')
            ?? data_get($payload, 'data.transaction.transactionReference')
            ?? data_get($payload, 'data.reference')
            ?? data_get($payload, 'data.request.reference')
            ?? data_get($payload, 'transaction.reference')
            ?? data_get($payload, 'reference')
            ?? $fallbackReference
        );
    }

    private function responseMessage(Response $response): string
    {
        $json = $response->json();
        return (string) (data_get($json, 'message') ?? data_get($json, 'error') ?? '');
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

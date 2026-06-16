<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\LencoPaymentService;
use App\Support\Affiliates\AffiliateService;
use App\Support\Payments\PaidInvoiceUnlocker;
use App\Support\Payments\PaymentReceiptMailer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LencoWebhookController extends Controller
{
    public function __invoke(Request $request, LencoPaymentService $lenco, PaidInvoiceUnlocker $unlocker, PaymentReceiptMailer $receiptMailer, AffiliateService $affiliates)
    {
        $rawBody = $request->getContent();
        $payload = json_decode($rawBody, true) ?: $request->all();
        $signature = $request->header('X-Lenco-Signature');

        if (!$lenco->verifyWebhookRaw($rawBody, $signature)) {
            Log::warning('Rejected Lenco webhook with invalid signature.', [
                'has_signature' => (bool) $signature,
                'event' => data_get($payload, 'event'),
            ]);

            return response()->json(['message' => 'Invalid signature'], 401);
        }

        $event = (string) data_get($payload, 'event', '');
        $clientReference = $this->clientReference($payload);
        $providerReference = $this->providerReference($payload);
        $lookupReference = $clientReference ?: $providerReference;
        $status = $this->statusFromPayload($payload);
        $amount = $this->amountFromPayload($payload);
        $currency = strtoupper((string) (data_get($payload, 'data.currency') ?? data_get($payload, 'currency') ?? 'ZMW'));

        if (!$lookupReference) {
            Log::warning('Lenco webhook missing reference.', [
                'event' => $event,
                'payload' => $payload,
            ]);

            return response()->json(['received' => true, 'status' => 'missing_reference'], 202);
        }

        $invoice = Invoice::query()
            ->where('transaction_reference', $clientReference ?: $lookupReference)
            ->first();

        if (!$invoice && $providerReference) {
            $invoice = Invoice::query()
                ->where('transaction_reference', $providerReference)
                ->first();
        }

        if (!$invoice) {
            Log::warning('Lenco webhook could not match an invoice.', [
                'event' => $event,
                'client_reference' => $clientReference,
                'provider_reference' => $providerReference,
                'status' => $status,
                'amount' => $amount,
                'currency' => $currency,
            ]);

            return response()->json(['received' => true, 'status' => 'unmatched_invoice'], 202);
        }

        if ($invoice->status === 'paid') {
            $payment = Payment::where('transaction_reference', $invoice->transaction_reference)->first();
            $affiliates->recordForInvoice($invoice, $payment, [
                'channel' => 'already-paid-webhook',
                'event' => $event,
            ]);
            $receiptMailer->sendForInvoice($invoice, $payment, [
                'channel' => 'already-paid-webhook',
                'event' => $event,
            ]);

            return response()->json(['received' => true, 'status' => 'already_paid']);
        }

        if ($this->isSuccessfulEvent($event, $status)) {
            if ($amount <= 0) {
                Log::warning('Lenco successful webhook had no usable amount.', [
                    'event' => $event,
                    'invoice_id' => $invoice->id,
                    'reference' => $invoice->transaction_reference,
                    'payload' => $payload,
                ]);

                return response()->json(['received' => true, 'status' => 'amount_missing'], 202);
            }

            if (abs($amount - (float) $invoice->amount) > 0.01) {
                Log::warning('Lenco webhook payment amount mismatch.', [
                    'event' => $event,
                    'invoice_id' => $invoice->id,
                    'expected' => (float) $invoice->amount,
                    'received' => $amount,
                    'client_reference' => $clientReference,
                    'provider_reference' => $providerReference,
                ]);

                return response()->json(['received' => true, 'status' => 'amount_mismatch'], 202);
            }

            if ($currency !== strtoupper($invoice->currency ?? 'ZMW')) {
                Log::warning('Lenco webhook payment currency mismatch.', [
                    'event' => $event,
                    'invoice_id' => $invoice->id,
                    'expected' => strtoupper($invoice->currency ?? 'ZMW'),
                    'received' => $currency,
                    'client_reference' => $clientReference,
                    'provider_reference' => $providerReference,
                ]);

                return response()->json(['received' => true, 'status' => 'currency_mismatch'], 202);
            }

            $invoice->forceFill([
                'paid_amount' => $invoice->amount,
                'status' => 'paid',
                'paid_at' => now(),
                'metadata' => array_merge($invoice->metadata ?? [], [
                    'lenco_webhook' => $payload,
                    'lenco_event' => $event,
                    'lenco_transaction_reference' => $providerReference,
                    'lenco_client_reference' => $clientReference,
                ]),
            ])->save();

            $payment = Payment::updateOrCreate(
                ['transaction_reference' => $invoice->transaction_reference],
                [
                    'invoice_id' => $invoice->id,
                    'amount' => $invoice->amount,
                    'currency' => $invoice->currency ?? 'ZMW',
                    'method' => 'lenco',
                    'provider' => 'lenco',
                    'status' => 'completed',
                    'is_test' => (bool) $invoice->is_test,
                    'payment_mode' => $invoice->payment_mode ?? 'live',
                    'payload' => $payload,
                    'paid_at' => now(),
                ]
            );

            $unlocker->unlock($invoice->fresh() ?? $invoice);
            $affiliates->recordForInvoice($invoice->fresh() ?? $invoice, $payment, [
                'channel' => 'lenco-webhook',
                'event' => $event,
            ]);
            $receiptMailer->sendForInvoice($invoice->fresh() ?? $invoice, $payment, [
                'channel' => 'lenco-webhook',
                'event' => $event,
            ]);
        } elseif ($this->isFailedEvent($event, $status)) {
            $invoice->forceFill([
                'status' => 'failed',
                'metadata' => array_merge($invoice->metadata ?? [], [
                    'lenco_webhook' => $payload,
                    'lenco_event' => $event,
                    'lenco_transaction_reference' => $providerReference,
                    'lenco_client_reference' => $clientReference,
                ]),
            ])->save();
        }

        return response()->json(['received' => true]);
    }

    private function clientReference(array $payload): string
    {
        return (string) (
            data_get($payload, 'data.clientReference')
            ?? data_get($payload, 'clientReference')
            ?? data_get($payload, 'data.reference')
            ?? data_get($payload, 'reference')
            ?? data_get($payload, 'data.accountReference')
            ?? data_get($payload, 'accountReference')
            ?? ''
        );
    }

    private function providerReference(array $payload): string
    {
        return (string) (
            data_get($payload, 'data.transactionReference')
            ?? data_get($payload, 'transactionReference')
            ?? data_get($payload, 'data.id')
            ?? data_get($payload, 'id')
            ?? ''
        );
    }

    private function statusFromPayload(array $payload): string
    {
        return strtolower((string) (
            data_get($payload, 'data.status')
            ?? data_get($payload, 'status')
            ?? data_get($payload, 'data.settlementStatus')
            ?? data_get($payload, 'settlementStatus')
            ?? ''
        ));
    }

    private function amountFromPayload(array $payload): float
    {
        return (float) (
            data_get($payload, 'data.amount')
            ?? data_get($payload, 'data.transactionAmount')
            ?? data_get($payload, 'data.settlementAmount')
            ?? data_get($payload, 'amount')
            ?? data_get($payload, 'transactionAmount')
            ?? 0
        );
    }

    private function isSuccessfulEvent(string $event, string $status): bool
    {
        return in_array($event, ['transaction.successful', 'virtual-account.transaction', 'virtual-account.transaction.settled'], true)
            || in_array($status, ['successful', 'success', 'paid', 'completed', 'settled'], true);
    }

    private function isFailedEvent(string $event, string $status): bool
    {
        return in_array($event, ['transaction.failed', 'virtual-account.rejected-transaction'], true)
            || in_array($status, ['failed', 'cancelled', 'canceled', 'rejected'], true);
    }
}

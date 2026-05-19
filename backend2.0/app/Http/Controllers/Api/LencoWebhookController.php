<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\LencoPaymentService;
use App\Support\Payments\PaidInvoiceUnlocker;
use App\Support\Payments\PaymentReceiptMailer;
use Illuminate\Http\Request;

class LencoWebhookController extends Controller
{
    public function __invoke(Request $request, LencoPaymentService $lenco, PaidInvoiceUnlocker $unlocker, PaymentReceiptMailer $receiptMailer)
    {
        $payload = $request->all();
        $signature = $request->header('X-Lenco-Signature') ?? $request->header('X-Signature');

        if (!$lenco->verifyWebhook($payload, $signature)) {
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        $reference = data_get($payload, 'reference')
            ?? data_get($payload, 'data.reference')
            ?? data_get($payload, 'transaction.reference');
        $status = strtolower((string) (data_get($payload, 'status') ?? data_get($payload, 'data.status') ?? ''));

        $invoice = Invoice::query()->where('transaction_reference', $reference)->first();
        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        if ($invoice->status === 'paid') {
            $receiptMailer->sendForInvoice($invoice, Payment::where('transaction_reference', $reference)->first(), [
                'channel' => 'already-paid-webhook',
            ]);

            return response()->json(['received' => true, 'status' => 'already_paid']);
        }

        $amount = (float) (data_get($payload, 'data.amount') ?? data_get($payload, 'amount') ?? 0);
        $currency = strtoupper((string) (data_get($payload, 'data.currency') ?? data_get($payload, 'currency') ?? $invoice->currency ?? 'ZMW'));

        if (in_array($status, ['successful', 'success', 'paid', 'completed'], true)) {
            if ($reference !== $invoice->transaction_reference) {
                return response()->json(['message' => 'Payment reference mismatch.'], 422);
            }
            if (abs($amount - (float) $invoice->amount) > 0.01) {
                return response()->json(['message' => 'Payment amount mismatch.'], 422);
            }
            if ($currency !== strtoupper($invoice->currency ?? 'ZMW')) {
                return response()->json(['message' => 'Payment currency mismatch.'], 422);
            }

            $invoice->forceFill([
                'paid_amount' => $invoice->amount,
                'status' => 'paid',
                'paid_at' => now(),
                'metadata' => array_merge($invoice->metadata ?? [], ['lenco_webhook' => $payload]),
            ])->save();

            Payment::updateOrCreate(
                ['transaction_reference' => $reference],
                [
                    'invoice_id' => $invoice->id,
                    'amount' => $invoice->amount,
                    'currency' => $invoice->currency ?? 'ZMW',
                    'method' => 'lenco',
                    'provider' => 'lenco',
                    'status' => 'completed',
                    'payload' => $payload,
                    'paid_at' => now(),
                ]
            );

            $unlocker->unlock($invoice);
            $receiptMailer->sendForInvoice($invoice->fresh() ?? $invoice, Payment::where('transaction_reference', $reference)->first(), [
                'channel' => 'lenco-webhook',
            ]);
        } elseif (in_array($status, ['failed', 'cancelled', 'canceled'], true)) {
            $invoice->forceFill(['status' => 'failed'])->save();
        }

        return response()->json(['received' => true]);
    }

}

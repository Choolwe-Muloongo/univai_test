<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\LencoPaymentService;
use App\Support\Payments\PaidInvoiceUnlocker;
use Illuminate\Http\Request;

class LencoWebhookController extends Controller
{
    public function __invoke(Request $request, LencoPaymentService $lenco, PaidInvoiceUnlocker $unlocker)
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

        if (in_array($status, ['successful', 'success', 'paid', 'completed'], true)) {
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
        } elseif (in_array($status, ['failed', 'cancelled', 'canceled'], true)) {
            $invoice->forceFill(['status' => 'failed'])->save();
        }

        return response()->json(['received' => true]);
    }

}

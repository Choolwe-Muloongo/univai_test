<?php

namespace App\Support\Payments;

use App\Mail\PaymentReceiptMail;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Facades\Mail;

class PaymentReceiptMailer
{
    public function sendForInvoice(Invoice $invoice, ?Payment $payment = null, array $extra = []): void
    {
        $invoice->loadMissing(['student', 'payments']);

        $email = $invoice->student?->email;
        if (!$email) {
            return;
        }

        $metadata = is_array($invoice->metadata ?? null) ? $invoice->metadata : [];
        if (!empty($metadata['receipt_sent_at'])) {
            return;
        }

        $payment ??= $invoice->payments->sortByDesc('paid_at')->first() ?? $invoice->payments->sortByDesc('created_at')->first();

        Mail::to($email)->send(new PaymentReceiptMail($invoice->fresh() ?? $invoice, $payment, $extra));

        $invoice->forceFill([
            'metadata' => array_merge($metadata, [
                'receipt_sent_at' => now()->toISOString(),
                'receipt_sent_via' => $extra['channel'] ?? ($payment?->provider ?? 'system'),
            ]),
        ])->saveQuietly();
    }
}

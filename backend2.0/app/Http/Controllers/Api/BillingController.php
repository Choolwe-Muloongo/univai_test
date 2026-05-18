<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\LencoPaymentService;
use App\Support\AuditLogger;
use App\Support\DeliveryModes;
use App\Support\Payments\PaidInvoiceUnlocker;
use App\Support\Payments\PaymentSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BillingController extends Controller
{
    public function invoices(Request $request)
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;

        if (!$studentId || !is_numeric($studentId)) {
            return [];
        }

        return Invoice::query()
            ->where('student_id', $studentId)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Invoice $invoice) {
                $mode = DeliveryModes::normalize(Enrollment::query()
                    ->where('user_id', $invoice->student_id)
                    ->where('intake_id', $invoice->intake_id)
                    ->value('delivery_mode') ?? $invoice->intake?->delivery_mode);

                return [
                'id' => $invoice->id,
                'title' => $invoice->title,
                'amount' => (string) $invoice->amount,
                'currency' => $invoice->currency ?? 'ZMW',
                'paidAmount' => (string) $invoice->paid_amount,
                'status' => $invoice->status,
                'type' => $invoice->type ?? 'tuition_fee',
                'dueDate' => optional($invoice->due_date)->toDateString(),
                'deliveryMode' => $mode,
                'feePolicy' => $mode === DeliveryModes::SOFTWARE_ONLY ? 'Software-only rate applied' : ($mode === DeliveryModes::PHYSICAL ? 'Physical learning facilities rate applied' : 'Hybrid learning rate applied'),
            ];
            });
    }

    public function pay(Request $request, Invoice $invoice, LencoPaymentService $lenco, PaidInvoiceUnlocker $unlocker)
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;

        if (!$studentId || (string) $invoice->student_id !== (string) $studentId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$invoice->uuid) {
            $invoice->forceFill(['uuid' => (string) Str::uuid()])->save();
        }

        if ($invoice->status === 'paid') {
            $unlocker->unlock($invoice);
            return response()->json([
                'id' => $invoice->id,
                'status' => $invoice->status,
                'checkout_url' => null,
                'message' => 'Invoice is already paid.',
            ]);
        }

        if (!PaymentSettings::lencoCollectionsEnabled()) {
            $settings = PaymentSettings::current();
            $paidInvoice = $unlocker->markPaidForTesting($invoice, $settings->test_mode_message ?: 'Payment confirmed in test mode.');

            AuditLogger::log($request, 'invoice.payment_test_mode_confirmed', 'invoice', (string) $invoice->id, [
                'provider' => 'test-mode',
            ]);

            return response()->json([
                'id' => $paidInvoice->id,
                'title' => $paidInvoice->title,
                'amount' => (string) $paidInvoice->amount,
                'currency' => $paidInvoice->currency ?? 'ZMW',
                'status' => 'paid',
                'checkout_url' => null,
                'reference' => $paidInvoice->transaction_reference,
                'testMode' => true,
                'message' => $settings->test_mode_message ?: 'Payment confirmed in test mode.',
            ]);
        }

        $checkout = $lenco->initiatePayment($invoice);

        AuditLogger::log($request, 'invoice.payment_initiated', 'invoice', (string) $invoice->id, [
            'provider' => 'lenco',
            'reference' => $checkout['reference'],
        ]);

        return response()->json([
            'id' => $invoice->id,
            'title' => $invoice->title,
            'amount' => (string) $invoice->amount,
            'currency' => $invoice->currency ?? 'ZMW',
            'status' => $invoice->status,
            'checkout_url' => $checkout['checkout_url'],
            'reference' => $checkout['reference'],
        ]);
    }

    public function verify(Request $request, Invoice $invoice, LencoPaymentService $lenco, PaidInvoiceUnlocker $unlocker)
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;

        if (!$studentId || (string) $invoice->student_id !== (string) $studentId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($invoice->status === 'paid') {
            $unlocker->unlock($invoice);
            return response()->json([
                'id' => $invoice->id,
                'status' => 'paid',
                'message' => 'Payment is already confirmed.',
            ]);
        }

        if (!$invoice->transaction_reference) {
            return response()->json(['message' => 'This invoice has no payment reference yet.'], 422);
        }

        $verification = $lenco->verifyCollection($invoice->transaction_reference);
        if (!$verification['verified']) {
            return response()->json([
                'id' => $invoice->id,
                'status' => $verification['status'],
                'message' => $verification['message'] ?: 'Payment has not been confirmed yet.',
            ], 202);
        }

        $invoice->forceFill([
            'paid_amount' => $invoice->amount,
            'status' => 'paid',
            'paid_at' => now(),
            'metadata' => array_merge($invoice->metadata ?? [], ['lenco_verify' => $verification['payload']]),
        ])->save();

        Payment::updateOrCreate(
            ['transaction_reference' => $invoice->transaction_reference],
            [
                'invoice_id' => $invoice->id,
                'amount' => $invoice->amount,
                'currency' => $invoice->currency ?? 'ZMW',
                'method' => 'lenco',
                'provider' => 'lenco',
                'status' => 'completed',
                'payload' => $verification['payload'],
                'paid_at' => now(),
            ]
        );

        $unlocker->unlock($invoice);

        return response()->json([
            'id' => $invoice->id,
            'status' => 'paid',
            'message' => 'Payment confirmed and access activated.',
        ]);
    }

    public function payments(Request $request)
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;

        if (!$studentId || !is_numeric($studentId)) {
            return [];
        }

        return Payment::query()
            ->whereHas('invoice', fn ($query) => $query->where('student_id', $studentId))
            ->orderByDesc('paid_at')
            ->get()
            ->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'invoiceId' => $payment->invoice_id,
                'amount' => (string) $payment->amount,
                'currency' => $payment->currency ?? 'ZMW',
                'method' => $payment->method,
                'provider' => $payment->provider ?? 'manual',
                'status' => $payment->status,
                'paidAt' => optional($payment->paid_at)->toISOString(),
            ]);
    }
}

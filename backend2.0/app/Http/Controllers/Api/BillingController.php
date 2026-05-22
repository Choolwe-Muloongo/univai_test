<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\LencoPaymentService;
use App\Support\AuditLogger;
use App\Support\Affiliates\AffiliateService;
use App\Support\DeliveryModes;
use App\Support\Payments\PaidInvoiceUnlocker;
use App\Support\Payments\PaymentReceiptMailer;
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
                'isTest' => (bool) $invoice->is_test,
                'paymentMode' => $invoice->payment_mode ?? 'live',
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
                'paymentMode' => PaymentSettings::mode(),
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
                'paymentMode' => $paidInvoice->payment_mode ?? PaymentSettings::mode(),
                'message' => $settings->test_mode_message ?: 'Payment confirmed in test mode.',
            ]);
        }

        $mode = PaymentSettings::mode();
        $isTest = PaymentSettings::paymentsAreTest();
        $checkout = $lenco->initiatePayment($invoice);
        $invoice->forceFill([
            'is_test' => $isTest,
            'payment_mode' => $mode,
            'metadata' => array_merge($invoice->metadata ?? [], [
                'payment_mode' => $mode,
                'is_test_payment' => $isTest,
            ]),
        ])->save();

        AuditLogger::log($request, 'invoice.payment_initiated', 'invoice', (string) $invoice->id, [
            'provider' => 'lenco',
            'reference' => $checkout['reference'],
            'paymentMode' => $mode,
            'isTest' => $isTest,
        ]);

        return response()->json([
            'id' => $invoice->id,
            'title' => $invoice->title,
            'amount' => (string) $invoice->amount,
            'currency' => $invoice->currency ?? 'ZMW',
            'status' => $invoice->status,
            'checkout_url' => $checkout['checkout_url'],
            'reference' => $checkout['reference'],
            'testMode' => $isTest,
            'paymentMode' => $mode,
        ]);
    }

    public function verify(Request $request, Invoice $invoice, LencoPaymentService $lenco, PaidInvoiceUnlocker $unlocker, PaymentReceiptMailer $receiptMailer, AffiliateService $affiliates)
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;

        if (!$studentId || (string) $invoice->student_id !== (string) $studentId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($invoice->status === 'paid') {
            $unlocker->unlock($invoice);
            $affiliates->recordForInvoice($invoice, Payment::where('transaction_reference', $invoice->transaction_reference)->first(), [
                'channel' => 'already-paid',
            ]);
            $receiptMailer->sendForInvoice($invoice, Payment::where('transaction_reference', $invoice->transaction_reference)->first(), [
                'channel' => 'already-paid',
            ]);
            return response()->json([
                'id' => $invoice->id,
                'status' => 'paid',
                'testMode' => (bool) $invoice->is_test,
                'paymentMode' => $invoice->payment_mode ?? 'live',
                'message' => 'Payment is already confirmed.',
            ]);
        }

        if (!$invoice->transaction_reference) {
            return response()->json(['message' => 'This invoice has no payment reference yet.'], 422);
        }

        $verification = $lenco->verifyCollection($invoice->transaction_reference);
        if (!$verification['verified']) {
            $payload = $verification['payload'] ?? [];
            $status = strtolower((string) (data_get($payload, 'data.status') ?? data_get($payload, 'status') ?? $verification['status'] ?? 'unknown'));
            return response()->json([
                'id' => $invoice->id,
                'status' => $status,
                'message' => $verification['message'] ?: 'Payment has not been confirmed yet.',
            ], 202);
        }

        $payload = $verification['payload'] ?? [];
        $status = strtolower((string) (data_get($payload, 'data.status') ?? data_get($payload, 'status') ?? 'unknown'));
        $reference = (string) (data_get($payload, 'data.reference') ?? data_get($payload, 'reference') ?? '');
        $amount = (float) (data_get($payload, 'data.amount') ?? data_get($payload, 'amount') ?? 0);
        $fee = (float) (data_get($payload, 'data.fee') ?? data_get($payload, 'fee') ?? 0);
        $currency = strtoupper((string) (data_get($payload, 'data.currency') ?? data_get($payload, 'currency') ?? $invoice->currency ?? 'ZMW'));
        $settlementStatus = strtolower((string) (data_get($payload, 'data.settlementStatus') ?? data_get($payload, 'settlementStatus') ?? ''));
        $amountSettled = (float) (data_get($payload, 'data.settlement.amountSettled') ?? data_get($payload, 'settlement.amountSettled') ?? 0);

        if ($reference !== $invoice->transaction_reference) {
            return response()->json(['message' => 'Payment reference mismatch.'], 422);
        }

        if (abs($amount - (float) $invoice->amount) > 0.01) {
            return response()->json(['message' => 'Payment amount mismatch.'], 422);
        }

        if ($currency !== strtoupper($invoice->currency ?? 'ZMW')) {
            return response()->json(['message' => 'Payment currency mismatch.'], 422);
        }

        if (!in_array($status, ['successful', 'success', 'paid', 'completed'], true)) {
            return response()->json([
                'id' => $invoice->id,
                'status' => $status,
                'message' => 'Payment is not successful yet.',
                'settlementStatus' => $settlementStatus,
                'amountSettled' => $amountSettled,
                'fee' => $fee,
            ], 202);
        }

        $mode = $invoice->payment_mode ?: PaymentSettings::mode();
        $isTest = $invoice->is_test || $mode !== PaymentSettings::MODE_LIVE;

        $invoice->forceFill([
            'paid_amount' => $invoice->amount,
            'status' => 'paid',
            'is_test' => $isTest,
            'payment_mode' => $mode,
            'paid_at' => now(),
            'metadata' => array_merge($invoice->metadata ?? [], [
                'lenco_verify' => $verification['payload'],
                'payment_mode' => $mode,
                'is_test_payment' => $isTest,
            ]),
        ])->save();

        Payment::updateOrCreate(
            ['transaction_reference' => $invoice->transaction_reference],
            [
                'invoice_id' => $invoice->id,
                'amount' => $invoice->amount,
                'currency' => $invoice->currency ?? 'ZMW',
                'method' => 'lenco',
                'provider' => $isTest ? 'lenco-test' : 'lenco',
                'status' => 'completed',
                'is_test' => $isTest,
                'payment_mode' => $mode,
                'payload' => $verification['payload'],
                'paid_at' => now(),
            ]
        );

        $unlocker->unlock($invoice);
        $affiliates->recordForInvoice($invoice->fresh() ?? $invoice, Payment::where('transaction_reference', $invoice->transaction_reference)->first(), [
            'channel' => $isTest ? 'lenco-test-verify' : 'lenco-verify',
        ]);
        $receiptMailer->sendForInvoice($invoice->fresh() ?? $invoice, Payment::where('transaction_reference', $invoice->transaction_reference)->first(), [
            'channel' => $isTest ? 'lenco-test-verify' : 'lenco-verify',
        ]);

        return response()->json([
            'id' => $invoice->id,
            'status' => 'paid',
            'testMode' => $isTest,
            'paymentMode' => $mode,
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
                'isTest' => (bool) $payment->is_test,
                'paymentMode' => $payment->payment_mode ?? 'live',
                'paidAt' => optional($payment->paid_at)->toISOString(),
            ]);
    }
}

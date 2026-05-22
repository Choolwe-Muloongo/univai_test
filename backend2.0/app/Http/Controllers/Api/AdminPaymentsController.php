<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Support\Payments\PaymentSettings;
use Illuminate\Http\Request;

class AdminPaymentsController extends Controller
{
    public function index(Request $request)
    {
        $settings = PaymentSettings::current();
        $showTest = $request->boolean('includeTest', (bool) $settings->show_test_payments_in_admin);

        $payments = Payment::query()
            ->with(['invoice.student'])
            ->when(!$showTest, fn ($query) => $query->where('is_test', false))
            ->orderByDesc('paid_at')
            ->orderByDesc('created_at')
            ->limit(250)
            ->get()
            ->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'invoiceId' => $payment->invoice_id,
                'studentName' => $payment->invoice?->student?->name,
                'studentEmail' => $payment->invoice?->student?->email,
                'title' => $payment->invoice?->title,
                'invoiceType' => $payment->invoice?->type,
                'amount' => (string) $payment->amount,
                'currency' => $payment->currency ?? 'ZMW',
                'method' => $payment->method,
                'provider' => $payment->provider ?? 'manual',
                'reference' => $payment->transaction_reference,
                'status' => $payment->status,
                'isTest' => (bool) $payment->is_test,
                'paymentMode' => $payment->payment_mode ?? 'live',
                'paidAt' => optional($payment->paid_at)->toISOString(),
                'createdAt' => optional($payment->created_at)->toISOString(),
            ]);

        $summaryQuery = Payment::query();
        $visibleSummaryQuery = Payment::query()->when(!$showTest, fn ($query) => $query->where('is_test', false));

        return response()->json([
            'settings' => [
                'paymentMode' => $settings->payment_mode ?: PaymentSettings::MODE_LIVE,
                'lencoCollectionsEnabled' => (bool) $settings->lenco_collections_enabled,
                'showTestPaymentsInAdmin' => (bool) $settings->show_test_payments_in_admin,
                'paymentsAreTest' => PaymentSettings::paymentsAreTest(),
                'testModeMessage' => $settings->test_mode_message,
            ],
            'summary' => [
                'totalPayments' => (clone $visibleSummaryQuery)->count(),
                'testPayments' => (clone $summaryQuery)->where('is_test', true)->count(),
                'livePayments' => (clone $summaryQuery)->where('is_test', false)->count(),
                'visibleAmount' => (string) ((clone $visibleSummaryQuery)->sum('amount') ?? 0),
            ],
            'payments' => $payments,
        ]);
    }
}

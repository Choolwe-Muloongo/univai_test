<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashbackLedger;
use App\Models\Invoice;
use App\Models\Payment;
use App\Support\AuditLogger;
use Illuminate\Http\Request;

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
            ->map(fn (Invoice $invoice) => [
                'id' => $invoice->id,
                'title' => $invoice->title,
                'amount' => (string) $invoice->amount,
                'paidAmount' => (string) $invoice->paid_amount,
                'status' => $invoice->status,
                'dueDate' => optional($invoice->due_date)->toDateString(),
            ]);
    }

    public function pay(Request $request, Invoice $invoice)
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;

        if (!$studentId || (string) $invoice->student_id !== (string) $studentId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payload = $request->validate([
            'amount' => ['nullable', 'numeric', 'min:0'],
            'method' => ['nullable', 'string'],
        ]);

        $amount = $payload['amount'] ?? $invoice->amount;
        $invoice->paid_amount = min($invoice->amount, $invoice->paid_amount + $amount);
        $invoice->status = $invoice->paid_amount >= $invoice->amount ? 'paid' : 'partial';
        $invoice->save();

        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            'amount' => $amount,
            'method' => $payload['method'] ?? 'card',
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        $this->createCashbackForPayment($invoice->load('student'), $payment);

        AuditLogger::log($request, 'invoice.paid', 'invoice', (string) $invoice->id, [
            'amount' => $amount,
        ]);

        return [
            'id' => $invoice->id,
            'title' => $invoice->title,
            'amount' => (string) $invoice->amount,
            'paidAmount' => (string) $invoice->paid_amount,
            'status' => $invoice->status,
            'dueDate' => optional($invoice->due_date)->toDateString(),
        ];
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
            ->with('cashbackLedger')
            ->orderByDesc('paid_at')
            ->get()
            ->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'invoiceId' => $payment->invoice_id,
                'amount' => (string) $payment->amount,
                'method' => $payment->method,
                'status' => $payment->status,
                'paidAt' => optional($payment->paid_at)->toISOString(),
                'cashback' => $payment->cashbackLedger ? [
                    'id' => $payment->cashbackLedger->id,
                    'amount' => (string) $payment->cashbackLedger->amount,
                    'currency' => $payment->cashbackLedger->currency,
                    'source' => $payment->cashbackLedger->source,
                    'status' => $payment->cashbackLedger->status,
                ] : null,
            ]);
    }

    private function createCashbackForPayment(Invoice $invoice, Payment $payment): void
    {
        if ($payment->status !== 'completed' || $payment->cashbackLedger()->exists()) {
            return;
        }

        $student = $invoice->student;
        $role = strtolower((string) ($student?->role ?? ''));
        if (!$student || str_contains($role, 'free') || str_contains($role, 'freemium')) {
            return;
        }

        $source = $this->resolveCashbackSource($invoice);
        if (!$source) {
            return;
        }

        if ($source === CashbackLedger::SOURCE_FINANCE_PROMOTION && !$invoice->cashback_finance_approved) {
            return;
        }

        $rate = (float) ($invoice->cashback_rate ?? 0.4);
        $rate = $rate > 0 ? $rate : 0.4;
        $cashbackAmount = round(((float) $payment->amount) * $rate, 2);
        if ($cashbackAmount <= 0) {
            return;
        }

        CashbackLedger::create([
            'user_id' => $student->id,
            'invoice_id' => $invoice->id,
            'payment_id' => $payment->id,
            'source' => $source,
            'status' => CashbackLedger::STATUS_LOCKED,
            'amount' => $cashbackAmount,
            'currency' => 'AFTA',
            'description' => 'Cashback for '.$invoice->title,
            'eligible_basis' => [
                'student_role' => $student->role,
                'invoice_title' => $invoice->title,
                'payment_amount' => (string) $payment->amount,
                'cashback_rate' => $rate,
                'finance_approved' => (bool) $invoice->cashback_finance_approved,
            ],
            'locked_at' => now(),
            'expires_at' => now()->addYear(),
        ]);
    }

    private function resolveCashbackSource(Invoice $invoice): ?string
    {
        if (in_array($invoice->cashback_source, CashbackLedger::ELIGIBLE_SOURCES, true)) {
            return $invoice->cashback_source;
        }

        $title = strtolower($invoice->title);

        return match (true) {
            str_contains($title, 'premium') || str_contains($title, 'subscription') => CashbackLedger::SOURCE_PREMIUM_SUBSCRIPTION,
            str_contains($title, 'tuition') || str_contains($title, 'programme') || str_contains($title, 'program') => CashbackLedger::SOURCE_PROGRAMME_TUITION,
            str_contains($title, 'alumni') => CashbackLedger::SOURCE_ALUMNI_CAMPAIGN,
            str_contains($title, 'promotion') || str_contains($title, 'promo') => CashbackLedger::SOURCE_FINANCE_PROMOTION,
            default => null,
        };
    }
}

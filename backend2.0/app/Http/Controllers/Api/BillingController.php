<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

        Payment::create([
            'invoice_id' => $invoice->id,
            'amount' => $amount,
            'method' => $payload['method'] ?? 'card',
            'status' => 'completed',
            'paid_at' => now(),
        ]);

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
            ->orderByDesc('paid_at')
            ->get()
            ->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'invoiceId' => $payment->invoice_id,
                'amount' => (string) $payment->amount,
                'method' => $payment->method,
                'status' => $payment->status,
                'paidAt' => optional($payment->paid_at)->toISOString(),
            ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Invoice;
use App\Models\Payment;
use App\Support\AuditLogger;
use App\Support\DeliveryModes;
use App\Services\LencoPaymentService;
use Illuminate\Support\Str;
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

    public function pay(Request $request, Invoice $invoice, LencoPaymentService $lenco)
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
            return response()->json([
                'id' => $invoice->id,
                'status' => $invoice->status,
                'checkout_url' => null,
                'message' => 'Invoice is already paid.',
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

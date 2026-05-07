<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\ShortCourseEnrollment;
use App\Services\LencoPaymentService;
use Illuminate\Http\Request;

class LencoWebhookController extends Controller
{
    public function __invoke(Request $request, LencoPaymentService $lenco)
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

            $this->unlockPaidInvoice($invoice);
        } elseif (in_array($status, ['failed', 'cancelled', 'canceled'], true)) {
            $invoice->forceFill(['status' => 'failed'])->save();
        }

        return response()->json(['received' => true]);
    }

    private function unlockPaidInvoice(Invoice $invoice): void
    {
        $metadata = $invoice->metadata ?? [];

        if ($invoice->type === 'short_course_entry' && isset($metadata['short_course_id'])) {
            ShortCourseEnrollment::query()->updateOrCreate(
                ['student_id' => $invoice->student_id, 'short_course_id' => $metadata['short_course_id']],
                ['entry_fee_paid' => true, 'status' => 'active']
            );
        }

        if ($invoice->type === 'certificate_fee' && isset($metadata['short_course_id'])) {
            ShortCourseEnrollment::query()->updateOrCreate(
                ['student_id' => $invoice->student_id, 'short_course_id' => $metadata['short_course_id']],
                ['certificate_fee_paid' => true, 'status' => 'certificate_paid']
            );
        }

        if ($invoice->type === 'tuition_fee') {
            Enrollment::query()
                ->where('user_id', $invoice->student_id)
                ->when($invoice->intake_id, fn ($query) => $query->where('intake_id', $invoice->intake_id))
                ->update(['status' => 'active', 'enrolled_at' => now(), 'confirmed_at' => now()]);
        }
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Invoice;
use App\Models\Program;
use App\Services\LencoPaymentService;
use App\Support\Payments\PaidInvoiceUnlocker;
use App\Support\Payments\PaymentSettings;
use App\Support\Pricing\LaunchFeeSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdmissionsFeeController extends Controller
{
    public function __invoke(Request $request, LencoPaymentService $lenco, PaidInvoiceUnlocker $unlocker)
    {
        $application = $this->applicationForSession($request);
        if (!$application) {
            return response()->json(['message' => 'Application not found.'], 404);
        }

        $invoice = $this->applicationFeeInvoice($application);
        if (!$invoice) {
            return response()->json(['message' => 'Application fee invoice is not available.'], 422);
        }

        if ($invoice->status === 'paid') {
            $unlocker->unlock($invoice);
            return response()->json([
                'invoice' => $this->mapInvoice($invoice->fresh() ?? $invoice),
                'checkoutUrl' => null,
                'message' => 'Application fee already confirmed.',
            ]);
        }

        if (!PaymentSettings::lencoCollectionsEnabled()) {
            $settings = PaymentSettings::current();
            $paidInvoice = $unlocker->markPaidForTesting($invoice, $settings->test_mode_message ?: 'Application fee confirmed.');
            return response()->json([
                'invoice' => $this->mapInvoice($paidInvoice),
                'checkoutUrl' => null,
                'testMode' => true,
                'message' => $settings->test_mode_message ?: 'Application fee confirmed.',
            ]);
        }

        if (!$invoice->uuid) {
            $invoice->forceFill(['uuid' => (string) Str::uuid()])->save();
        }

        $checkout = $lenco->initiatePayment($invoice);

        return response()->json([
            'invoice' => $this->mapInvoice($invoice->fresh() ?? $invoice),
            'checkoutUrl' => $checkout['checkout_url'] ?? null,
            'reference' => $checkout['reference'] ?? null,
            'testMode' => PaymentSettings::paymentsAreTest(),
        ]);
    }

    private function applicationForSession(Request $request): ?Application
    {
        $sessionUser = $request->session()->get('user');
        if (is_array($sessionUser)) {
            if (!empty($sessionUser['id'])) {
                $application = Application::where('user_id', $sessionUser['id'])->latest('created_at')->first();
                if ($application) return $application;
            }
            if (!empty($sessionUser['email'])) {
                $application = Application::where('email', $sessionUser['email'])->latest('created_at')->first();
                if ($application) return $application;
            }
        }

        $reference = $request->session()->get('admission_reference');
        return $reference ? Application::where('reference', $reference)->first() : null;
    }

    private function applicationFeeInvoice(Application $application): ?Invoice
    {
        if (!$application->user_id) {
            return null;
        }

        $program = $application->program_id ? Program::find($application->program_id) : null;
        $fee = LaunchFeeSchedule::programApplicationFee($program);

        return Invoice::firstOrCreate(
            [
                'student_id' => $application->user_id,
                'type' => 'application_fee',
                'title' => 'Application fee: ' . ($program?->title ?? $application->program_id),
            ],
            [
                'uuid' => (string) Str::uuid(),
                'description' => 'Programme application fee for ' . ($program?->title ?? $application->program_id),
                'amount' => $fee['amount'],
                'currency' => $fee['currency'],
                'paid_amount' => 0,
                'status' => 'pending',
                'metadata' => [
                    'application_reference' => $application->reference,
                    'program_id' => $application->program_id,
                ],
                'due_date' => now()->addDays(7)->toDateString(),
            ]
        );
    }

    private function mapInvoice(Invoice $invoice): array
    {
        return [
            'id' => $invoice->id,
            'title' => $invoice->title,
            'description' => $invoice->description,
            'amount' => (string) $invoice->amount,
            'currency' => $invoice->currency ?? 'ZMW',
            'paidAmount' => (string) $invoice->paid_amount,
            'status' => $invoice->status,
            'type' => $invoice->type,
            'dueDate' => optional($invoice->due_date)->toDateString(),
            'paidAt' => optional($invoice->paid_at)->toISOString(),
        ];
    }
}

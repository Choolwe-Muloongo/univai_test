<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Invoice;
use Illuminate\Http\Request;

class AdmissionsStatusController extends Controller
{
    public function __invoke(Request $request)
    {
        $application = $this->applicationForSession($request);
        if (!$application) {
            return response()->json([
                'status' => 'draft',
                'admissionFeePaid' => false,
                'invoice' => null,
            ]);
        }

        $invoice = $application->user_id
            ? Invoice::where('student_id', $application->user_id)
                ->where('type', 'application_fee')
                ->where('metadata->application_reference', $application->reference)
                ->latest('created_at')
                ->first()
            : null;

        return response()->json([
            'id' => $application->reference,
            'status' => $application->status,
            'admissionFeePaid' => (bool) $application->admission_fee_paid || $invoice?->status === 'paid',
            'offerIssuedAt' => optional($application->offer_issued_at)->toISOString(),
            'offerAcceptedAt' => optional($application->offer_accepted_at)->toISOString(),
            'invoice' => $invoice ? $this->mapInvoice($invoice) : null,
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

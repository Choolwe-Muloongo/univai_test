<?php

namespace App\Observers;

use App\Models\Application;
use App\Models\Invoice;
use App\Models\Program;
use App\Models\User;
use App\Support\Admissions\AdmissionsDocumentGenerator;
use App\Support\DeliveryModes;
use App\Support\Pricing\LaunchFeeSchedule;
use Illuminate\Support\Str;

class ApplicationObserver
{
    public function saved(Application $application): void
    {
        $generator = app(AdmissionsDocumentGenerator::class);

        if (in_array($application->status, ['offer_sent', 'approved', 'admitted'], true)) {
            $generator->ensureOfferLetter($application);
        }

        if ($application->status === 'admitted') {
            $generator->ensureAdmissionLetter($application);
            $this->ensureFormalEnrollmentInvoices($application);
        }
    }

    private function ensureFormalEnrollmentInvoices(Application $application): void
    {
        if (empty($application->intake_id)) {
            return;
        }

        $user = $application->user_id
            ? User::find($application->user_id)
            : User::where('email', $application->email)->first();
        $program = Program::find($application->program_id);

        if (!$user || !$program) {
            return;
        }

        $mode = DeliveryModes::normalize($application->delivery_mode);
        $tuition = LaunchFeeSchedule::programTuitionFee($program, $application);
        $total = (float) $tuition['amount'];
        $deposit = ($program->allow_partial_registration ?? false)
            ? LaunchFeeSchedule::minimumRegistrationDeposit($program, $total)
            : $total;
        $deposit = min(max((float) $deposit, 0), $total);
        $balance = round(max($total - $deposit, 0), 2);

        if ($deposit > 0) {
            Invoice::firstOrCreate(
                [
                    'student_id' => $user->id,
                    'intake_id' => $application->intake_id,
                    'type' => 'registration_deposit',
                    'title' => 'Registration deposit: ' . $program->title,
                ],
                [
                    'uuid' => (string) Str::uuid(),
                    'description' => 'Minimum deposit required to activate formal programme enrollment.',
                    'amount' => $deposit,
                    'currency' => $tuition['currency'],
                    'paid_amount' => 0,
                    'status' => 'pending',
                    'metadata' => [
                        'application_reference' => $application->reference,
                        'program_id' => $program->id,
                        'delivery_mode' => $mode,
                        'academic_year' => 1,
                    ],
                    'due_date' => now()->addDays(14)->toDateString(),
                ]
            );
        }

        if ($balance > 0) {
            Invoice::firstOrCreate(
                [
                    'student_id' => $user->id,
                    'intake_id' => $application->intake_id,
                    'type' => 'tuition_fee',
                    'title' => 'Tuition balance: ' . $program->title,
                ],
                [
                    'uuid' => (string) Str::uuid(),
                    'description' => 'Remaining tuition balance. Full clearance is required for results and progression.',
                    'amount' => $balance,
                    'currency' => $tuition['currency'],
                    'paid_amount' => 0,
                    'status' => 'pending',
                    'metadata' => [
                        'application_reference' => $application->reference,
                        'program_id' => $program->id,
                        'delivery_mode' => $mode,
                        'academic_year' => 1,
                    ],
                    'due_date' => now()->addDays(30)->toDateString(),
                ]
            );
        }
    }
}

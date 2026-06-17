<?php

namespace App\Support\Finance;

use App\Models\Intake;
use App\Models\Invoice;
use App\Models\Program;
use App\Support\Pricing\LaunchFeeSchedule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FormalFinancialClearance
{
    public const FORMAL_FEE_TYPES = [
        'registration_deposit',
        'registration_fee',
        'admission_fee',
        'tuition_fee',
    ];

    public function forStudentIntake(int|string $studentId, ?string $intakeId, int $academicYear = 1, bool $persistSnapshot = false): array
    {
        if (!$studentId || !$intakeId) {
            return $this->emptyResult($studentId, $intakeId, $academicYear, 'missing_student_or_intake');
        }

        $intake = Intake::with('program')->find($intakeId);
        if (!$intake || !$intake->program) {
            return $this->emptyResult($studentId, $intakeId, $academicYear, 'missing_intake_or_program');
        }

        $program = $intake->program;
        $invoices = Invoice::query()
            ->where('student_id', $studentId)
            ->where('intake_id', $intakeId)
            ->whereIn('type', self::FORMAL_FEE_TYPES)
            ->get()
            ->filter(fn (Invoice $invoice) => $this->invoiceAcademicYear($invoice) === $academicYear)
            ->values();

        $scheduledTuition = (float) LaunchFeeSchedule::programTuitionFee($program, null, $intake->delivery_mode)['amount'];
        $totalBilled = round((float) $invoices->sum(fn (Invoice $invoice) => (float) $invoice->amount), 2);
        $billingBase = max($totalBilled, $scheduledTuition);
        $totalPaid = round((float) $invoices->sum(fn (Invoice $invoice) => $this->paidAmount($invoice)), 2);
        $balance = round(max($billingBase - $totalPaid, 0), 2);

        $requiredRegistrationDeposit = $this->requiredRegistrationDeposit($program, $billingBase);
        $requiredExamClearance = LaunchFeeSchedule::examClearanceRequiredAmount($program, $billingBase);

        $registrationCleared = $totalPaid + 0.01 >= $requiredRegistrationDeposit;
        $examCleared = $totalPaid + 0.01 >= $requiredExamClearance;
        $resultsCleared = !($program->full_clearance_required_for_results ?? true) || $balance <= 0.01;
        $progressionCleared = !($program->full_clearance_required_for_progression ?? true) || $balance <= 0.01;
        $graduationCleared = !($program->graduation_clearance_required ?? true) || $balance <= 0.01;

        $status = $this->status($registrationCleared, $resultsCleared, $progressionCleared);

        $result = [
            'studentId' => (string) $studentId,
            'intakeId' => $intakeId,
            'programId' => $program->id,
            'programTitle' => $program->title,
            'academicYear' => $academicYear,
            'currency' => strtoupper($program->tuition_currency ?? 'ZMW'),
            'totalBilled' => $billingBase,
            'totalPaid' => $totalPaid,
            'balance' => $balance,
            'requiredRegistrationDeposit' => $requiredRegistrationDeposit,
            'requiredExamClearance' => $requiredExamClearance,
            'registrationClearance' => [
                'cleared' => $registrationCleared,
                'message' => $registrationCleared
                    ? 'Registration deposit cleared. Student can register and learn.'
                    : 'Registration blocked until the minimum deposit is paid.',
            ],
            'examClearance' => [
                'cleared' => $examCleared,
                'message' => $examCleared
                    ? 'Exam clearance requirement met.'
                    : 'Exam access is blocked until the exam clearance requirement is paid.',
            ],
            'resultsClearance' => [
                'cleared' => $resultsCleared,
                'message' => $resultsCleared
                    ? 'Results can be released.'
                    : 'Results are withheld until the full academic-year balance is paid.',
            ],
            'progressionClearance' => [
                'cleared' => $progressionCleared,
                'message' => $progressionCleared
                    ? 'Student can progress to the next academic year.'
                    : 'Progression is blocked until the full academic-year balance is paid.',
            ],
            'graduationClearance' => [
                'cleared' => $graduationCleared,
                'message' => $graduationCleared
                    ? 'Graduation finance clearance is satisfied.'
                    : 'Graduation is blocked until all programme fees are cleared.',
            ],
            'status' => $status,
        ];

        if ($persistSnapshot) {
            $this->persistSnapshot($result);
        }

        return $result;
    }

    public function registrationCleared(int|string $studentId, ?string $intakeId, int $academicYear = 1): bool
    {
        return (bool) data_get($this->forStudentIntake($studentId, $intakeId, $academicYear), 'registrationClearance.cleared');
    }

    public function resultsCleared(int|string $studentId, ?string $intakeId, int $academicYear = 1): bool
    {
        return (bool) data_get($this->forStudentIntake($studentId, $intakeId, $academicYear), 'resultsClearance.cleared');
    }

    public function progressionCleared(int|string $studentId, ?string $intakeId, int $academicYear = 1): bool
    {
        return (bool) data_get($this->forStudentIntake($studentId, $intakeId, $academicYear), 'progressionClearance.cleared');
    }

    private function requiredRegistrationDeposit(Program $program, float $billingBase): float
    {
        if (!($program->allow_partial_registration ?? false)) {
            return round($billingBase, 2);
        }

        return LaunchFeeSchedule::minimumRegistrationDeposit($program, $billingBase);
    }

    private function paidAmount(Invoice $invoice): float
    {
        $paidAmount = (float) ($invoice->paid_amount ?? 0);

        if ($invoice->status === 'paid' && $paidAmount <= 0) {
            return (float) $invoice->amount;
        }

        return $paidAmount;
    }

    private function invoiceAcademicYear(Invoice $invoice): int
    {
        $metadata = $invoice->metadata ?? [];
        $year = $metadata['academic_year'] ?? $metadata['academicYear'] ?? 1;

        return max(1, (int) $year);
    }

    private function status(bool $registrationCleared, bool $resultsCleared, bool $progressionCleared): string
    {
        if (!$registrationCleared) {
            return 'blocked_registration';
        }

        if (!$resultsCleared || !$progressionCleared) {
            return 'partially_cleared';
        }

        return 'fully_cleared';
    }

    private function persistSnapshot(array $result): void
    {
        if (!Schema::hasTable('student_financial_clearances')) {
            return;
        }

        DB::table('student_financial_clearances')->updateOrInsert(
            [
                'student_id' => (int) $result['studentId'],
                'intake_id' => $result['intakeId'],
                'academic_year' => $result['academicYear'],
            ],
            [
                'total_billed' => $result['totalBilled'],
                'total_paid' => $result['totalPaid'],
                'balance' => $result['balance'],
                'required_registration_deposit' => $result['requiredRegistrationDeposit'],
                'required_exam_clearance' => $result['requiredExamClearance'],
                'registration_cleared' => (bool) data_get($result, 'registrationClearance.cleared'),
                'exam_cleared' => (bool) data_get($result, 'examClearance.cleared'),
                'results_cleared' => (bool) data_get($result, 'resultsClearance.cleared'),
                'progression_cleared' => (bool) data_get($result, 'progressionClearance.cleared'),
                'graduation_cleared' => (bool) data_get($result, 'graduationClearance.cleared'),
                'status' => $result['status'],
                'metadata' => json_encode([
                    'program_id' => $result['programId'],
                    'program_title' => $result['programTitle'],
                    'currency' => $result['currency'],
                ]),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );
    }

    private function emptyResult(int|string|null $studentId, ?string $intakeId, int $academicYear, string $reason): array
    {
        return [
            'studentId' => $studentId ? (string) $studentId : null,
            'intakeId' => $intakeId,
            'academicYear' => $academicYear,
            'currency' => 'ZMW',
            'totalBilled' => 0,
            'totalPaid' => 0,
            'balance' => 0,
            'requiredRegistrationDeposit' => 0,
            'requiredExamClearance' => 0,
            'registrationClearance' => ['cleared' => false, 'message' => 'Registration clearance could not be calculated.'],
            'examClearance' => ['cleared' => false, 'message' => 'Exam clearance could not be calculated.'],
            'resultsClearance' => ['cleared' => false, 'message' => 'Results clearance could not be calculated.'],
            'progressionClearance' => ['cleared' => false, 'message' => 'Progression clearance could not be calculated.'],
            'graduationClearance' => ['cleared' => false, 'message' => 'Graduation clearance could not be calculated.'],
            'status' => $reason,
        ];
    }
}

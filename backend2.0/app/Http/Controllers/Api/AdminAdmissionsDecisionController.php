<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\ApplicationDocument;
use App\Models\Program;
use Illuminate\Http\Request;

class AdminAdmissionsDecisionController extends Controller
{
    public function __invoke(Request $request, string $id, AdmissionsController $admissions)
    {
        $application = Application::where('reference', $id)->first();
        if (!$application) {
            return response()->json(null, 404);
        }

        $status = (string) $request->input('status');
        if (in_array($status, ['offer_sent', 'approved', 'admitted'], true)) {
            $blockers = $this->offerBlockers($application, $request->input('intakeId') ?: $application->intake_id);
            if (!empty($blockers)) {
                return response()->json([
                    'message' => 'Application is not ready for offer or admission.',
                    'blockers' => $blockers,
                ], 422);
            }
        }

        return $admissions->adminUpdate($request, $id);
    }

    private function offerBlockers(Application $application, ?string $intakeId): array
    {
        $blockers = [];

        if (!$application->admission_fee_paid && !in_array($application->status, ['fee_paid', 'under_review', 'offer_sent', 'approved', 'admitted'], true)) {
            $blockers[] = 'Application fee is not marked as paid.';
        }

        if (empty($intakeId)) {
            $blockers[] = 'Applicant must be assigned to an intake.';
        }

        $documents = ApplicationDocument::where('application_id', $application->id)->get();
        if ($documents->isEmpty()) {
            $blockers[] = 'Applicant has not uploaded required documents.';
        } elseif ($documents->contains(fn (ApplicationDocument $document) => $document->status !== 'verified')) {
            $blockers[] = 'All applicant documents must be verified before offer.';
        }

        $program = Program::with('qualificationLevel')->find($application->program_id);
        if ($program) {
            $subjectPoints = $application->subject_points ?? [];
            $subjectCount = collect($subjectPoints)->filter(fn ($value) => (int) $value > 0)->count();
            $totalPoints = collect($subjectPoints)->reduce(fn ($sum, $value) => $sum + (int) $value, 0);
            $minimumSubjectCount = $program->qualificationLevel?->minimum_subject_count ?? 0;
            $minimumTotalPoints = $program->qualificationLevel?->minimum_total_points ?? 0;
            if ($subjectCount < $minimumSubjectCount || $totalPoints < $minimumTotalPoints) {
                $blockers[] = 'Applicant does not meet the programme subject count or total points requirement.';
            }

            foreach (($program->required_subjects ?? []) as $subject) {
                $key = $this->normaliseSubjectKey((string) ($subject['subjectId'] ?? $subject['subjectName'] ?? ''));
                $nameKey = $this->normaliseSubjectKey((string) ($subject['subjectName'] ?? $key));
                $minimum = (int) ($subject['minimumPoints'] ?? 1);
                $normalised = [];
                foreach ($subjectPoints as $submittedKey => $points) {
                    $normalised[$this->normaliseSubjectKey((string) $submittedKey)] = (int) $points;
                }
                $actual = max($normalised[$key] ?? 0, $normalised[$nameKey] ?? 0);
                if ($actual < $minimum) {
                    $blockers[] = 'Required subject not satisfied: ' . ($subject['subjectName'] ?? $key);
                }
            }
        }

        return $blockers;
    }

    private function normaliseSubjectKey(string $value): string
    {
        return trim(strtolower(preg_replace('/[^a-z0-9]+/i', '-', $value)), '-');
    }
}

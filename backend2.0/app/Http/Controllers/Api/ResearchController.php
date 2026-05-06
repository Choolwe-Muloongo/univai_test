<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchApplication;
use App\Models\ResearchOpportunity;
use App\Models\StudentNotification;
use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ResearchController extends Controller
{
    private const EMPLOYER_ACTION_STATUSES = ['shortlisted', 'accepted', 'rejected'];
    public function index()
    {
        return ResearchOpportunity::query()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (ResearchOpportunity $opp) => $this->mapOpportunity($opp));
    }

    public function show(string $id)
    {
        $opp = ResearchOpportunity::find($id);
        if (!$opp) {
            return response()->json(null, 404);
        }

        return $this->mapOpportunity($opp);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'company' => 'required|string|max:255',
            'field' => 'required|string|max:255',
            'description' => 'required|string',
        ]);

        $opp = ResearchOpportunity::create([
            'id' => (string) Str::uuid(),
            'employer_id' => $this->numericSessionUserId($request),
            'title' => $data['title'],
            'company' => $data['company'],
            'field' => $data['field'],
            'description' => $data['description'],
        ]);

        AuditLogger::log($request, 'employer.research.posted', 'research_opportunity', $opp->id, [
            'title' => $opp->title,
            'company' => $opp->company,
        ]);

        return $this->mapOpportunity($opp);
    }

    public function apply(string $id, Request $request)
    {
        $opp = ResearchOpportunity::find($id);
        if (!$opp) {
            return response()->json(null, 404);
        }

        $data = $request->validate([
            'fullName' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'experience' => 'nullable|string',
            'availability' => 'nullable|string|max:255',
        ]);

        $application = ResearchApplication::create([
            'student_id' => $this->numericSessionUserId($request) ?? User::query()->where('email', strtolower($data['email']))->value('id'),
            'research_id' => $opp->id,
            'full_name' => $data['fullName'],
            'email' => strtolower($data['email']),
            'experience' => $data['experience'] ?? null,
            'availability' => $data['availability'] ?? null,
            'status' => 'submitted',
        ]);

        return response()->json([
            'status' => 'submitted',
            'id' => $application->id,
        ]);
    }

    public function applications(string $id)
    {
        $opp = ResearchOpportunity::find($id);
        if (!$opp || !$this->canManageOpportunity($opp, request())) {
            return response()->json([], 404);
        }

        return ResearchApplication::query()
            ->where('research_id', $opp->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ResearchApplication $app) => [
                'id' => $app->id,
                'fullName' => $app->full_name,
                'email' => $app->email,
                'experience' => $app->experience,
                'availability' => $app->availability,
                'status' => $app->status,
                'createdAt' => $app->created_at?->toISOString(),
            ]);
    }

    public function updateApplication(string $id, ResearchApplication $application, Request $request)
    {
        $opp = ResearchOpportunity::find($id);
        if (!$opp || $application->research_id !== $opp->id || !$this->canManageOpportunity($opp, $request)) {
            return response()->json(null, 404);
        }

        $payload = $request->validate([
            'status' => ['required', 'string', 'in:' . implode(',', self::EMPLOYER_ACTION_STATUSES)],
        ]);

        $previousStatus = $application->status;
        $application->update(['status' => $payload['status']]);

        $this->notifyStudent($application, $opp);
        AuditLogger::log($request, 'employer.research_application.' . $payload['status'], 'research_application', (string) $application->id, [
            'researchId' => $opp->id,
            'researchTitle' => $opp->title,
            'previousStatus' => $previousStatus,
            'status' => $application->status,
        ]);

        return response()->json([
            'id' => $application->id,
            'status' => $application->status,
        ]);
    }


    private function notifyStudent(ResearchApplication $application, ResearchOpportunity $opp): void
    {
        StudentNotification::create([
            'student_id' => $application->student_id,
            'email' => $application->email,
            'subject' => 'Your research application was updated',
            'message' => "Your application for {$opp->title} at {$opp->company} is now {$application->status}.",
            'target_type' => 'research_application',
            'target_id' => (string) $application->id,
            'metadata' => [
                'researchId' => $opp->id,
                'status' => $application->status,
            ],
        ]);
    }

    private function canManageOpportunity(ResearchOpportunity $opp, Request $request): bool
    {
        $employerId = $this->numericSessionUserId($request);

        return !$opp->employer_id || ($employerId && (int) $opp->employer_id === $employerId);
    }

    private function numericSessionUserId(Request $request): ?int
    {
        $sessionUser = $request->session()->get('user');
        $id = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;

        return is_numeric($id) ? (int) $id : null;
    }

    private function mapOpportunity(ResearchOpportunity $opp): array
    {
        return [
            'id' => $opp->id,
            'title' => $opp->title,
            'company' => $opp->company,
            'description' => $opp->description,
            'field' => $opp->field,
        ];
    }
}

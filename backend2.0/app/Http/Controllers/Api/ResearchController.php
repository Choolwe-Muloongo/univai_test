<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ResearchApplication;
use App\Models\ResearchOpportunity;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ResearchController extends Controller
{
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
            'title' => $data['title'],
            'company' => $data['company'],
            'field' => $data['field'],
            'description' => $data['description'],
        ]);

        $sessionUser = $request->session()->get('user');
        $employer = is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])
            ? User::find((int) $sessionUser['id'])
            : null;

        if ($employer) {
            app(NotificationService::class)->stateChange(
                'employer.verification_pending',
                'employer_verification',
                'Employer research post queued for verification',
                'Your research opportunity has been created. Keep your employer profile verified to increase student trust.',
                $employer,
                $opp,
                '/employer/settings',
                ['researchId' => $opp->id],
                'normal'
            );
        }

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
            'research_id' => $opp->id,
            'full_name' => $data['fullName'],
            'email' => $data['email'],
            'experience' => $data['experience'] ?? null,
            'availability' => $data['availability'] ?? null,
            'status' => 'submitted',
        ]);

        app(NotificationService::class)->stateChange(
            'application.submitted',
            'applications',
            'Research application submitted',
            'Your application for ' . $opp->title . ' has been submitted.',
            $application->email,
            $application,
            '/student/research/my-labs',
            ['researchId' => $opp->id, 'applicationId' => $application->id],
            'normal'
        );

        return response()->json([
            'status' => 'submitted',
            'id' => $application->id,
        ]);
    }

    public function applications(string $id)
    {
        $opp = ResearchOpportunity::find($id);
        if (!$opp) {
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
        if (!$opp || $application->research_id !== $opp->id) {
            return response()->json(null, 404);
        }

        $payload = $request->validate([
            'status' => ['required', 'string'],
        ]);

        $application->update(['status' => $payload['status']]);

        app(NotificationService::class)->stateChange(
            'application.status_changed',
            'applications',
            'Research application updated',
            'Your application for ' . $opp->title . ' is now ' . $application->status . '.',
            $application->email,
            $application,
            '/student/research/my-labs',
            ['researchId' => $opp->id, 'applicationId' => $application->id, 'status' => $application->status],
            'high'
        );

        return response()->json([
            'id' => $application->id,
            'status' => $application->status,
        ]);
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

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchApplication;
use App\Models\ResearchOpportunity;
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

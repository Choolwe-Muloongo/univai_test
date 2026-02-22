<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScholarshipApplication;
use App\Models\User;
use Illuminate\Http\Request;

class ScholarshipController extends Controller
{
    public function index(Request $request)
    {
        $userId = $this->resolveUserId($request);
        if (!$userId) {
            return [];
        }

        return ScholarshipApplication::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ScholarshipApplication $app) => $this->mapApplication($app));
    }

    public function store(Request $request)
    {
        $userId = $this->resolveUserId($request);
        if (!$userId) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $payload = $request->validate([
            'programId' => ['nullable', 'string'],
            'statement' => ['required', 'string'],
        ]);

        $app = ScholarshipApplication::create([
            'user_id' => $userId,
            'program_id' => $payload['programId'] ?? null,
            'statement' => $payload['statement'],
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return $this->mapApplication($app);
    }

    private function resolveUserId(Request $request): ?int
    {
        $sessionUser = $request->session()->get('user');
        if (is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])) {
            return (int) $sessionUser['id'];
        }

        if (is_array($sessionUser) && !empty($sessionUser['email'])) {
            $user = User::where('email', $sessionUser['email'])->first();
            return $user?->id;
        }

        return null;
    }

    private function mapApplication(ScholarshipApplication $app): array
    {
        return [
            'id' => $app->id,
            'programId' => $app->program_id,
            'statement' => $app->statement,
            'status' => $app->status,
            'submittedAt' => optional($app->submitted_at)->toISOString(),
            'reviewedAt' => optional($app->reviewed_at)->toISOString(),
            'decisionNotes' => $app->decision_notes,
        ];
    }
}

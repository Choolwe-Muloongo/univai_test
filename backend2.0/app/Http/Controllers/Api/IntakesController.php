<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Intake;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class IntakesController extends Controller
{
    public function index()
    {
        return Intake::query()
            ->orderBy('start_date')
            ->get()
            ->map(fn (Intake $intake) => [
                'id' => $intake->id,
                'programId' => $intake->program_id,
                'curriculumVersionId' => $intake->curriculum_version_id,
                'name' => $intake->name,
                'deliveryMode' => $intake->delivery_mode,
                'campus' => $intake->campus,
                'capacity' => $intake->capacity,
                'startDate' => optional($intake->start_date)->toDateString(),
                'endDate' => optional($intake->end_date)->toDateString(),
                'status' => $intake->status,
            ]);
    }

    public function store(Request $request)
    {
        $payload = $request->validate([
            'programId' => ['required', 'string'],
            'curriculumVersionId' => ['nullable', 'string'],
            'name' => ['required', 'string'],
            'deliveryMode' => ['required', 'string'],
            'campus' => ['nullable', 'string'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'startDate' => ['required', 'date'],
            'endDate' => ['nullable', 'date'],
            'status' => ['nullable', 'string'],
        ]);

        $idBase = Str::slug($payload['programId'] . '-' . $payload['name']);
        $intakeId = $idBase;
        $counter = 1;
        while (Intake::where('id', $intakeId)->exists()) {
            $counter++;
            $intakeId = "{$idBase}-{$counter}";
        }

        $intake = Intake::create([
            'id' => $intakeId,
            'program_id' => $payload['programId'],
            'curriculum_version_id' => $payload['curriculumVersionId'] ?? null,
            'name' => $payload['name'],
            'delivery_mode' => $payload['deliveryMode'],
            'campus' => $payload['campus'] ?? null,
            'capacity' => $payload['capacity'] ?? null,
            'start_date' => $payload['startDate'],
            'end_date' => $payload['endDate'] ?? null,
            'status' => $payload['status'] ?? 'open',
        ]);

        AuditLogger::log($request, 'intake.created', 'intake', $intake->id, [
            'programId' => $intake->program_id,
            'deliveryMode' => $intake->delivery_mode,
        ]);

        return response()->json([
            'id' => $intake->id,
            'programId' => $intake->program_id,
            'curriculumVersionId' => $intake->curriculum_version_id,
            'name' => $intake->name,
            'deliveryMode' => $intake->delivery_mode,
            'campus' => $intake->campus,
            'capacity' => $intake->capacity,
            'startDate' => optional($intake->start_date)->toDateString(),
            'endDate' => optional($intake->end_date)->toDateString(),
            'status' => $intake->status,
        ], 201);
    }

    public function availableForStudent(Request $request)
    {
        $user = $request->session()->get('user');
        $programId = is_array($user) ? ($user['programId'] ?? null) : null;

        $query = Intake::query()
            ->whereIn('status', ['open', 'active']);

        if ($programId) {
            $query->where('program_id', $programId);
        }

        return $query->orderBy('start_date')->get()->map(fn (Intake $intake) => [
            'id' => $intake->id,
            'programId' => $intake->program_id,
            'curriculumVersionId' => $intake->curriculum_version_id,
            'name' => $intake->name,
            'deliveryMode' => $intake->delivery_mode,
            'campus' => $intake->campus,
            'capacity' => $intake->capacity,
            'startDate' => optional($intake->start_date)->toDateString(),
            'endDate' => optional($intake->end_date)->toDateString(),
            'status' => $intake->status,
        ]);
    }
}

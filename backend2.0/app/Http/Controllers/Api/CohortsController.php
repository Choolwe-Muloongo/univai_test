<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cohort;
use App\Models\Section;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CohortsController extends Controller
{
    public function index(Request $request)
    {
        $query = Cohort::query()->with('sections')->orderBy('created_at', 'desc');

        if ($request->filled('intakeId')) {
            $query->where('intake_id', $request->query('intakeId'));
        }

        if ($request->filled('programId')) {
            $query->where('program_id', $request->query('programId'));
        }

        return $query->get()->map(fn (Cohort $cohort) => $this->mapCohort($cohort));
    }

    public function store(Request $request)
    {
        $payload = $request->validate([
            'intakeId' => ['nullable', 'string', 'exists:intakes,id'],
            'programId' => ['required', 'string', 'exists:programs,id'],
            'curriculumVersionId' => ['nullable', 'string', 'exists:curriculum_versions,id'],
            'name' => ['required', 'string'],
            'deliveryMode' => ['required', 'string'],
            'centre' => ['nullable', 'string'],
            'timetable' => ['nullable', 'array'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'string'],
        ]);

        $idBase = Str::slug($payload['programId'] . '-' . $payload['name']);
        $cohortId = $idBase;
        $counter = 1;
        while (Cohort::where('id', $cohortId)->exists()) {
            $counter++;
            $cohortId = "{$idBase}-{$counter}";
        }

        $cohort = Cohort::create([
            'id' => $cohortId,
            'intake_id' => $payload['intakeId'] ?? null,
            'program_id' => $payload['programId'],
            'curriculum_version_id' => $payload['curriculumVersionId'] ?? null,
            'name' => $payload['name'],
            'delivery_mode' => $payload['deliveryMode'],
            'centre' => $payload['centre'] ?? null,
            'timetable' => $payload['timetable'] ?? null,
            'capacity' => $payload['capacity'] ?? null,
            'status' => $payload['status'] ?? 'planning',
        ])->load('sections');

        AuditLogger::log($request, 'cohort.created', 'cohort', $cohort->id, [
            'intakeId' => $cohort->intake_id,
            'programId' => $cohort->program_id,
        ]);

        return response()->json($this->mapCohort($cohort), 201);
    }

    public function update(Request $request, Cohort $cohort)
    {
        $payload = $request->validate([
            'intakeId' => ['nullable', 'string', 'exists:intakes,id'],
            'programId' => ['nullable', 'string', 'exists:programs,id'],
            'curriculumVersionId' => ['nullable', 'string', 'exists:curriculum_versions,id'],
            'name' => ['nullable', 'string'],
            'deliveryMode' => ['nullable', 'string'],
            'centre' => ['nullable', 'string'],
            'timetable' => ['nullable', 'array'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'string'],
        ]);

        $cohort->update([
            'intake_id' => array_key_exists('intakeId', $payload) ? $payload['intakeId'] : $cohort->intake_id,
            'program_id' => $payload['programId'] ?? $cohort->program_id,
            'curriculum_version_id' => array_key_exists('curriculumVersionId', $payload) ? $payload['curriculumVersionId'] : $cohort->curriculum_version_id,
            'name' => $payload['name'] ?? $cohort->name,
            'delivery_mode' => $payload['deliveryMode'] ?? $cohort->delivery_mode,
            'centre' => array_key_exists('centre', $payload) ? $payload['centre'] : $cohort->centre,
            'timetable' => array_key_exists('timetable', $payload) ? $payload['timetable'] : $cohort->timetable,
            'capacity' => array_key_exists('capacity', $payload) ? $payload['capacity'] : $cohort->capacity,
            'status' => $payload['status'] ?? $cohort->status,
        ]);

        AuditLogger::log($request, 'cohort.updated', 'cohort', $cohort->id, [
            'status' => $cohort->status,
        ]);

        return response()->json($this->mapCohort($cohort->load('sections')));
    }

    public function storeSection(Request $request, Cohort $cohort)
    {
        $payload = $request->validate([
            'name' => ['required', 'string'],
            'code' => ['nullable', 'string'],
            'timetable' => ['nullable', 'array'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'string'],
        ]);

        $idBase = Str::slug($cohort->id . '-' . ($payload['code'] ?? $payload['name']));
        $sectionId = $idBase;
        $counter = 1;
        while (Section::where('id', $sectionId)->exists()) {
            $counter++;
            $sectionId = "{$idBase}-{$counter}";
        }

        $section = $cohort->sections()->create([
            'id' => $sectionId,
            'name' => $payload['name'],
            'code' => $payload['code'] ?? null,
            'timetable' => $payload['timetable'] ?? null,
            'capacity' => $payload['capacity'] ?? null,
            'status' => $payload['status'] ?? 'open',
        ]);

        AuditLogger::log($request, 'section.created', 'section', $section->id, [
            'cohortId' => $cohort->id,
        ]);

        return response()->json($this->mapSection($section), 201);
    }

    private function mapCohort(Cohort $cohort): array
    {
        return [
            'id' => $cohort->id,
            'intakeId' => $cohort->intake_id,
            'programId' => $cohort->program_id,
            'curriculumVersionId' => $cohort->curriculum_version_id,
            'name' => $cohort->name,
            'deliveryMode' => $cohort->delivery_mode,
            'centre' => $cohort->centre,
            'timetable' => $cohort->timetable,
            'capacity' => $cohort->capacity,
            'status' => $cohort->status,
            'sections' => $cohort->sections->map(fn (Section $section) => $this->mapSection($section))->values(),
        ];
    }

    private function mapSection(Section $section): array
    {
        return [
            'id' => $section->id,
            'cohortId' => $section->cohort_id,
            'name' => $section->name,
            'code' => $section->code,
            'timetable' => $section->timetable,
            'capacity' => $section->capacity,
            'status' => $section->status,
        ];
    }
}

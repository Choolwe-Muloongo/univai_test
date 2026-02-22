<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CurriculumVersion;
use App\Models\ModulePrerequisite;
use App\Models\Program;
use App\Models\ProgramModule;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCurriculumController extends Controller
{
    public function versions(Request $request)
    {
        $programId = $request->query('programId');
        $query = CurriculumVersion::query();
        if ($programId) {
            $query->where('program_id', $programId);
        }

        return $query->orderByDesc('created_at')->get()->map(fn (CurriculumVersion $version) => [
            'id' => $version->id,
            'programId' => $version->program_id,
            'name' => $version->name,
            'status' => $version->status,
            'publishedAt' => optional($version->published_at)->toISOString(),
        ]);
    }

    public function createVersion(Request $request)
    {
        $payload = $request->validate([
            'programId' => ['required', 'string'],
            'name' => ['required', 'string'],
            'status' => ['nullable', 'string'],
        ]);

        $program = Program::find($payload['programId']);
        if (!$program) {
            return response()->json(['message' => 'Program not found'], 404);
        }

        $baseId = Str::slug($payload['programId'] . '-' . $payload['name']);
        $versionId = $baseId;
        $counter = 1;
        while (CurriculumVersion::where('id', $versionId)->exists()) {
            $counter++;
            $versionId = "{$baseId}-{$counter}";
        }

        $version = CurriculumVersion::create([
            'id' => $versionId,
            'program_id' => $payload['programId'],
            'name' => $payload['name'],
            'status' => $payload['status'] ?? 'draft',
            'published_at' => ($payload['status'] ?? 'draft') === 'published' ? now() : null,
        ]);

        AuditLogger::log($request, 'curriculum.created', 'curriculum_version', $version->id, [
            'programId' => $version->program_id,
            'status' => $version->status,
        ]);

        return response()->json([
            'id' => $version->id,
            'programId' => $version->program_id,
            'name' => $version->name,
            'status' => $version->status,
            'publishedAt' => optional($version->published_at)->toISOString(),
        ], 201);
    }

    public function updateVersion(Request $request, CurriculumVersion $version)
    {
        $payload = $request->validate([
            'status' => ['nullable', 'string'],
        ]);

        $status = $payload['status'] ?? $version->status;
        $version->update([
            'status' => $status,
            'published_at' => $status === 'published' ? ($version->published_at ?? now()) : null,
        ]);

        AuditLogger::log($request, 'curriculum.updated', 'curriculum_version', $version->id, [
            'status' => $version->status,
        ]);

        return [
            'id' => $version->id,
            'programId' => $version->program_id,
            'name' => $version->name,
            'status' => $version->status,
            'publishedAt' => optional($version->published_at)->toISOString(),
        ];
    }

    public function modules(CurriculumVersion $version)
    {
        return ProgramModule::query()
            ->where('curriculum_version_id', $version->id)
            ->orderBy('semester')
            ->orderBy('title')
            ->get()
            ->map(fn (ProgramModule $module) => $this->mapModule($module));
    }

    public function createModule(Request $request, CurriculumVersion $version)
    {
        $payload = $request->validate([
            'title' => ['required', 'string'],
            'description' => ['required', 'string'],
            'credits' => ['nullable', 'integer', 'min:1'],
            'semester' => ['required', 'integer', 'min:1'],
            'isCore' => ['nullable', 'boolean'],
            'track' => ['nullable', 'string'],
        ]);

        $baseId = Str::slug($version->program_id . '-sem' . $payload['semester'] . '-' . $payload['title']);
        $moduleId = $baseId;
        $counter = 1;
        while (ProgramModule::where('id', $moduleId)->exists()) {
            $counter++;
            $moduleId = "{$baseId}-{$counter}";
        }

        $module = ProgramModule::create([
            'id' => $moduleId,
            'program_id' => $version->program_id,
            'curriculum_version_id' => $version->id,
            'title' => $payload['title'],
            'description' => $payload['description'],
            'credits' => $payload['credits'] ?? 3,
            'progress' => 0,
            'semester' => $payload['semester'],
            'is_exam_available' => false,
            'is_core' => $payload['isCore'] ?? true,
            'track' => $payload['track'] ?? null,
        ]);

        AuditLogger::log($request, 'module.created', 'program_module', $module->id, [
            'curriculumVersionId' => $version->id,
        ]);

        return response()->json($this->mapModule($module), 201);
    }

    public function deleteModule(ProgramModule $module)
    {
        $module->delete();
        return response()->noContent();
    }

    public function prerequisites(ProgramModule $module)
    {
        return ModulePrerequisite::with('prerequisite')
            ->where('module_id', $module->id)
            ->get()
            ->map(fn (ModulePrerequisite $prereq) => [
                'id' => $prereq->id,
                'moduleId' => $prereq->module_id,
                'prerequisiteId' => $prereq->prerequisite_module_id,
                'prerequisiteTitle' => $prereq->prerequisite?->title,
            ]);
    }

    public function addPrerequisite(Request $request, ProgramModule $module)
    {
        $payload = $request->validate([
            'prerequisiteId' => ['required', 'string'],
        ]);

        $prereq = ModulePrerequisite::firstOrCreate([
            'module_id' => $module->id,
            'prerequisite_module_id' => $payload['prerequisiteId'],
        ]);

        return response()->json([
            'id' => $prereq->id,
            'moduleId' => $prereq->module_id,
            'prerequisiteId' => $prereq->prerequisite_module_id,
        ], 201);
    }

    private function mapModule(ProgramModule $module): array
    {
        return [
            'id' => $module->id,
            'title' => $module->title,
            'description' => $module->description,
            'credits' => $module->credits,
            'semester' => $module->semester,
            'isCore' => (bool) $module->is_core,
            'track' => $module->track,
        ];
    }
}

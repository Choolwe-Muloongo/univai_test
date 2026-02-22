<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CurriculumVersion;
use App\Models\CourseAttempt;
use App\Models\ExamQuestion;
use App\Models\Intake;
use App\Models\Program;
use App\Models\ProgramModule;
use Illuminate\Http\Request;

class ProgramController extends Controller
{
    public function program(Request $request)
    {
        $user = $request->session()->get('user');
        $programId = $user['programId'] ?? null;
        $intakeId = $user['intakeId'] ?? null;
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;

        $program = $programId
            ? Program::with(['modules', 'school'])->find($programId)
            : Program::with(['modules', 'school'])->first();

        if (!$program) {
            return response()->json(null, 404);
        }

        $curriculumVersion = null;
        $intake = null;
        if ($intakeId) {
            $intake = Intake::find($intakeId);
            if ($intake?->curriculum_version_id) {
                $curriculumVersion = CurriculumVersion::find($intake->curriculum_version_id);
            }
        }

        if (!$curriculumVersion) {
            $curriculumVersion = CurriculumVersion::query()
                ->where('program_id', $program->id)
                ->where('status', 'published')
                ->orderByDesc('published_at')
                ->first();
        }

        $modules = $program->modules;
        if ($curriculumVersion) {
            $modules = $modules->where('curriculum_version_id', $curriculumVersion->id);
        }

        $attemptsByModule = collect();
        if ($studentId) {
            $attemptsByModule = CourseAttempt::query()
                ->where('student_id', $studentId)
                ->get()
                ->groupBy('module_id');
        }

        $mappedModules = $modules->map(function (ProgramModule $module) use ($attemptsByModule) {
            $attempts = $attemptsByModule->get($module->id, collect());
            return $this->mapModule($module, $attempts);
        });

        $totalCredits = $mappedModules->sum(fn (array $module) => (int) ($module['credits'] ?? 0));
        $earnedCredits = $mappedModules->sum(function (array $module) {
            return ($module['progress'] ?? 0) >= 100 ? (int) ($module['credits'] ?? 0) : 0;
        });
        $overallProgress = $totalCredits > 0 ? (int) round(($earnedCredits / $totalCredits) * 100) : 0;

        return [
            'id' => $program->id,
            'title' => $program->title,
            'description' => $program->description,
            'schoolId' => $program->school_id,
            'schoolName' => $program->school?->name,
            'deliveryMode' => $intake?->delivery_mode ?? 'online',
            'campus' => $intake?->campus,
            'progress' => $overallProgress,
            'imageId' => $program->image_id,
            'intakeId' => $intakeId,
            'curriculumVersion' => $curriculumVersion ? [
                'id' => $curriculumVersion->id,
                'name' => $curriculumVersion->name,
                'status' => $curriculumVersion->status,
            ] : null,
            'modules' => $mappedModules,
        ];
    }

    public function modules(Request $request)
    {
        $user = $request->session()->get('user');
        $programId = $user['programId'] ?? Program::query()->value('id');
        $intakeId = $user['intakeId'] ?? null;
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;

        if (!$programId) {
            return [];
        }

        $curriculumVersionId = null;
        if ($intakeId) {
            $curriculumVersionId = Intake::query()->where('id', $intakeId)->value('curriculum_version_id');
        }
        if (!$curriculumVersionId) {
            $curriculumVersionId = CurriculumVersion::query()
                ->where('program_id', $programId)
                ->where('status', 'published')
                ->orderByDesc('published_at')
                ->value('id');
        }

        $query = ProgramModule::query()
            ->where('program_id', $programId);
        if ($curriculumVersionId) {
            $query->where('curriculum_version_id', $curriculumVersionId);
        }

        $modules = $query
            ->orderBy('semester')
            ->orderBy('title')
            ->get();

        $attemptsByModule = collect();
        if ($studentId) {
            $attemptsByModule = CourseAttempt::query()
                ->where('student_id', $studentId)
                ->get()
                ->groupBy('module_id');
        }

        return $modules->map(function (ProgramModule $module) use ($attemptsByModule) {
            $attempts = $attemptsByModule->get($module->id, collect());
            return $this->mapModule($module, $attempts);
        });
    }

    public function modulesByProgram(string $programId)
    {
        $curriculumVersionId = CurriculumVersion::query()
            ->where('program_id', $programId)
            ->where('status', 'published')
            ->orderByDesc('published_at')
            ->value('id');

        $query = ProgramModule::query()
            ->where('program_id', $programId);
        if ($curriculumVersionId) {
            $query->where('curriculum_version_id', $curriculumVersionId);
        }

        return $query
            ->orderBy('semester')
            ->orderBy('title')
            ->get()
            ->map(fn (ProgramModule $module) => $this->mapModule($module));
    }

    public function semesterExam(string $semesterId)
    {
        $semester = (int) $semesterId;

        return ExamQuestion::query()
            ->where('semester', $semester)
            ->orderBy('id')
            ->get()
            ->map(fn (ExamQuestion $question) => [
                'question' => $question->question,
                'options' => $question->options ?? [],
                'answer' => $question->answer,
            ]);
    }

    private function mapModule(ProgramModule $module, $attempts = null): array
    {
        $attempt = null;
        if ($attempts instanceof \Illuminate\Support\Collection && $attempts->isNotEmpty()) {
            $attempt = $attempts->sortByDesc('attempt_no')->first();
        }

        $progress = 0;
        if ($attempt) {
            if ($attempt->credits_earned >= (int) $module->credits || in_array($attempt->status, ['pass', 'passed', 'completed'], true)) {
                $progress = 100;
            } elseif (in_array($attempt->status, ['in_progress'], true)) {
                $progress = 50;
            }
        }

        return [
            'id' => $module->id,
            'title' => $module->title,
            'description' => $module->description,
            'credits' => $module->credits,
            'progress' => $progress,
            'semester' => $module->semester,
            'isExamAvailable' => (bool) $module->is_exam_available,
            'isCore' => (bool) $module->is_core,
            'track' => $module->track,
        ];
    }
}

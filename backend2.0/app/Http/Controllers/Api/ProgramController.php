<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CurriculumVersion;
use App\Models\CourseAttempt;
use App\Models\ExamQuestion;
use App\Models\Enrollment;
use App\Models\Intake;
use App\Models\Program;
use App\Models\ProgramModule;
use App\Models\User;
use App\Support\Academics\StudentAcademicGate;
use App\Support\DeliveryModes;
use Illuminate\Http\Request;

class ProgramController extends Controller
{
    public function program(Request $request, StudentAcademicGate $gate)
    {
        $user = $request->session()->get('user');
        $programId = $user['programId'] ?? null;
        $intakeId = $user['intakeId'] ?? null;
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;

        if (!$programId) {
            return response()->json(['message' => 'Programme access is required.'], 404);
        }

        $program = Program::with(['modules.lessons', 'school'])->find($programId);

        if (!$program) {
            return response()->json(null, 404);
        }

        $academicGate = null;
        if ($studentId && is_numeric($studentId)) {
            $student = User::find((int) $studentId);
            if ($student) {
                $academicGate = $gate->forStudent($student, $intakeId);
            }
        }
        $canViewModules = (bool) data_get($academicGate, 'permissions.canViewModules', true);
        $modulesLockReason = data_get($academicGate, 'reasons.modules') ?: data_get($academicGate, 'reasons.lessons');

        $curriculumVersion = null;
        $intake = null;
        $selectedMode = DeliveryModes::HYBRID;
        if ($intakeId) {
            $intake = Intake::find($intakeId);
            $selectedMode = $this->selectedDeliveryMode($studentId, $intakeId, $intake?->delivery_mode);
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

        $modules = $modules->filter(fn (ProgramModule $module) => DeliveryModes::supports($module->supported_delivery_modes ?? $program->supported_delivery_modes, $selectedMode));

        $mappedModules = $canViewModules
            ? $modules->map(function (ProgramModule $module) use ($attemptsByModule, $selectedMode) {
                $attempts = $attemptsByModule->get($module->id, collect());
                return $this->mapModule($module, $attempts, $selectedMode);
            })
            : collect();

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
            'deliveryMode' => $selectedMode,
            'campus' => $intake?->campus,
            'progress' => $overallProgress,
            'imageId' => $program->image_id,
            'awardType' => $program->award_type,
            'qualificationLevel' => $program->qualification_level,
            'durationSemesters' => $program->duration_semesters,
            'totalCredits' => $program->total_credits,
            'intakeId' => $intakeId,
            'modulesLocked' => !$canViewModules,
            'modulesLockReason' => $modulesLockReason,
            'curriculumVersion' => $curriculumVersion ? [
                'id' => $curriculumVersion->id,
                'name' => $curriculumVersion->name,
                'status' => $curriculumVersion->status,
            ] : null,
            'modules' => $mappedModules->values(),
        ];
    }

    public function modules(Request $request, StudentAcademicGate $gate)
    {
        $user = $request->session()->get('user');
        $programId = $user['programId'] ?? null;
        $intakeId = $user['intakeId'] ?? null;
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;

        if (!$programId) {
            return response()->json(['message' => 'Programme access is required.'], 404);
        }

        if ($studentId && is_numeric($studentId)) {
            $student = User::find((int) $studentId);
            if ($student) {
                $academicGate = $gate->forStudent($student, $intakeId);
                if (!data_get($academicGate, 'permissions.canViewModules')) {
                    return response()->json([
                        'message' => data_get($academicGate, 'reasons.modules') ?: 'Modules are not open yet.',
                        'academicGate' => $academicGate,
                    ], 423);
                }
            }
        }

        $selectedMode = DeliveryModes::HYBRID;
        $curriculumVersionId = null;
        if ($intakeId) {
            $intake = Intake::query()->where('id', $intakeId)->first();
            $curriculumVersionId = $intake?->curriculum_version_id;
            $selectedMode = $this->selectedDeliveryMode($studentId, $intakeId, $intake?->delivery_mode);
        }
        if (!$curriculumVersionId) {
            $curriculumVersionId = CurriculumVersion::query()
                ->where('program_id', $programId)
                ->where('status', 'published')
                ->orderByDesc('published_at')
                ->value('id');
        }

        $query = ProgramModule::query()
            ->with('lessons')
            ->where('program_id', $programId);
        if ($curriculumVersionId) {
            $query->where('curriculum_version_id', $curriculumVersionId);
        }

        $modules = $query
            ->orderBy('semester')
            ->orderBy('title')
            ->get()
            ->filter(fn (ProgramModule $module) => DeliveryModes::supports($module->supported_delivery_modes, $selectedMode));

        $attemptsByModule = collect();
        if ($studentId) {
            $attemptsByModule = CourseAttempt::query()
                ->where('student_id', $studentId)
                ->get()
                ->groupBy('module_id');
        }

        return $modules->map(function (ProgramModule $module) use ($attemptsByModule, $selectedMode) {
            $attempts = $attemptsByModule->get($module->id, collect());
            return $this->mapModule($module, $attempts, $selectedMode);
        })->values();
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

    public function semesterExam(Request $request, StudentAcademicGate $gate, string $semesterId)
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;
        $intakeId = is_array($user) ? ($user['intakeId'] ?? null) : null;

        if ($studentId && is_numeric($studentId)) {
            $student = User::find((int) $studentId);
            if ($student) {
                $academicGate = $gate->forStudent($student, $intakeId);
                if (!data_get($academicGate, 'permissions.canWriteExam')) {
                    return response()->json([
                        'message' => data_get($academicGate, 'reasons.exams') ?: 'Exam access is not open yet.',
                        'academicGate' => $academicGate,
                    ], 423);
                }
            }
        }

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

    private function selectedDeliveryMode($studentId, ?string $intakeId, ?string $fallback): string
    {
        if ($studentId && is_numeric($studentId) && $intakeId) {
            $mode = Enrollment::query()
                ->where('user_id', $studentId)
                ->where('intake_id', $intakeId)
                ->value('delivery_mode');
            if ($mode) {
                return DeliveryModes::normalize($mode);
            }
        }

        return DeliveryModes::normalize($fallback);
    }

    private function mapModule(ProgramModule $module, $attempts = null, ?string $selectedMode = null): array
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
            'code' => $module->code,
            'title' => $module->title,
            'description' => $module->description,
            'credits' => $module->credits,
            'hoursPerWeek' => $module->hours_per_week,
            'progress' => $progress,
            'semester' => $module->semester,
            'isExamAvailable' => (bool) $module->is_exam_available && (!$selectedMode || DeliveryModes::supports($module->supported_delivery_modes, $selectedMode)),
            'supportedDeliveryModes' => DeliveryModes::normalizeMany($module->supported_delivery_modes),
            'isCore' => (bool) $module->is_core,
            'track' => $module->track,
            'lessons' => $module->lessons->map(fn ($lesson) => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'summary' => $lesson->summary,
                'content' => $lesson->content,
                'videoUrl' => $lesson->video_url,
            ])->values(),
        ];
    }
}

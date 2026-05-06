<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssessmentBlueprint;
use App\Models\AssessmentBooking;
use App\Models\AssessmentComponent;
use App\Models\QuestionBank;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AssessmentBlueprintsController extends Controller
{
    public function index(Request $request)
    {
        $query = AssessmentBlueprint::query()->with(['module', 'components.questionBank']);

        if ($request->filled('moduleId')) {
            $query->where('module_id', $request->query('moduleId'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        return $query->orderByDesc('updated_at')->get()->map(fn (AssessmentBlueprint $blueprint) => $this->mapBlueprint($blueprint));
    }

    public function show(AssessmentBlueprint $blueprint)
    {
        $blueprint->load(['module', 'components.questionBank']);
        return response()->json($this->mapBlueprint($blueprint));
    }

    public function store(Request $request)
    {
        $payload = $this->validateBlueprint($request);
        $actorId = $request->session()->get('user')['id'] ?? null;
        $actorId = is_numeric($actorId) ? (int) $actorId : null;

        $blueprint = DB::transaction(function () use ($payload, $actorId) {
            $blueprint = AssessmentBlueprint::updateOrCreate(
                ['module_id' => $payload['moduleId']],
                $this->blueprintPayload($payload, $actorId)
            );

            if (array_key_exists('components', $payload)) {
                $blueprint->components()->delete();
                foreach ($payload['components'] as $index => $componentPayload) {
                    $this->createComponent($blueprint, $componentPayload, $index);
                }
            }

            return $blueprint;
        });

        $blueprint->load(['module', 'components.questionBank']);
        AuditLogger::log($request, 'assessment_blueprint.saved', 'assessment_blueprint', (string) $blueprint->id, [
            'moduleId' => $blueprint->module_id,
            'status' => $blueprint->status,
        ]);

        return response()->json($this->mapBlueprint($blueprint), 201);
    }

    public function update(Request $request, AssessmentBlueprint $blueprint)
    {
        $payload = $this->validateBlueprint($request, true);

        DB::transaction(function () use ($payload, $blueprint) {
            $blueprint->update($this->blueprintPayload($payload, null, true));

            if (array_key_exists('components', $payload)) {
                $blueprint->components()->delete();
                foreach ($payload['components'] as $index => $componentPayload) {
                    $this->createComponent($blueprint, $componentPayload, $index);
                }
            }
        });

        $blueprint->load(['module', 'components.questionBank']);
        AuditLogger::log($request, 'assessment_blueprint.updated', 'assessment_blueprint', (string) $blueprint->id);

        return response()->json($this->mapBlueprint($blueprint));
    }

    public function questionBanks(Request $request)
    {
        $query = QuestionBank::query()->with('module');
        if ($request->filled('moduleId')) {
            $query->where('module_id', $request->query('moduleId'));
        }

        return $query->orderByDesc('updated_at')->get()->map(fn (QuestionBank $bank) => $this->mapQuestionBank($bank));
    }

    public function storeQuestionBank(Request $request)
    {
        $payload = $request->validate([
            'moduleId' => ['required', 'string', 'exists:program_modules,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'outcomes' => ['nullable', 'array'],
            'selectionRules' => ['nullable', 'array'],
            'status' => ['nullable', 'string'],
        ]);

        $actorId = $request->session()->get('user')['id'] ?? null;
        $bank = QuestionBank::create([
            'module_id' => $payload['moduleId'],
            'title' => $payload['title'],
            'description' => $payload['description'] ?? null,
            'outcomes' => $payload['outcomes'] ?? [],
            'selection_rules' => $payload['selectionRules'] ?? [],
            'status' => $payload['status'] ?? 'draft',
            'created_by' => is_numeric($actorId) ? (int) $actorId : null,
        ]);

        return response()->json($this->mapQuestionBank($bank), 201);
    }

    public function bookComponent(Request $request, AssessmentComponent $component)
    {
        $sessionUser = $request->session()->get('user');
        $studentId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;
        if (!$studentId || !is_numeric($studentId)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $payload = $request->validate([
            'bookedFor' => ['nullable', 'date'],
            'status' => ['nullable', 'string'],
            'clinicCompleted' => ['nullable', 'boolean'],
            'metadata' => ['nullable', 'array'],
        ]);

        $booking = AssessmentBooking::updateOrCreate(
            ['assessment_component_id' => $component->id, 'student_id' => (int) $studentId],
            [
                'booked_for' => $payload['bookedFor'] ?? null,
                'status' => $payload['status'] ?? 'booked',
                'clinic_completed_at' => ($payload['clinicCompleted'] ?? false) ? now() : null,
                'metadata' => $payload['metadata'] ?? [],
            ]
        );

        return response()->json([
            'id' => $booking->id,
            'componentId' => $booking->assessment_component_id,
            'status' => $booking->status,
            'bookedFor' => $booking->booked_for?->toISOString(),
            'clinicCompletedAt' => $booking->clinic_completed_at?->toISOString(),
        ]);
    }

    private function validateBlueprint(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'moduleId' => [$partial ? 'sometimes' : 'required', 'string', 'exists:program_modules,id'],
            'title' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'totalWeight' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'passMark' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'maxAttempts' => ['nullable', 'integer', 'min:1'],
            'passRules' => ['nullable', 'array'],
            'examClinicRules' => ['nullable', 'array'],
            'moderationRules' => ['nullable', 'array'],
            'resultReleaseRules' => ['nullable', 'array'],
            'progressionRules' => ['nullable', 'array'],
            'certificateRules' => ['nullable', 'array'],
            'graduationRules' => ['nullable', 'array'],
            'status' => ['nullable', 'string'],
            'components' => ['nullable', 'array'],
            'components.*.type' => ['required_with:components', Rule::in(['assignment', 'exam', 'project', 'quiz', 'practical', 'portfolio'])],
            'components.*.title' => ['required_with:components', 'string', 'max:255'],
            'components.*.description' => ['nullable', 'string'],
            'components.*.weight' => ['required_with:components', 'numeric', 'min:0', 'max:100'],
            'components.*.passMark' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'components.*.maxAttempts' => ['nullable', 'integer', 'min:1'],
            'components.*.requiresExamBooking' => ['nullable', 'boolean'],
            'components.*.requiresExamClinic' => ['nullable', 'boolean'],
            'components.*.questionBankId' => ['nullable', 'integer', 'exists:question_banks,id'],
            'components.*.rubric' => ['nullable', 'array'],
            'components.*.gradingRules' => ['nullable', 'array'],
            'components.*.moderationRules' => ['nullable', 'array'],
            'components.*.opensAt' => ['nullable', 'date'],
            'components.*.closesAt' => ['nullable', 'date'],
            'components.*.resultsReleaseAt' => ['nullable', 'date'],
            'components.*.status' => ['nullable', 'string'],
        ]);
    }

    private function blueprintPayload(array $payload, ?int $actorId = null, bool $partial = false): array
    {
        $mapped = [];
        foreach ([
            'moduleId' => 'module_id', 'title' => 'title', 'description' => 'description', 'totalWeight' => 'total_weight',
            'passMark' => 'pass_mark', 'maxAttempts' => 'max_attempts', 'passRules' => 'pass_rules',
            'examClinicRules' => 'exam_clinic_rules', 'moderationRules' => 'moderation_rules',
            'resultReleaseRules' => 'result_release_rules', 'progressionRules' => 'progression_rules',
            'certificateRules' => 'certificate_rules', 'graduationRules' => 'graduation_rules', 'status' => 'status',
        ] as $from => $to) {
            if (array_key_exists($from, $payload)) {
                $mapped[$to] = $payload[$from];
            }
        }
        if (!$partial) {
            $mapped['total_weight'] = $mapped['total_weight'] ?? 100;
            $mapped['pass_mark'] = $mapped['pass_mark'] ?? 50;
            $mapped['max_attempts'] = $mapped['max_attempts'] ?? 3;
            $mapped['status'] = $mapped['status'] ?? 'draft';
        }
        if ($actorId) {
            $mapped['created_by'] = $actorId;
        }
        return $mapped;
    }

    private function createComponent(AssessmentBlueprint $blueprint, array $payload, int $index): void
    {
        AssessmentComponent::create([
            'assessment_blueprint_id' => $blueprint->id,
            'type' => $payload['type'],
            'title' => $payload['title'],
            'description' => $payload['description'] ?? null,
            'weight' => $payload['weight'],
            'pass_mark' => $payload['passMark'] ?? null,
            'max_attempts' => $payload['maxAttempts'] ?? null,
            'requires_exam_booking' => $payload['requiresExamBooking'] ?? false,
            'requires_exam_clinic' => $payload['requiresExamClinic'] ?? false,
            'question_bank_id' => $payload['questionBankId'] ?? null,
            'rubric' => $payload['rubric'] ?? [],
            'grading_rules' => $payload['gradingRules'] ?? [],
            'moderation_rules' => $payload['moderationRules'] ?? [],
            'opens_at' => $payload['opensAt'] ?? null,
            'closes_at' => $payload['closesAt'] ?? null,
            'results_release_at' => $payload['resultsReleaseAt'] ?? null,
            'sort_order' => $index,
            'status' => $payload['status'] ?? 'draft',
        ]);
    }

    private function mapBlueprint(AssessmentBlueprint $blueprint): array
    {
        return [
            'id' => $blueprint->id,
            'moduleId' => $blueprint->module_id,
            'moduleTitle' => $blueprint->module?->title,
            'title' => $blueprint->title,
            'description' => $blueprint->description,
            'totalWeight' => (float) $blueprint->total_weight,
            'passMark' => (float) $blueprint->pass_mark,
            'maxAttempts' => $blueprint->max_attempts,
            'passRules' => $blueprint->pass_rules ?? [],
            'examClinicRules' => $blueprint->exam_clinic_rules ?? [],
            'moderationRules' => $blueprint->moderation_rules ?? [],
            'resultReleaseRules' => $blueprint->result_release_rules ?? [],
            'progressionRules' => $blueprint->progression_rules ?? [],
            'certificateRules' => $blueprint->certificate_rules ?? [],
            'graduationRules' => $blueprint->graduation_rules ?? [],
            'status' => $blueprint->status,
            'components' => $blueprint->components->map(fn (AssessmentComponent $component) => [
                'id' => $component->id,
                'type' => $component->type,
                'title' => $component->title,
                'description' => $component->description,
                'weight' => (float) $component->weight,
                'passMark' => $component->pass_mark !== null ? (float) $component->pass_mark : null,
                'maxAttempts' => $component->max_attempts,
                'requiresExamBooking' => (bool) $component->requires_exam_booking,
                'requiresExamClinic' => (bool) $component->requires_exam_clinic,
                'questionBankId' => $component->question_bank_id,
                'questionBankTitle' => $component->questionBank?->title,
                'rubric' => $component->rubric ?? [],
                'gradingRules' => $component->grading_rules ?? [],
                'moderationRules' => $component->moderation_rules ?? [],
                'opensAt' => $component->opens_at?->toISOString(),
                'closesAt' => $component->closes_at?->toISOString(),
                'resultsReleaseAt' => $component->results_release_at?->toISOString(),
                'status' => $component->status,
            ]),
        ];
    }

    private function mapQuestionBank(QuestionBank $bank): array
    {
        return [
            'id' => $bank->id,
            'moduleId' => $bank->module_id,
            'moduleTitle' => $bank->module?->title,
            'title' => $bank->title,
            'description' => $bank->description,
            'outcomes' => $bank->outcomes ?? [],
            'selectionRules' => $bank->selection_rules ?? [],
            'status' => $bank->status,
        ];
    }
}

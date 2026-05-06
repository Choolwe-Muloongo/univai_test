<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Enrollment;
use App\Models\Invoice;
use App\Models\StateTransition;
use App\Models\User;
use App\Services\StateTransitionService;
use Illuminate\Http\Request;

class AdminStateTransitionsController extends Controller
{
    public function __construct(private readonly StateTransitionService $stateTransitions)
    {
    }

    public function index(Request $request)
    {
        $query = StateTransition::query()->orderByDesc('created_at');

        if ($request->filled('subjectType')) {
            $query->where('subject_type', $request->query('subjectType'));
        }

        if ($request->filled('subjectId')) {
            $query->where('subject_id', (string) $request->query('subjectId'));
        }

        return $query->limit(200)->get()->map(fn (StateTransition $transition) => $this->mapTransition($transition));
    }

    public function store(Request $request)
    {
        $payload = $request->validate([
            'subjectType' => ['required', 'string'],
            'subjectId' => ['required'],
            'newState' => ['required', 'string'],
            'trigger' => ['nullable', 'string'],
            'reason' => ['nullable', 'string'],
            'metadata' => ['nullable', 'array'],
            'notify' => ['nullable', 'boolean'],
            'notification' => ['nullable', 'array'],
            'appealOption' => ['nullable', 'array'],
            'reapplyOption' => ['nullable', 'array'],
        ]);

        [$subject, $stateField, $attributes] = $this->resolveSubject(
            $payload['subjectType'],
            (string) $payload['subjectId'],
            $payload['newState']
        );

        if (!$subject) {
            return response()->json(['message' => 'Transition subject not found.'], 404);
        }

        $transition = $this->stateTransitions->transition(
            $subject,
            $stateField,
            $payload['newState'],
            $payload['trigger'] ?? 'admin.state.changed',
            $request,
            $payload['reason'] ?? null,
            $payload['metadata'] ?? [],
            ($payload['notify'] ?? false) ? ($payload['notification'] ?? []) : null,
            $payload['appealOption'] ?? ['allowed' => false],
            $payload['reapplyOption'] ?? ['allowed' => false],
            $attributes
        );

        return response()->json($transition ? $this->mapTransition($transition) : [
            'message' => 'No state change was recorded because the subject is already in the requested state.',
        ], $transition ? 201 : 200);
    }

    private function resolveSubject(string $subjectType, string $subjectId, string $newState): array
    {
        return match ($subjectType) {
            'student', 'lecturer', 'employer', 'admin', 'alumni', 'user' => [User::find($subjectId), 'role', []],
            'programme_application', 'program_application', 'application' => [
                Application::where('reference', $subjectId)->first() ?? Application::find($subjectId),
                'status',
                [],
            ],
            'subscription', 'invoice' => [Invoice::find($subjectId), 'status', []],
            'enrollment' => [Enrollment::find($subjectId), 'status', []],
            'alumni_enrollment' => [Enrollment::find($subjectId), 'status', ['status' => $newState]],
            default => [null, 'status', []],
        };
    }

    private function mapTransition(StateTransition $transition): array
    {
        return [
            'id' => $transition->id,
            'subjectType' => $transition->subject_type,
            'subjectId' => $transition->subject_id,
            'stateField' => $transition->state_field,
            'previousState' => $transition->previous_state,
            'newState' => $transition->new_state,
            'trigger' => $transition->trigger,
            'actorId' => $transition->actor_id,
            'actorType' => $transition->actor_type,
            'actorRole' => $transition->actor_role,
            'actorLabel' => $transition->actor_label,
            'reason' => $transition->reason,
            'metadata' => $transition->metadata ?? [],
            'notificationStatus' => $transition->notification_status,
            'notificationChannel' => $transition->notification_channel,
            'notificationRecipient' => $transition->notification_recipient,
            'notificationError' => $transition->notification_error,
            'appealOption' => $transition->appeal_option ?? ['allowed' => false],
            'reapplyOption' => $transition->reapply_option ?? ['allowed' => false],
            'createdAt' => optional($transition->created_at)->toISOString(),
        ];
    }
}

<?php

namespace App\Services;

use App\Models\StateTransition;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StateTransitionService
{
    public function __construct(private readonly StateTransitionNotifier $notifier)
    {
    }

    public function transition(
        Model $subject,
        string $stateField,
        string $newState,
        string $trigger,
        Request|array|null $actor = null,
        ?string $reason = null,
        array $metadata = [],
        ?array $notification = null,
        ?array $appealOption = null,
        ?array $reapplyOption = null,
        array $attributes = []
    ): ?StateTransition {
        $previousState = $subject->getAttribute($stateField);

        if ((string) $previousState === $newState && empty($attributes)) {
            return null;
        }

        $actorPayload = $this->resolveActor($actor);

        $transition = DB::transaction(function () use (
            $subject,
            $stateField,
            $newState,
            $trigger,
            $reason,
            $metadata,
            $appealOption,
            $reapplyOption,
            $attributes,
            $previousState,
            $actorPayload
        ) {
            $subject->forceFill(array_merge($attributes, [
                $stateField => $newState,
            ]));
            $subject->save();

            return StateTransition::create(array_merge($actorPayload, [
                'subject_type' => $subject->getMorphClass(),
                'subject_id' => (string) $subject->getKey(),
                'state_field' => $stateField,
                'previous_state' => $previousState,
                'new_state' => $newState,
                'trigger' => $trigger,
                'reason' => $reason,
                'metadata' => $metadata ?: null,
                'notification_status' => $notification === null ? 'skipped' : 'pending',
                'notification_channel' => $notification['channel'] ?? null,
                'notification_recipient' => $notification['recipient'] ?? null,
                'appeal_option' => $appealOption,
                'reapply_option' => $reapplyOption,
            ]));
        });

        if ($notification !== null) {
            $this->notifier->notify($transition, $subject, $notification);
        }

        return $transition->fresh();
    }

    public function recordInitialState(
        Model $subject,
        string $stateField,
        string $trigger,
        Request|array|null $actor = null,
        ?string $reason = null,
        array $metadata = [],
        ?array $notification = null,
        ?array $appealOption = null,
        ?array $reapplyOption = null
    ): StateTransition {
        $actorPayload = $this->resolveActor($actor);

        $transition = StateTransition::create(array_merge($actorPayload, [
            'subject_type' => $subject->getMorphClass(),
            'subject_id' => (string) $subject->getKey(),
            'state_field' => $stateField,
            'previous_state' => null,
            'new_state' => (string) $subject->getAttribute($stateField),
            'trigger' => $trigger,
            'reason' => $reason,
            'metadata' => $metadata ?: null,
            'notification_status' => $notification === null ? 'skipped' : 'pending',
            'notification_channel' => $notification['channel'] ?? null,
            'notification_recipient' => $notification['recipient'] ?? null,
            'appeal_option' => $appealOption,
            'reapply_option' => $reapplyOption,
        ]));

        if ($notification !== null) {
            $this->notifier->notify($transition, $subject, $notification);
        }

        return $transition->fresh();
    }

    private function resolveActor(Request|array|null $actor): array
    {
        if ($actor instanceof Request) {
            return $this->resolveActorFromSession($actor);
        }

        if (is_array($actor)) {
            return [
                'actor_id' => isset($actor['id']) && is_numeric($actor['id']) ? (int) $actor['id'] : null,
                'actor_type' => $actor['type'] ?? 'user',
                'actor_role' => $actor['role'] ?? null,
                'actor_label' => $actor['label'] ?? $actor['name'] ?? $actor['email'] ?? null,
            ];
        }

        return [
            'actor_id' => null,
            'actor_type' => 'system',
            'actor_role' => null,
            'actor_label' => 'System',
        ];
    }

    private function resolveActorFromSession(Request $request): array
    {
        $sessionUser = $request->session()->get('user');

        if (!is_array($sessionUser)) {
            return [
                'actor_id' => null,
                'actor_type' => 'anonymous',
                'actor_role' => null,
                'actor_label' => $request->ip(),
            ];
        }

        return [
            'actor_id' => isset($sessionUser['id']) && is_numeric($sessionUser['id']) ? (int) $sessionUser['id'] : null,
            'actor_type' => 'user',
            'actor_role' => $sessionUser['role'] ?? null,
            'actor_label' => $sessionUser['name'] ?? $sessionUser['email'] ?? null,
        ];
    }
}

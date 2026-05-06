<?php

namespace App\Services;

use App\Models\StateTransition;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Mail;

class StateTransitionNotifier
{
    public function notify(StateTransition $transition, Model $subject, ?array $notification = null): void
    {
        $notification = $notification ?? [];
        $recipient = $notification['recipient'] ?? $this->resolveRecipient($subject);

        if (!$recipient) {
            $transition->update([
                'notification_status' => 'skipped',
                'notification_channel' => null,
                'notification_recipient' => null,
                'notification_error' => 'No recipient resolved for transition subject.',
            ]);

            return;
        }

        $channel = $notification['channel'] ?? 'mail';
        $subjectLine = $notification['subject'] ?? 'UnivAI state update';
        $message = $notification['message'] ?? $this->defaultMessage($transition);

        $transition->update([
            'notification_status' => 'pending',
            'notification_channel' => $channel,
            'notification_recipient' => $recipient,
            'notification_error' => null,
        ]);

        if ($channel !== 'mail') {
            $transition->update([
                'notification_status' => 'skipped',
                'notification_error' => "Unsupported notification channel [{$channel}].",
            ]);

            return;
        }

        try {
            Mail::raw($message, function ($mail) use ($recipient, $subjectLine) {
                $mail->to($recipient)->subject($subjectLine);
            });

            $transition->update([
                'notification_status' => 'sent',
                'notification_error' => null,
            ]);
        } catch (\Throwable $exception) {
            $transition->update([
                'notification_status' => 'failed',
                'notification_error' => $exception->getMessage(),
            ]);
        }
    }

    private function resolveRecipient(Model $subject): ?string
    {
        if (isset($subject->email) && is_string($subject->email)) {
            return $subject->email;
        }

        if (method_exists($subject, 'student') && $subject->student) {
            return $subject->student->email;
        }

        if (method_exists($subject, 'user') && $subject->user) {
            return $subject->user->email;
        }

        return null;
    }

    private function defaultMessage(StateTransition $transition): string
    {
        return "Your UnivAI state changed from {$transition->previous_state} to {$transition->new_state}.";
    }
}

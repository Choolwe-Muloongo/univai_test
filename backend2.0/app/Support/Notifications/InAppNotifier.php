<?php

namespace App\Support\Notifications;

use App\Models\FeedbackPost;
use App\Models\InAppNotification;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Collection;

class InAppNotifier
{
    public function notify(string $userKey, string $title, ?string $body = null, ?string $href = null, string $type = 'general'): InAppNotification
    {
        return InAppNotification::create([
            'user_key' => $userKey,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'href' => $href,
        ]);
    }

    public function notifyAdmins(string $title, ?string $body = null, ?string $href = null, string $type = 'admin'): void
    {
        $this->adminKeys()->each(fn (string $adminKey) => $this->notify($adminKey, $title, $body, $href, $type));
    }

    public function notifyFeedbackCreated(FeedbackPost $post): void
    {
        $typeLabel = match ($post->type) {
            'bug' => 'bug report',
            'feature' => 'feature request',
            'rating' => 'app rating',
            default => 'suggestion',
        };

        $this->notifyAdmins(
            'New ' . $typeLabel . ' posted',
            ($post->author_name ?: 'A student') . " posted: '{$post->title}'.",
            '/admin/feedback',
            'feedback'
        );

        if ($post->type === 'rating' && $post->rating !== null && $post->rating <= 3) {
            $this->notifyAdmins(
                'Low app rating needs review',
                "A student rated UnivAI {$post->rating}/5: '{$post->title}'.",
                '/admin/feedback',
                'rating'
            );
        }
    }

    public function notifyFeedbackVoteMilestone(FeedbackPost $post): void
    {
        $milestones = [10, 25, 50, 100, 250, 500];
        if (!in_array((int) $post->upvotes_count, $milestones, true)) {
            return;
        }

        $marker = 'feedback_milestone_' . $post->id . '_' . $post->upvotes_count;
        if (InAppNotification::where('type', $marker)->exists()) {
            return;
        }

        $this->notifyAdmins(
            'Feedback request is trending',
            "'{$post->title}' has reached {$post->upvotes_count} votes.",
            '/admin/feedback',
            $marker
        );
    }

    public function notifyInvoiceCreated(Invoice $invoice): void
    {
        $this->notify(
            (string) $invoice->student_id,
            'New invoice created',
            "{$invoice->title} is ready for payment.",
            '/student/payments',
            'invoice'
        );
    }

    public function notifyPaymentSuccessful(Invoice $invoice): void
    {
        $this->notify(
            (string) $invoice->student_id,
            'Payment confirmed',
            "Payment for {$invoice->title} was confirmed and access was updated.",
            '/student/payments',
            'payment'
        );
    }

    public function notifyPaymentNeedsAttention(Invoice $invoice, string $message): void
    {
        $this->notify(
            (string) $invoice->student_id,
            'Payment needs attention',
            $message,
            '/student/payments',
            'payment'
        );
    }

    public function notifyMonthlyRatingReminder(array $sessionUser): ?InAppNotification
    {
        $userKey = (string) ($sessionUser['id'] ?? $sessionUser['email'] ?? '');
        if (!$userKey) {
            return null;
        }

        $alreadySent = InAppNotification::where('user_key', $userKey)
            ->where('type', 'rating_reminder')
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->exists();

        if ($alreadySent) {
            return null;
        }

        return $this->notify(
            $userKey,
            'Help us improve UnivAI',
            'Got a minute? Tell us what feels confusing, missing, or useful.',
            '/student/suggestions',
            'rating_reminder'
        );
    }

    private function adminKeys(): Collection
    {
        $keys = User::query()
            ->whereIn('role', ['admin', 'exam-officer'])
            ->pluck('id')
            ->map(fn ($id) => (string) $id);

        if ($keys->isEmpty()) {
            return collect(['admin-1']);
        }

        return $keys;
    }
}

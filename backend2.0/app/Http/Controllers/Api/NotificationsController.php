<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->session()->get('user');
        $userId = is_array($user) ? ($user['id'] ?? null) : null;
        $email = is_array($user) ? ($user['email'] ?? null) : null;

        if (!$userId && !$email) {
            return response()->json([]);
        }

        return Notification::query()
            ->where(function ($query) use ($userId, $email) {
                if ($userId && is_numeric($userId)) {
                    $query->orWhere('user_id', (int) $userId);
                }
                if ($email) {
                    $query->orWhere('recipient_email', $email);
                }
            })
            ->orderByRaw("case priority when 'critical' then 0 when 'high' then 1 else 2 end")
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn (Notification $notification) => $this->mapNotification($notification));
    }

    public function markRead(Request $request, Notification $notification)
    {
        $user = $request->session()->get('user');
        $userId = is_array($user) ? ($user['id'] ?? null) : null;
        $email = is_array($user) ? ($user['email'] ?? null) : null;

        $ownsNotification = ($userId && is_numeric($userId) && (int) $notification->user_id === (int) $userId)
            || ($email && $notification->recipient_email === $email);

        if (!$ownsNotification) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $notification->update(['read_at' => now()]);

        return response()->json($this->mapNotification($notification));
    }

    private function mapNotification(Notification $notification): array
    {
        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'category' => $notification->category,
            'title' => $notification->title,
            'message' => $notification->message,
            'actionUrl' => $notification->action_url,
            'priority' => $notification->priority,
            'channels' => $notification->channels ?? [],
            'data' => $notification->data ?? [],
            'readAt' => optional($notification->read_at)->toISOString(),
            'createdAt' => optional($notification->created_at)->toISOString(),
        ];
    }
}

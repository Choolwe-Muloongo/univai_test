<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InAppNotification;
use Illuminate\Http\Request;

class NotificationsController extends Controller
{
    public function index(Request $request)
    {
        $userKey = $this->userKey($request);
        $items = InAppNotification::where('user_key', $userKey)
            ->orderByRaw('read_at is null desc')
            ->orderByDesc('created_at')
            ->limit(30)
            ->get();

        return response()->json([
            'items' => $items->map(fn (InAppNotification $notification) => $this->mapNotification($notification)),
            'unreadCount' => InAppNotification::where('user_key', $userKey)->whereNull('read_at')->count(),
        ]);
    }

    public function markRead(Request $request, InAppNotification $notification)
    {
        if ($notification->user_key !== $this->userKey($request)) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $notification->forceFill(['read_at' => now()])->save();

        return response()->json($this->mapNotification($notification));
    }

    public function markAllRead(Request $request)
    {
        InAppNotification::where('user_key', $this->userKey($request))
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['status' => 'ok', 'unreadCount' => 0]);
    }

    protected function mapNotification(InAppNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'body' => $notification->body,
            'href' => $notification->href,
            'readAt' => $notification->read_at?->toISOString(),
            'createdAt' => $notification->created_at?->toISOString(),
        ];
    }

    protected function userKey(Request $request): string
    {
        $user = $request->session()->get('user');
        return is_array($user) ? (string) ($user['id'] ?? $user['email'] ?? $request->session()->getId()) : $request->session()->getId();
    }
}

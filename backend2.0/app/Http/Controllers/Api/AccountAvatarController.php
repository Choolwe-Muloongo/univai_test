<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AccountAvatarController extends Controller
{
    public function store(Request $request)
    {
        $payload = $request->validate([
            'avatar' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $sessionUser = $request->session()->get('user');
        $userId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;
        $folderKey = $this->folderKey($userId, $request->session()->getId());
        $file = $payload['avatar'];
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('avatars/' . $folderKey, $filename, 'public');
        $url = Storage::disk('public')->url($path);

        if ($userId && is_numeric($userId)) {
            $user = User::with('profile', 'activeSubscription', 'activeEntitlements')->find((int) $userId);
            if ($user) {
                $this->deleteOldAvatar($user->avatar);
                $this->deleteOldAvatar($user->profile?->avatar);

                $user->forceFill(['avatar' => $url])->save();
                UserProfile::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'display_name' => $user->profile?->display_name ?: $user->name,
                        'avatar' => $url,
                        'completion_percent' => max((int) ($user->profile?->completion_percent ?? 0), 25),
                    ]
                );
            }
        }

        if (is_array($sessionUser)) {
            $profile = is_array($sessionUser['profile'] ?? null) ? $sessionUser['profile'] : [];
            $profile['avatar'] = $url;
            $profile['displayName'] = $profile['displayName'] ?? ($sessionUser['name'] ?? null);
            $sessionUser['avatar'] = $url;
            $sessionUser['profile'] = $profile;
            $request->session()->put('user', $sessionUser);
        }

        return response()->json([
            'avatar' => $url,
            'url' => $url,
        ], 201);
    }

    private function deleteOldAvatar(?string $url): void
    {
        if (!$url || !str_contains($url, '/storage/avatars/')) {
            return;
        }

        $path = ltrim(Str::after($url, '/storage/'), '/');
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    private function folderKey($userId, string $sessionId): string
    {
        $raw = $userId ? 'user-' . $userId : 'session-' . $sessionId;
        $safe = preg_replace('/[^A-Za-z0-9_-]+/', '-', (string) $raw) ?: 'guest';
        return trim($safe, '-') ?: 'guest';
    }
}

<?php

namespace App\Http\Middleware;

use App\Models\LecturerApplication;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveLecturer
{
    private const ACTIVE_STATUSES = ['accepted', 'active', 'approved'];
    private const BLOCKED_STATUSES = ['submitted', 'pending', 'rejected', 'suspended'];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->session()->get('user');
        $role = is_array($user) ? ($user['role'] ?? null) : null;

        if ($role !== 'lecturer') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $status = $this->lecturerStatus($user);
        if ($status && !in_array($status, self::ACTIVE_STATUSES, true)) {
            return response()->json([
                'message' => 'Lecturer access is not active.',
                'lecturerStatus' => $status,
            ], in_array($status, self::BLOCKED_STATUSES, true) ? 403 : 403);
        }

        return $next($request);
    }

    private function lecturerStatus(array $user): ?string
    {
        $sessionStatus = !empty($user['lecturerStatus']) && is_string($user['lecturerStatus'])
            ? strtolower($user['lecturerStatus'])
            : null;

        $email = $user['email'] ?? null;
        if (!is_string($email) || trim($email) === '') {
            return $sessionStatus;
        }

        $application = LecturerApplication::query()
            ->where('email', strtolower(trim($email)))
            ->orWhere('email', trim($email))
            ->orderByDesc('reviewed_at')
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->first();

        return $application?->status ? strtolower($application->status) : $sessionStatus;
    }
}

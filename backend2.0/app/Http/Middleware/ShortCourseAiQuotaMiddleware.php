<?php

namespace App\Http\Middleware;

use App\Support\Ai\ShortCourseAiQuota;
use Closure;
use Illuminate\Http\Request;

class ShortCourseAiQuotaMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $feature = (string) $request->input('feature', '');
        $tier = (string) $request->input('accessTier', '');
        $courseId = $request->input('courseId') ?: $request->input('shortCourseId');
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;

        $applies = str_contains($feature, 'short_course') || $tier === 'short-course' || $courseId;
        if (!$applies || !$studentId || !is_numeric($studentId)) {
            return $next($request);
        }

        $quota = ShortCourseAiQuota::checkAndIncrement((int) $studentId, $courseId ? (string) $courseId : null);
        if (!$quota['allowed']) {
            return response()->json([
                'error' => 'AI quota reached for this short-course account.',
                'quota' => $quota,
            ], 429);
        }

        $request->attributes->set('short_course_ai_quota', $quota);
        return $next($request);
    }
}

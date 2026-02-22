<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->session()->get('user');
        $role = is_array($user) ? ($user['role'] ?? null) : null;

        if (!$role) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $allowed = collect($roles);

        if ($allowed->contains($role)) {
            return $next($request);
        }

        if ($allowed->contains('student')) {
            if (str_contains($role, 'student') || $role === 'enrolled') {
                return $next($request);
            }
        }

        if ($allowed->contains('applicant') && $role === 'applicant') {
            return $next($request);
        }

        return response()->json(['message' => 'Forbidden'], 403);
    }
}

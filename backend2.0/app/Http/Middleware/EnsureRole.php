<?php

namespace App\Http\Middleware;

use App\Support\Access\AccessControl;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function __construct(private readonly AccessControl $accessControl)
    {
    }

    public function handle(Request $request, Closure $next, string ...$abilities): Response
    {
        $decision = $this->accessControl->authorize(
            $request->session()->get('user'),
            $abilities,
        );

        if ($decision->allowed) {
            return $next($request);
        }

        if (in_array('ai.generate', $abilities, true) && $this->isAllowedAiStudent($request)) {
            return $next($request);
        }

        return response()->json(['message' => $decision->reason], $decision->status);
    }

    private function isAllowedAiStudent(Request $request): bool
    {
        $user = $request->session()->get('user');
        if (!is_array($user) || empty($user['id'])) {
            return false;
        }

        $role = $user['role'] ?? null;
        return in_array($role, [
            AccessControl::ROLE_STUDENT,
            AccessControl::ROLE_FREE_STUDENT,
            AccessControl::ROLE_FREEMIUM_STUDENT,
            AccessControl::ROLE_CERTIFICATE_STUDENT,
            AccessControl::ROLE_PAID_CERTIFICATE_STUDENT,
            AccessControl::ROLE_PREMIUM_STUDENT,
            AccessControl::ROLE_PROGRAMME_STUDENT,
            AccessControl::ROLE_PROGRAM_STUDENT,
            AccessControl::ROLE_ENROLLED,
        ], true);
    }
}

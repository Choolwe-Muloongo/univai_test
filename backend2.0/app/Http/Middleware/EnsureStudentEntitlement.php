<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\StudentAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStudentEntitlement
{
    public function handle(Request $request, Closure $next, string $entitlement): Response
    {
        $sessionUser = $request->session()->get('user');
        if (!is_array($sessionUser)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $dbUser = null;
        if (isset($sessionUser['id']) && is_numeric($sessionUser['id'])) {
            $dbUser = User::find((int) $sessionUser['id']);
        }

        $sessionUser = StudentAccess::sessionPayload($sessionUser);
        $request->session()->put('user', $sessionUser);

        if (!StudentAccess::userHasEntitlement($dbUser, $entitlement, $sessionUser)) {
            return response()->json([
                'message' => 'Your current student access tier does not include this resource.',
                'requiredEntitlement' => $entitlement,
                'accessTier' => $sessionUser['accessTier'],
            ], 403);
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\AdminAccess;
use App\Support\AuditLogger;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSessionUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->session()->get('user');

        if (!is_array($user) || empty($user['id'])) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if (is_numeric($user['id'])) {
            $freshUser = User::find((int) $user['id']);
            if (!$freshUser) {
                $request->session()->forget('user');
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            if ($freshUser->suspended_at !== null) {
                AuditLogger::log($request, 'access.suspended_denied', 'user', (string) $freshUser->id, [
                    'role' => $freshUser->role,
                    'path' => $request->path(),
                ]);
                $request->session()->forget('user');
                return response()->json(['message' => 'Account suspended'], 403);
            }

            if (AdminAccess::isAdminRole($user['role'] ?? null) && $freshUser->role !== ($user['role'] ?? null)) {
                $request->session()->put('user', array_merge($user, [
                    'role' => $freshUser->role,
                    'adminPermissions' => AdminAccess::permissionsForRole($freshUser->role),
                ]));
            }
        } elseif (AdminAccess::isAdminRole($user['role'] ?? null) && !empty($user['suspendedAt'])) {
            $request->session()->forget('user');
            return response()->json(['message' => 'Account suspended'], 403);
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Middleware;

use App\Support\AdminAccess;
use App\Support\AuditLogger;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->session()->get('user');
        $role = is_array($user) ? ($user['role'] ?? null) : null;

        if (!is_string($role) || !AdminAccess::roleHasPermission($role, $permission)) {
            AuditLogger::log($request, 'admin.permission.denied', 'permission', $permission, [
                'method' => $request->method(),
                'path' => $request->path(),
                'role' => $role,
            ]);

            return response()->json([
                'message' => 'Forbidden',
                'requiredPermission' => $permission,
            ], 403);
        }

        $request->attributes->set('admin_permission', $permission);

        return $next($request);
    }
}

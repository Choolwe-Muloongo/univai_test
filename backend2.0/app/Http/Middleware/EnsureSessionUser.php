<?php

namespace App\Http\Middleware;

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

        return $next($request);
    }
}

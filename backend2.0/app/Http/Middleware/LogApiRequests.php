<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequests
{
    private const SLOW_REQUEST_MS = 1000;

    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);
        $response = $next($request);

        $durationMs = (int) round((microtime(true) - $start) * 1000);
        $status = $response->getStatusCode();

        if ($durationMs < self::SLOW_REQUEST_MS && $status < 400) {
            return $response;
        }

        $sessionUser = $request->session()->get('user');
        $userId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;

        logger()->info('api_request', [
            'method' => $request->method(),
            'path' => $request->path(),
            'status' => $status,
            'duration_ms' => $durationMs,
            'user_id' => $userId,
            'ip' => $request->ip(),
        ]);

        return $response;
    }
}

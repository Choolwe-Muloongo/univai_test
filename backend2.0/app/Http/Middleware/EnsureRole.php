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

        return response()->json(['message' => $decision->reason], $decision->status);
    }
}

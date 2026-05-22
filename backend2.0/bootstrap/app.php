<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append([
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);

        $middleware->alias([
            'session.auth' => \App\Http\Middleware\EnsureSessionUser::class,
            'role' => \App\Http\Middleware\EnsureRole::class,
            'access' => \App\Http\Middleware\EnsureRole::class,
        ]);

        $middleware->api(prepend: [
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \App\Http\Middleware\LogApiRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->report(function (\Throwable $e) {
            try {
                \App\Support\BetaReports\BetaErrorReporter::capture($e, request());
            } catch (\Throwable) {
                // Error reporting must never break the app.
            }
        });

        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if (!$request->is('api/*')) {
                return null;
            }

            $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

            if (!config('app.debug')) {
                return response()->json([
                    'message' => $status === 500 ? 'Server error' : ($e->getMessage() ?: 'Request failed'),
                    'status' => $status,
                ], $status);
            }

            return response()->json([
                'message' => $e->getMessage() ?: get_class($e),
                'exception' => get_class($e),
                'status' => $status,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], $status);
        });
    })->create();

<?php

namespace App\Support\BetaReports;

use App\Models\BetaReport;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Throwable;

class BetaErrorReporter
{
    public static function capture(Throwable $exception, ?Request $request = null, array $context = []): void
    {
        try {
            if (!self::shouldCapture($exception, $request)) {
                return;
            }

            $sessionUser = $request?->session()?->get('user');
            $userId = is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])
                ? (int) $sessionUser['id']
                : null;

            $message = $exception->getMessage() ?: get_class($exception);
            $title = self::titleFor($exception, $message);

            BetaReport::create([
                'user_id' => $userId,
                'type' => 'error',
                'source' => self::sourceFor($request),
                'severity' => self::severityFor($exception),
                'status' => 'open',
                'title' => $title,
                'description' => self::descriptionFor($exception, $request),
                'page_url' => $request?->fullUrl(),
                'browser' => $request?->userAgent(),
                'device' => null,
                'error_name' => get_class($exception),
                'error_message' => Str::limit($message, 5000, '...'),
                'stack_trace' => Str::limit($exception->getTraceAsString(), 20000, '...'),
                'context' => array_merge([
                    'method' => $request?->method(),
                    'path' => $request?->path(),
                    'route' => optional($request?->route())->uri(),
                    'ip' => $request?->ip(),
                    'file' => $exception->getFile(),
                    'line' => $exception->getLine(),
                    'code' => $exception->getCode(),
                ], $context),
            ]);
        } catch (Throwable) {
            // Never allow error reporting to create another application failure.
        }
    }

    private static function shouldCapture(Throwable $exception, ?Request $request): bool
    {
        $class = get_class($exception);
        $ignored = [
            \Symfony\Component\HttpKernel\Exception\NotFoundHttpException::class,
            \Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException::class,
            \Illuminate\Auth\AuthenticationException::class,
            \Illuminate\Validation\ValidationException::class,
        ];

        foreach ($ignored as $ignoredClass) {
            if ($exception instanceof $ignoredClass) {
                return false;
            }
        }

        if ($request && $request->is('api/beta-reports*')) {
            return false;
        }

        return !str_contains($class, 'ThrottleRequestsException');
    }

    private static function severityFor(Throwable $exception): string
    {
        if ($exception instanceof QueryException) {
            return 'critical';
        }

        if ($exception instanceof \Error || $exception instanceof \TypeError || $exception instanceof \ParseError) {
            return 'critical';
        }

        $status = method_exists($exception, 'getStatusCode') ? (int) $exception->getStatusCode() : 500;
        if ($status >= 500) {
            return 'high';
        }

        return 'medium';
    }

    private static function titleFor(Throwable $exception, string $message): string
    {
        if ($exception instanceof QueryException) {
            return 'SQL/database error: ' . Str::limit($message, 120, '...');
        }

        return class_basename($exception) . ': ' . Str::limit($message, 140, '...');
    }

    private static function descriptionFor(Throwable $exception, ?Request $request): string
    {
        return trim(sprintf(
            "Automatic backend error report.\n\nException: %s\nMethod: %s\nPath: %s\nFile: %s:%s",
            get_class($exception),
            $request?->method() ?? 'unknown',
            $request?->path() ?? 'unknown',
            $exception->getFile(),
            $exception->getLine()
        ));
    }

    private static function sourceFor(?Request $request): string
    {
        if (!$request) {
            return 'backend-auto';
        }

        if ($request->is('api/admin/*')) {
            return 'backend-admin-auto';
        }

        if ($request->is('api/students/*')) {
            return 'backend-student-auto';
        }

        return 'backend-auto';
    }
}

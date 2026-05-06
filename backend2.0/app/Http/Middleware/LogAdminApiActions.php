<?php

namespace App\Http\Middleware;

use App\Support\AuditLogger;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogAdminApiActions
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        AuditLogger::log($request, 'admin.action', 'api_route', $request->path(), [
            'method' => $request->method(),
            'status' => $response->getStatusCode(),
            'permission' => $request->attributes->get('admin_permission'),
            'route' => optional($request->route())->uri(),
        ]);

        return $response;
    }
}

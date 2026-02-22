<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;

class AdminAuditController extends Controller
{
    public function index()
    {
        return AuditLog::query()
            ->orderByDesc('created_at')
            ->limit(200)
            ->get()
            ->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'actorId' => $log->actor_id,
                'actorRole' => $log->actor_role,
                'action' => $log->action,
                'targetType' => $log->target_type,
                'targetId' => $log->target_id,
                'payload' => $log->payload,
                'ipAddress' => $log->ip_address,
                'createdAt' => optional($log->created_at)->toISOString(),
            ]);
    }
}

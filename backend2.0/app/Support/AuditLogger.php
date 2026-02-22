<?php

namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogger
{
    public static function log(Request $request, string $action, ?string $targetType = null, ?string $targetId = null, array $payload = []): void
    {
        $sessionUser = $request->session()->get('user');
        $actorId = null;
        if (is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])) {
            $actorId = (int) $sessionUser['id'];
        }

        AuditLog::create([
            'actor_id' => $actorId,
            'actor_role' => is_array($sessionUser) ? ($sessionUser['role'] ?? null) : null,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'payload' => $payload ?: null,
            'ip_address' => $request->ip(),
        ]);
    }
}

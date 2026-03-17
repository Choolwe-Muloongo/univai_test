<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicPolicy;
use App\Models\Application;
use App\Models\CourseLecturerAssignment;
use App\Models\ExceptionCase;
use App\Models\Invoice;
use App\Models\RouteChangeRequest;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminExceptionsController extends Controller
{
    private const DOMAIN_MAP = [
        'admissions' => Application::class,
        'finance' => Invoice::class,
        'policies' => AcademicPolicy::class,
        'assignments' => CourseLecturerAssignment::class,
        'route_changes' => RouteChangeRequest::class,
    ];

    public function index(string $domain, string $targetId)
    {
        [$targetType] = $this->resolveTarget($domain, $targetId);

        return ExceptionCase::query()
            ->where('exceptionable_type', $targetType)
            ->where('exceptionable_id', $targetId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function escalate(Request $request, string $domain, string $targetId)
    {
        [$targetType] = $this->resolveTarget($domain, $targetId);
        $payload = $this->validatePayload($request);

        $case = $this->openCase($request, $targetType, $targetId, $payload);
        $this->transition($request, $case, 'under_review');

        return response()->json($case->fresh());
    }

    public function overrideWithApproval(Request $request, string $domain, string $targetId)
    {
        [$targetType] = $this->resolveTarget($domain, $targetId);
        $payload = $this->validatePayload($request);

        $case = $this->openCase($request, $targetType, $targetId, $payload);
        $this->transition($request, $case, 'approved_override');

        return response()->json($case->fresh());
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'exceptionType' => ['required', 'string'],
            'reasonCode' => ['required', 'string'],
            'evidenceAttachments' => ['required', 'array', 'min:1'],
            'evidenceAttachments.*' => ['required', 'string'],
            'escalationTargetType' => ['required', Rule::in(['role', 'user'])],
            'escalationTargetId' => ['required', 'string'],
            'approvalChain' => ['required', 'array', 'min:1'],
            'approvalChain.*' => ['required', 'string'],
            'expiryRollbackCondition' => ['required', 'string'],
        ]);
    }

    private function resolveTarget(string $domain, string $targetId): array
    {
        $targetType = self::DOMAIN_MAP[$domain] ?? null;
        abort_if(!$targetType, 422, 'Unsupported exception domain.');

        if ($domain === 'finance' && $targetId === 'report') {
            return [$targetType, null];
        }

        $record = $targetType::query()->find($targetId);
        abort_if(!$record, 404, 'Record not found.');

        return [$targetType, $record];
    }

    private function openCase(Request $request, string $targetType, string $targetId, array $payload): ExceptionCase
    {
        $sessionUser = $request->session()->get('user');
        $actorId = is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])
            ? (int) $sessionUser['id']
            : null;

        $case = ExceptionCase::create([
            'exceptionable_type' => $targetType,
            'exceptionable_id' => $targetId,
            'exception_type' => $payload['exceptionType'],
            'reason_code' => $payload['reasonCode'],
            'evidence_attachments' => $payload['evidenceAttachments'],
            'escalation_target_type' => $payload['escalationTargetType'],
            'escalation_target_id' => $payload['escalationTargetId'],
            'approval_chain' => $payload['approvalChain'],
            'expiry_rollback_condition' => $payload['expiryRollbackCondition'],
            'status' => 'open',
            'created_by' => $actorId,
            'updated_by' => $actorId,
        ]);

        AuditLogger::log($request, 'exception.state_transition', 'exception_case', (string) $case->id, [
            'from' => null,
            'to' => 'open',
            'domainTargetType' => $targetType,
            'domainTargetId' => $targetId,
        ]);

        return $case;
    }

    private function transition(Request $request, ExceptionCase $case, string $status): void
    {
        abort_unless(in_array($status, ExceptionCase::STATUSES, true), 422, 'Unsupported status.');

        $sessionUser = $request->session()->get('user');
        $actorId = is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])
            ? (int) $sessionUser['id']
            : null;

        $previousStatus = $case->status;

        $case->update([
            'status' => $status,
            'updated_by' => $actorId,
            'closed_at' => in_array($status, ['rejected', 'closed'], true) ? now() : null,
        ]);

        AuditLogger::log($request, 'exception.state_transition', 'exception_case', (string) $case->id, [
            'from' => $previousStatus,
            'to' => $status,
            'domainTargetType' => $case->exceptionable_type,
            'domainTargetId' => $case->exceptionable_id,
        ]);
    }
}

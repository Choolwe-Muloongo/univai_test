<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BetaReport;
use Illuminate\Http\Request;

class BetaReportController extends Controller
{
    public function store(Request $request)
    {
        $payload = $request->validate([
            'type' => ['required', 'string', 'in:error,feature,improvement,other'],
            'source' => ['nullable', 'string', 'max:50'],
            'severity' => ['nullable', 'string', 'in:low,medium,high,critical'],
            'title' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:5000'],
            'pageUrl' => ['nullable', 'string', 'max:1000'],
            'browser' => ['nullable', 'string', 'max:255'],
            'device' => ['nullable', 'string', 'max:255'],
            'errorName' => ['nullable', 'string', 'max:255'],
            'errorMessage' => ['nullable', 'string', 'max:5000'],
            'stackTrace' => ['nullable', 'string', 'max:20000'],
            'context' => ['nullable', 'array'],
        ]);

        $sessionUser = $request->session()->get('user');
        $userId = is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])
            ? (int) $sessionUser['id']
            : null;

        $report = BetaReport::create([
            'user_id' => $userId,
            'type' => $payload['type'],
            'source' => $payload['source'] ?? 'student',
            'severity' => $payload['severity'] ?? 'medium',
            'status' => 'open',
            'title' => $payload['title'],
            'description' => $payload['description'] ?? null,
            'page_url' => $payload['pageUrl'] ?? null,
            'browser' => $payload['browser'] ?? $request->userAgent(),
            'device' => $payload['device'] ?? null,
            'error_name' => $payload['errorName'] ?? null,
            'error_message' => $payload['errorMessage'] ?? null,
            'stack_trace' => $payload['stackTrace'] ?? null,
            'context' => array_merge($payload['context'] ?? [], [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]),
        ]);

        return response()->json([
            'id' => $report->id,
            'message' => $payload['type'] === 'feature'
                ? 'Thank you. Your feature request has been sent to the UnivAI team.'
                : 'Thank you. Your report has been sent to the UnivAI team.',
        ], 201);
    }

    public function index(Request $request)
    {
        $status = $request->query('status');
        $type = $request->query('type');

        $reports = BetaReport::query()
            ->with('user:id,name,email,role')
            ->when($status, fn ($query) => $query->where('status', $status))
            ->when($type, fn ($query) => $query->where('type', $type))
            ->orderByRaw("CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END")
            ->orderByDesc('created_at')
            ->limit(300)
            ->get()
            ->map(fn (BetaReport $report) => $this->mapReport($report));

        return response()->json([
            'summary' => [
                'open' => BetaReport::where('status', 'open')->count(),
                'critical' => BetaReport::where('status', 'open')->where('severity', 'critical')->count(),
                'errors' => BetaReport::where('status', 'open')->where('type', 'error')->count(),
                'features' => BetaReport::where('status', 'open')->where('type', 'feature')->count(),
            ],
            'reports' => $reports,
        ]);
    }

    public function update(Request $request, BetaReport $betaReport)
    {
        $payload = $request->validate([
            'status' => ['required', 'string', 'in:open,reviewing,planned,resolved,closed'],
            'severity' => ['nullable', 'string', 'in:low,medium,high,critical'],
        ]);

        $sessionUser = $request->session()->get('user');
        $userId = is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])
            ? (int) $sessionUser['id']
            : null;

        $betaReport->update([
            'status' => $payload['status'],
            'severity' => $payload['severity'] ?? $betaReport->severity,
            'resolved_at' => in_array($payload['status'], ['resolved', 'closed'], true) ? now() : null,
            'resolved_by' => in_array($payload['status'], ['resolved', 'closed'], true) ? $userId : null,
        ]);

        return response()->json($this->mapReport($betaReport->fresh('user')));
    }

    private function mapReport(BetaReport $report): array
    {
        return [
            'id' => $report->id,
            'type' => $report->type,
            'source' => $report->source,
            'severity' => $report->severity,
            'status' => $report->status,
            'title' => $report->title,
            'description' => $report->description,
            'pageUrl' => $report->page_url,
            'browser' => $report->browser,
            'device' => $report->device,
            'errorName' => $report->error_name,
            'errorMessage' => $report->error_message,
            'stackTrace' => $report->stack_trace,
            'context' => $report->context,
            'user' => $report->user ? [
                'id' => $report->user->id,
                'name' => $report->user->name,
                'email' => $report->user->email,
                'role' => $report->user->role,
            ] : null,
            'createdAt' => optional($report->created_at)->toISOString(),
            'updatedAt' => optional($report->updated_at)->toISOString(),
        ];
    }
}

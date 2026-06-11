<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BetaReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Throwable;

class BetaReportController extends Controller
{
    private const REPORT_STATUSES = 'open,reviewing,planned,resolved,verifying,verified,failed_verification,closed';

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

        $reports = $this->baseQuery($status, $type)
            ->limit(300)
            ->get()
            ->map(fn (BetaReport $report) => $this->mapReport($report));

        return response()->json([
            'summary' => [
                'open' => BetaReport::whereIn('status', ['open', 'failed_verification'])->count(),
                'critical' => BetaReport::whereIn('status', ['open', 'failed_verification'])->where('severity', 'critical')->count(),
                'errors' => BetaReport::whereIn('status', ['open', 'failed_verification'])->where('type', 'error')->count(),
                'features' => BetaReport::whereIn('status', ['open', 'failed_verification'])->where('type', 'feature')->count(),
            ],
            'reports' => $reports,
        ]);
    }

    public function exportTxt(Request $request)
    {
        $status = $request->query('status');
        $type = $request->query('type');

        $reports = $this->baseQuery($status, $type)
            ->limit(1000)
            ->get();

        $lines = [];
        $lines[] = 'UNIVAI BETA REPORTS EXPORT';
        $lines[] = 'Generated: ' . now()->toDateTimeString();
        $lines[] = 'Filters: status=' . ($status ?: 'all') . ', type=' . ($type ?: 'all');
        $lines[] = 'Total exported: ' . $reports->count();
        $lines[] = str_repeat('=', 90);

        foreach ($reports as $report) {
            $verification = $this->verificationFrom($report);

            $lines[] = '';
            $lines[] = 'REPORT #' . $report->id;
            $lines[] = str_repeat('-', 90);
            $lines[] = 'Title: ' . $report->title;
            $lines[] = 'Type: ' . $report->type;
            $lines[] = 'Source: ' . $report->source;
            $lines[] = 'Severity: ' . $report->severity;
            $lines[] = 'Status: ' . $report->status;
            $lines[] = 'Verification: ' . ($verification['status'] ?? 'not_run');
            $lines[] = 'Verification Message: ' . ($verification['message'] ?? '-');
            $lines[] = 'Verification Attempts: ' . ($verification['attempts'] ?? 0);
            $lines[] = 'Last Checked: ' . ($verification['lastRunAt'] ?? '-');
            $lines[] = 'Created: ' . optional($report->created_at)->toDateTimeString();
            $lines[] = 'Updated: ' . optional($report->updated_at)->toDateTimeString();
            $lines[] = 'User: ' . ($report->user?->name ?? 'Unknown') . ' <' . ($report->user?->email ?? 'no-email') . '> ' . ($report->user?->role ? '[' . $report->user->role . ']' : '');
            $lines[] = 'Page URL: ' . ($report->page_url ?: '-');
            $lines[] = 'Browser: ' . ($report->browser ?: '-');
            $lines[] = 'Device: ' . ($report->device ?: '-');
            $lines[] = 'Error Name: ' . ($report->error_name ?: '-');
            $lines[] = 'Error Message: ' . ($report->error_message ?: '-');
            $lines[] = '';
            $lines[] = 'Description:';
            $lines[] = $report->description ?: '-';
            $lines[] = '';
            $lines[] = 'Context:';
            $lines[] = json_encode($report->context ?? [], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: '{}';
            $lines[] = '';
            $lines[] = 'Stack Trace:';
            $lines[] = $report->stack_trace ?: '-';
        }

        $content = implode("\n", $lines) . "\n";
        $filename = 'univai-beta-reports-' . now()->format('Ymd-His') . '.txt';

        return response($content, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    public function update(Request $request, BetaReport $betaReport)
    {
        $payload = $request->validate([
            'status' => ['required', 'string', 'in:' . self::REPORT_STATUSES],
            'severity' => ['nullable', 'string', 'in:low,medium,high,critical'],
        ]);

        $sessionUser = $request->session()->get('user');
        $userId = $this->sessionUserId($request);

        $betaReport->update([
            'status' => $payload['status'],
            'severity' => $payload['severity'] ?? $betaReport->severity,
            'resolved_at' => in_array($payload['status'], ['resolved', 'verified', 'closed'], true) ? now() : null,
            'resolved_by' => in_array($payload['status'], ['resolved', 'verified', 'closed'], true) ? $userId : null,
        ]);

        return response()->json($this->mapReport($betaReport->fresh('user')));
    }

    public function verify(Request $request, BetaReport $betaReport)
    {
        $userId = $this->sessionUserId($request);

        $betaReport = $this->writeVerification($betaReport, [
            'status' => 'running',
            'message' => 'Verification started.',
            'recipe' => 'safe-route-diagnostic',
        ], 'verifying', $userId);

        $result = $this->runVerification($betaReport);

        $nextStatus = $result['passed'] ? 'closed' : 'failed_verification';

        $betaReport = $this->writeVerification($betaReport, [
            'status' => $result['passed'] ? 'passed' : 'failed',
            'message' => $result['message'],
            'recipe' => $result['recipe'],
        ], $nextStatus, $userId);

        return response()->json($this->mapReport($betaReport->fresh('user')));
    }

    public function verifyAll(Request $request)
    {
        $status = $request->query('status') ?: 'open';
        $type = $request->query('type');
        $userId = $this->sessionUserId($request);

        $reports = $this->baseQuery($status, $type)
            ->where('status', '!=', 'closed')
            ->limit(200)
            ->get();

        $checked = 0;
        $closed = 0;
        $failed = 0;
        $skipped = 0;

        foreach ($reports as $report) {
            if ($report->type !== 'error') {
                $skipped++;
                continue;
            }

            $checked++;
            $report = $this->writeVerification($report, [
                'status' => 'running',
                'message' => 'Bulk verification started.',
                'recipe' => 'safe-route-diagnostic',
            ], 'verifying', $userId);

            $result = $this->runVerification($report);
            $nextStatus = $result['passed'] ? 'closed' : 'failed_verification';

            $this->writeVerification($report, [
                'status' => $result['passed'] ? 'passed' : 'failed',
                'message' => $result['message'],
                'recipe' => $result['recipe'],
            ], $nextStatus, $userId);

            if ($result['passed']) {
                $closed++;
            } else {
                $failed++;
            }
        }

        return response()->json([
            'checked' => $checked,
            'closed' => $closed,
            'failed' => $failed,
            'skipped' => $skipped,
            'message' => "Verification complete: {$checked} checked, {$closed} closed, {$failed} still failing" . ($skipped ? ", {$skipped} skipped" : '') . '.',
        ]);
    }

    private function runVerification(BetaReport $report): array
    {
        if ($report->type !== 'error') {
            return [
                'passed' => false,
                'recipe' => 'skipped-non-error',
                'message' => 'Only error reports can be automatically verified. Feature requests and improvements need human review.',
            ];
        }

        $context = $report->context ?? [];
        $method = strtoupper((string) (data_get($context, 'method') ?: $this->methodFromTitle($report->title) ?: 'GET'));
        $path = (string) (data_get($context, 'path') ?: $this->pathFromTitle($report->title) ?: $this->pathFromUrl($report->page_url));
        $status = (int) (data_get($context, 'status') ?: 0);
        $message = strtolower(trim(($report->error_message ?? '') . ' ' . ($report->title ?? '')));

        if (!$path) {
            return [
                'passed' => false,
                'recipe' => 'missing-path',
                'message' => 'No route/path was captured, so this report cannot be safely re-tested automatically.',
            ];
        }

        $routeSupported = $this->routeSupports($method, $path);

        $wasMethodOrMissingRouteFailure =
            $status === 404 ||
            $status === 405 ||
            str_contains($message, 'method is not supported') ||
            str_contains($message, 'not found') ||
            str_contains($message, 'route') && str_contains($message, 'not');

        if ($wasMethodOrMissingRouteFailure) {
            return [
                'passed' => $routeSupported,
                'recipe' => 'route-support-check',
                'message' => $routeSupported
                    ? "Fix verified. {$method} {$path} is now registered and accepts this route. Report closed automatically."
                    : "Still failing. {$method} {$path} is not registered or does not accept this HTTP method.",
            ];
        }

        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            return [
                'passed' => $routeSupported,
                'recipe' => 'safe-read-route-check',
                'message' => $routeSupported
                    ? "Safe check passed. {$method} {$path} is registered. Report closed automatically."
                    : "Still failing. {$method} {$path} is not registered.",
            ];
        }

        return [
            'passed' => false,
            'recipe' => 'unsafe-mutation-skipped',
            'message' => "Safe verification cannot repeat {$method} {$path}. This could change payments, passwords, enrollments, or data. Please test manually or add a dedicated diagnostic endpoint.",
        ];
    }

    private function routeSupports(string $method, string $path): bool
    {
        $method = strtoupper($method ?: 'GET');
        $clean = trim($path);
        if ($clean === '') {
            return false;
        }

        $clean = parse_url($clean, PHP_URL_PATH) ?: $clean;
        $clean = ltrim($clean, '/');

        $candidates = [$clean];

        if (!Str::startsWith($clean, 'api/')) {
            $candidates[] = 'api/' . $clean;
        } else {
            $candidates[] = Str::after($clean, 'api/');
        }

        foreach (array_unique($candidates) as $candidate) {
            try {
                Route::getRoutes()->match(Request::create('/' . ltrim($candidate, '/'), $method));
                return true;
            } catch (Throwable) {
                continue;
            }
        }

        return false;
    }

    private function writeVerification(BetaReport $report, array $verification, string $status, ?int $userId): BetaReport
    {
        $context = $report->context ?? [];
        $previous = is_array(data_get($context, 'verification')) ? data_get($context, 'verification') : [];
        $attempts = (int) ($previous['attempts'] ?? 0) + 1;

        $context['verification'] = array_merge($previous, $verification, [
            'attempts' => $attempts,
            'lastRunAt' => now()->toISOString(),
        ]);

        $report->update([
            'context' => $context,
            'status' => $status,
            'resolved_at' => in_array($status, ['resolved', 'verified', 'closed'], true) ? now() : null,
            'resolved_by' => in_array($status, ['resolved', 'verified', 'closed'], true) ? $userId : null,
        ]);

        return $report->fresh('user');
    }

    private function baseQuery(?string $status, ?string $type)
    {
        return BetaReport::query()
            ->with('user:id,name,email,role')
            ->when($status, fn ($query) => $query->where('status', $status))
            ->when($type, fn ($query) => $query->where('type', $type))
            ->orderByRaw("CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END")
            ->orderByDesc('created_at');
    }

    private function mapReport(BetaReport $report): array
    {
        $verification = $this->verificationFrom($report);

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
            'verificationStatus' => $verification['status'] ?? 'not_run',
            'verificationMessage' => $verification['message'] ?? null,
            'verificationLastRunAt' => $verification['lastRunAt'] ?? null,
            'verificationAttempts' => $verification['attempts'] ?? 0,
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

    private function verificationFrom(BetaReport $report): array
    {
        $context = $report->context ?? [];
        $verification = data_get($context, 'verification', []);
        return is_array($verification) ? $verification : [];
    }

    private function sessionUserId(Request $request): ?int
    {
        $sessionUser = $request->session()->get('user');
        return is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])
            ? (int) $sessionUser['id']
            : null;
    }

    private function methodFromTitle(?string $title): ?string
    {
        if (!$title) {
            return null;
        }

        return preg_match('/^(GET|POST|PATCH|PUT|DELETE|HEAD|OPTIONS)\s+/i', $title, $matches)
            ? strtoupper($matches[1])
            : null;
    }

    private function pathFromTitle(?string $title): ?string
    {
        if (!$title) {
            return null;
        }

        return preg_match('/^(GET|POST|PATCH|PUT|DELETE|HEAD|OPTIONS)\s+([^\s]+)\s+failed/i', $title, $matches)
            ? $matches[2]
            : null;
    }

    private function pathFromUrl(?string $url): ?string
    {
        if (!$url) {
            return null;
        }

        $path = parse_url($url, PHP_URL_PATH);
        return $path ? trim($path, '/') : null;
    }
}

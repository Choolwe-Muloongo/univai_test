<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\Launch\V1LaunchReadiness;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SystemHealthController extends Controller
{
    public function status()
    {
        $dbHealthy = $this->checkDatabase();
        $storageHealthy = $this->checkStorage();

        $incidentRecords = [
            [
                'id' => 'inc-2026-0217-adm-queue',
                'title' => 'Admissions document ingestion latency',
                'severity' => 'high',
                'owner' => 'Admissions Platform - S. Ibrahim',
                'eta' => '45 minutes',
                'communicationStatus' => 'Update posted to Admissions, Student Support, and Operations channels',
                'impactedModules' => ['Admissions Intake', 'Document Verification', 'Student Onboarding'],
                'affectedQueues' => [
                    [
                        'queue' => 'admissions',
                        'module' => 'Document Verification',
                        'backlog' => 86,
                        'delayedByMinutes' => 52,
                        'status' => 'degraded',
                    ],
                    [
                        'queue' => 'student-support',
                        'module' => 'Admissions Ticketing',
                        'backlog' => 24,
                        'delayedByMinutes' => 18,
                        'status' => 'recovering',
                    ],
                ],
                'lifecycle' => [
                    ['key' => 'acknowledge', 'label' => 'Acknowledge', 'status' => 'completed', 'completedAt' => '2026-02-17T09:42:00Z'],
                    ['key' => 'assign', 'label' => 'Assign', 'status' => 'completed', 'completedAt' => '2026-02-17T09:46:00Z'],
                    ['key' => 'mitigate', 'label' => 'Mitigate', 'status' => 'in_progress', 'completedAt' => null],
                    ['key' => 'notify_affected_roles', 'label' => 'Notify affected roles', 'status' => 'completed', 'completedAt' => '2026-02-17T09:58:00Z'],
                    ['key' => 'resolve', 'label' => 'Resolve', 'status' => 'pending', 'completedAt' => null],
                    ['key' => 'postmortem', 'label' => 'Postmortem', 'status' => 'pending', 'completedAt' => null],
                ],
                'timelineUpdates' => [
                    ['at' => '2026-02-17T09:40:00Z', 'actor' => 'Auto-monitor', 'message' => 'Queue depth threshold crossed for admissions queue.'],
                    ['at' => '2026-02-17T09:46:00Z', 'actor' => 'S. Ibrahim', 'message' => 'Incident acknowledged and assigned to admissions platform engineer.'],
                    ['at' => '2026-02-17T10:05:00Z', 'actor' => 'Platform Ops', 'message' => 'Worker pool scaled from 4 to 10 consumers and retry policy tuned.'],
                ],
            ],
            [
                'id' => 'inc-2026-0217-fin-recon',
                'title' => 'Finance reconciliation batch stalled',
                'severity' => 'medium',
                'owner' => 'Finance Integrations - M. Chen',
                'eta' => '2 hours',
                'communicationStatus' => 'Finance leadership notified; learner billing updates paused banner published',
                'impactedModules' => ['Finance Ledger', 'Payment Reconciliation', 'Billing Statements'],
                'affectedQueues' => [
                    [
                        'queue' => 'finance',
                        'module' => 'Payment Reconciliation',
                        'backlog' => 31,
                        'delayedByMinutes' => 76,
                        'status' => 'blocked',
                    ],
                    [
                        'queue' => 'billing',
                        'module' => 'Statement Generation',
                        'backlog' => 12,
                        'delayedByMinutes' => 30,
                        'status' => 'degraded',
                    ],
                ],
                'lifecycle' => [
                    ['key' => 'acknowledge', 'label' => 'Acknowledge', 'status' => 'completed', 'completedAt' => '2026-02-17T08:15:00Z'],
                    ['key' => 'assign', 'label' => 'Assign', 'status' => 'completed', 'completedAt' => '2026-02-17T08:20:00Z'],
                    ['key' => 'mitigate', 'label' => 'Mitigate', 'status' => 'in_progress', 'completedAt' => null],
                    ['key' => 'notify_affected_roles', 'label' => 'Notify affected roles', 'status' => 'completed', 'completedAt' => '2026-02-17T08:28:00Z'],
                    ['key' => 'resolve', 'label' => 'Resolve', 'status' => 'pending', 'completedAt' => null],
                    ['key' => 'postmortem', 'label' => 'Postmortem', 'status' => 'pending', 'completedAt' => null],
                ],
                'timelineUpdates' => [
                    ['at' => '2026-02-17T08:13:00Z', 'actor' => 'Finance monitor', 'message' => 'Reconciliation batch has not progressed for 20 minutes.'],
                    ['at' => '2026-02-17T08:28:00Z', 'actor' => 'M. Chen', 'message' => 'Sent communication to finance admins and posted user-facing advisory banner.'],
                    ['at' => '2026-02-17T09:52:00Z', 'actor' => 'Integrations team', 'message' => 'Replaying failed webhook events from payment gateway.'],
                ],
            ],
            [
                'id' => 'inc-2026-0217-exam-sync',
                'title' => 'Exam publication sync delay',
                'severity' => 'low',
                'owner' => 'Assessment Services - A. Bello',
                'eta' => '20 minutes',
                'communicationStatus' => 'Assessment office and lecturers notified in LMS channel',
                'impactedModules' => ['Exam Scheduling', 'Assessment Delivery'],
                'affectedQueues' => [
                    [
                        'queue' => 'exams',
                        'module' => 'Exam Publication',
                        'backlog' => 9,
                        'delayedByMinutes' => 14,
                        'status' => 'recovering',
                    ],
                ],
                'lifecycle' => [
                    ['key' => 'acknowledge', 'label' => 'Acknowledge', 'status' => 'completed', 'completedAt' => '2026-02-17T10:11:00Z'],
                    ['key' => 'assign', 'label' => 'Assign', 'status' => 'completed', 'completedAt' => '2026-02-17T10:13:00Z'],
                    ['key' => 'mitigate', 'label' => 'Mitigate', 'status' => 'completed', 'completedAt' => '2026-02-17T10:20:00Z'],
                    ['key' => 'notify_affected_roles', 'label' => 'Notify affected roles', 'status' => 'completed', 'completedAt' => '2026-02-17T10:16:00Z'],
                    ['key' => 'resolve', 'label' => 'Resolve', 'status' => 'in_progress', 'completedAt' => null],
                    ['key' => 'postmortem', 'label' => 'Postmortem', 'status' => 'pending', 'completedAt' => null],
                ],
                'timelineUpdates' => [
                    ['at' => '2026-02-17T10:10:00Z', 'actor' => 'Auto-monitor', 'message' => 'Exam sync job exceeded expected SLA by 12 minutes.'],
                    ['at' => '2026-02-17T10:16:00Z', 'actor' => 'A. Bello', 'message' => 'Shared advisory with examination officers and affected lecturers.'],
                    ['at' => '2026-02-17T10:22:00Z', 'actor' => 'Assessment Services', 'message' => 'Backlog drained to under 10 jobs; validating data consistency.'],
                ],
            ],
        ];

        if (!config('univai.ops.demo_incidents', false)) {
            $incidentRecords = [];
        }

        $incidentQueueDirectory = $this->buildIncidentQueueDirectory($incidentRecords);
        $launchReadiness = app(V1LaunchReadiness::class)->report();

        return response()->json([
            'uptime' => '99.9%',
            'incidents' => count($incidentRecords),
            'apiRequests' => 0,
            'dbThroughput' => $dbHealthy ? 'Nominal' : 'Degraded',
            'services' => [
                ['name' => 'Database', 'status' => $dbHealthy ? 'healthy' : 'degraded'],
                ['name' => 'Storage', 'status' => $storageHealthy ? 'healthy' : 'degraded'],
                ['name' => 'API', 'status' => 'healthy'],
            ],
            'utilization' => [
                'apiThroughput' => 72,
                'dbLoad' => $dbHealthy ? 55 : 92,
                'queueLatency' => 18,
            ],
            'incidentLifecycleGuide' => [
                ['key' => 'acknowledge', 'label' => 'Acknowledge', 'status' => 'pending', 'completedAt' => null],
                ['key' => 'assign', 'label' => 'Assign', 'status' => 'pending', 'completedAt' => null],
                ['key' => 'mitigate', 'label' => 'Mitigate', 'status' => 'pending', 'completedAt' => null],
                ['key' => 'notify_affected_roles', 'label' => 'Notify affected roles', 'status' => 'pending', 'completedAt' => null],
                ['key' => 'resolve', 'label' => 'Resolve', 'status' => 'pending', 'completedAt' => null],
                ['key' => 'postmortem', 'label' => 'Postmortem', 'status' => 'pending', 'completedAt' => null],
            ],
            'incidentQueueDirectory' => $incidentQueueDirectory,
            'incidentRecords' => $incidentRecords,
            'launchReadiness' => $launchReadiness,
        ]);
    }

    public function diagnostics()
    {
        return $this->status();
    }

    private function checkDatabase(): bool
    {
        try {
            DB::select('select 1');
            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    private function checkStorage(): bool
    {
        try {
            $disk = Storage::disk('local');
            $path = 'healthcheck.txt';
            $disk->put($path, 'ok');
            $exists = $disk->exists($path);
            $disk->delete($path);
            return $exists;
        } catch (\Throwable $e) {
            return false;
        }
    }

    private function buildIncidentQueueDirectory(array $incidentRecords): array
    {
        $flattened = [];

        foreach ($incidentRecords as $incident) {
            foreach ($incident['affectedQueues'] as $queueImpact) {
                $flattened[] = $queueImpact;
            }
        }

        return $flattened;
    }
}

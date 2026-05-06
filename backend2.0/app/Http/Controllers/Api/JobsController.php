<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Models\StudentNotification;
use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class JobsController extends Controller
{
    private const EMPLOYER_ACTION_STATUSES = ['shortlisted', 'accepted', 'rejected'];

    public function index()
    {
        return JobPosting::query()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (JobPosting $job) => $this->mapJob($job));
    }

    public function show(string $id)
    {
        $job = JobPosting::find($id);
        if (!$job) {
            return response()->json(null, 404);
        }

        return $this->mapJob($job);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'company' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $job = JobPosting::create([
            'id' => (string) Str::uuid(),
            'employer_id' => $this->numericSessionUserId($request),
            'title' => $data['title'],
            'company' => $data['company'],
            'location' => $data['location'],
            'type' => $data['type'],
            'description' => $data['description'] ?? null,
        ]);

        AuditLogger::log($request, 'employer.job.posted', 'job_posting', $job->id, [
            'title' => $job->title,
            'company' => $job->company,
        ]);

        return $this->mapJob($job);
    }

    public function apply(string $id, Request $request)
    {
        $job = JobPosting::find($id);
        if (!$job) {
            return response()->json(null, 404);
        }

        $data = $request->validate([
            'fullName' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'portfolio' => 'nullable|string|max:255',
            'coverLetter' => 'nullable|string',
        ]);

        $application = JobApplication::create([
            'student_id' => $this->numericSessionUserId($request) ?? User::query()->where('email', strtolower($data['email']))->value('id'),
            'job_id' => $job->id,
            'full_name' => $data['fullName'],
            'email' => strtolower($data['email']),
            'portfolio' => $data['portfolio'] ?? null,
            'cover_letter' => $data['coverLetter'] ?? null,
            'status' => 'submitted',
        ]);

        return response()->json([
            'status' => 'submitted',
            'id' => $application->id,
        ]);
    }

    public function applications(string $id, Request $request)
    {
        $job = JobPosting::find($id);
        if (!$job || !$this->canManageJob($job, $request)) {
            return response()->json([], 404);
        }

        return JobApplication::query()
            ->where('job_id', $job->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (JobApplication $application) => $this->mapApplication($application));
    }

    public function updateApplication(string $id, JobApplication $application, Request $request)
    {
        $job = JobPosting::find($id);
        if (!$job || $application->job_id !== $job->id || !$this->canManageJob($job, $request)) {
            return response()->json(null, 404);
        }

        $payload = $request->validate([
            'status' => ['required', 'string', 'in:' . implode(',', self::EMPLOYER_ACTION_STATUSES)],
        ]);

        $previousStatus = $application->status;
        $application->update(['status' => $payload['status']]);

        $this->notifyStudent($application, $job);
        AuditLogger::log($request, 'employer.job_application.' . $payload['status'], 'job_application', (string) $application->id, [
            'jobId' => $job->id,
            'jobTitle' => $job->title,
            'previousStatus' => $previousStatus,
            'status' => $application->status,
        ]);

        return response()->json($this->mapApplication($application));
    }

    private function mapJob(JobPosting $job): array
    {
        return [
            'id' => $job->id,
            'title' => $job->title,
            'company' => $job->company,
            'location' => $job->location,
            'type' => $job->type,
            'description' => $job->description,
        ];
    }

    private function mapApplication(JobApplication $application): array
    {
        return [
            'id' => $application->id,
            'fullName' => $application->full_name,
            'email' => $application->email,
            'portfolio' => $application->portfolio,
            'coverLetter' => $application->cover_letter,
            'status' => $application->status,
            'createdAt' => $application->created_at?->toISOString(),
        ];
    }

    private function notifyStudent(JobApplication $application, JobPosting $job): void
    {
        StudentNotification::create([
            'student_id' => $application->student_id,
            'email' => $application->email,
            'subject' => 'Your job application was updated',
            'message' => "Your application for {$job->title} at {$job->company} is now {$application->status}.",
            'target_type' => 'job_application',
            'target_id' => (string) $application->id,
            'metadata' => [
                'jobId' => $job->id,
                'status' => $application->status,
            ],
        ]);
    }

    private function canManageJob(JobPosting $job, Request $request): bool
    {
        $employerId = $this->numericSessionUserId($request);

        return !$job->employer_id || ($employerId && (int) $job->employer_id === $employerId);
    }

    private function numericSessionUserId(Request $request): ?int
    {
        $sessionUser = $request->session()->get('user');
        $id = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;

        return is_numeric($id) ? (int) $id : null;
    }
}

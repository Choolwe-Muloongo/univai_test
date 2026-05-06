<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class JobsController extends Controller
{
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
            'title' => $data['title'],
            'company' => $data['company'],
            'location' => $data['location'],
            'type' => $data['type'],
            'description' => $data['description'] ?? null,
        ]);

        $sessionUser = $request->session()->get('user');
        $employer = is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])
            ? User::find((int) $sessionUser['id'])
            : null;

        if ($employer) {
            app(NotificationService::class)->stateChange(
                'employer.verification_pending',
                'employer_verification',
                'Employer listing queued for verification',
                'Your job listing has been created. Keep your employer profile verified to increase student trust.',
                $employer,
                $job,
                '/employer/settings',
                ['jobId' => $job->id],
                'normal'
            );
        }

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
            'job_id' => $job->id,
            'full_name' => $data['fullName'],
            'email' => $data['email'],
            'portfolio' => $data['portfolio'] ?? null,
            'cover_letter' => $data['coverLetter'] ?? null,
            'status' => 'submitted',
        ]);

        app(NotificationService::class)->stateChange(
            'application.submitted',
            'applications',
            'Job application submitted',
            'Your application for ' . $job->title . ' at ' . $job->company . ' has been submitted.',
            $application->email,
            $application,
            '/student/jobs/applications',
            ['jobId' => $job->id, 'applicationId' => $application->id],
            'normal'
        );

        return response()->json([
            'status' => 'submitted',
            'id' => $application->id,
        ]);
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
}

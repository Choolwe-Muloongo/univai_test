<?php

namespace App\Support\Onboarding;

use App\Mail\WelcomeGuideMail;
use App\Models\InAppNotification;
use App\Models\User;
use App\Support\Notifications\InAppNotifier;
use Illuminate\Support\Facades\Mail;

class UserOnboardingMessenger
{
    public function __construct(private InAppNotifier $notifier)
    {
    }

    public function sendWelcomeOnce(array $sessionUser, ?User $user = null): void
    {
        $userKey = $this->userKey($sessionUser, $user);
        if (!$userKey) {
            return;
        }

        try {
            $alreadySent = InAppNotification::where('user_key', $userKey)
                ->where('type', 'welcome_guide')
                ->exists();

            if ($alreadySent) {
                return;
            }

            $guide = $this->guideFor($sessionUser, $user);

            $this->notifier->notify(
                $userKey,
                'Welcome to UnivAI - start here',
                $guide['notificationBody'],
                $guide['href'],
                'welcome_guide'
            );

            $email = $user?->email ?: ($sessionUser['email'] ?? null);
            if ($email) {
                try {
                    Mail::to($email)->send(new WelcomeGuideMail($sessionUser, $guide));
                } catch (\Throwable $exception) {
                    report($exception);
                }
            }
        } catch (\Throwable $exception) {
            report($exception);
        }
    }

    private function userKey(array $sessionUser, ?User $user = null): ?string
    {
        $id = $user?->id ?? ($sessionUser['id'] ?? null);
        if ($id !== null && $id !== '') {
            return (string) $id;
        }

        $email = $user?->email ?? ($sessionUser['email'] ?? null);
        return $email ? (string) $email : null;
    }

    private function guideFor(array $sessionUser, ?User $user = null): array
    {
        $role = (string) ($user?->role ?? ($sessionUser['role'] ?? 'student'));
        $isStaff = in_array($role, ['admin', 'lecturer', 'instructor', 'employer'], true);
        $href = match ($role) {
            'admin' => '/admin/dashboard',
            'lecturer' => '/lecturer/dashboard',
            'instructor' => '/instructor/portal',
            'employer' => '/employer/dashboard',
            default => '/student/help',
        };

        $studentFeatures = [
            ['title' => 'Mission Home', 'description' => 'Your next learning move, progress, rewards, and reminders start from the dashboard.'],
            ['title' => 'My Journeys', 'description' => 'Continue short courses, formal programme lessons, side missions, and certificates.'],
            ['title' => 'Nova Mentor', 'description' => 'Ask AI for explanations, summaries, study guidance, and help when a lesson feels heavy.'],
            ['title' => 'Training Arena', 'description' => 'Practice questions, review mistakes, and prepare before assessments.'],
            ['title' => 'Affiliate Dashboard', 'description' => 'Request affiliate access, share your referral link, track earnings, and withdraw after approval.'],
            ['title' => 'Billing and Notifications', 'description' => 'Track invoices, payments, access updates, and important messages from UnivAI.'],
        ];

        $staffFeatures = [
            ['title' => 'Dashboard', 'description' => 'Start from your role dashboard to see the work that matters today.'],
            ['title' => 'People and records', 'description' => 'Manage learners, applications, courses, content, or opportunities based on your role.'],
            ['title' => 'Communication', 'description' => 'Use notifications, announcements, feedback, and support tools to keep users informed.'],
            ['title' => 'System guidance', 'description' => 'Use the available admin or role pages carefully; important actions show feedback when saved.'],
        ];

        $steps = $isStaff
            ? [
                'Open your dashboard and review pending tasks first.',
                'Use the sidebar to move between the role tools assigned to your account.',
                'Check notifications for system messages, approvals, and important updates.',
                'Use Support or Feedback when a workflow is broken or confusing.',
            ]
            : [
                'Open Mission Home to see your next action.',
                'Continue a Journey from My Journeys or browse available short courses.',
                'Use Nova Mentor when you need a clearer explanation.',
                'Check Notifications for welcome guidance, payments, reminders, and account updates.',
                'Use Help Center or Support when something is confusing or broken.',
            ];

        return [
            'href' => $href,
            'intro' => $isStaff
                ? 'Your account is ready. This guide shows the quickest way to navigate your UnivAI workspace.'
                : 'Your account is ready. This guide shows how to learn, pay, get help, use Nova, and grow through UnivAI.',
            'notificationBody' => $isStaff
                ? 'Your UnivAI workspace is ready. Open this guide to understand your dashboard, notifications, communication tools, and support path.'
                : 'Your UnivAI learning guide is ready. Open it to understand Mission Home, My Journeys, Nova Mentor, Training Arena, Billing, Affiliate access, Notifications, and Support.',
            'steps' => $steps,
            'features' => $isStaff ? $staffFeatures : $studentFeatures,
        ];
    }
}

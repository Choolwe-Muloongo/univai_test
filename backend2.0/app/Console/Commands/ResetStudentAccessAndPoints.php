<?php

namespace App\Console\Commands;

use App\Models\AcademicEntitlement;
use App\Models\CourseAttempt;
use App\Models\LeaderboardEntry;
use App\Models\UserSubscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResetStudentAccessAndPoints extends Command
{
    protected $signature = 'univai:reset-student-access-points {--force : Run without confirmation}';

    protected $description = 'Clear leaderboard/grade points and revoke student course access for all users.';

    private const COURSE_ACCESS_CODES = [
        'course_access',
        'course-access',
        'programme-access',
        'program-access',
        'premium-access',
        'certificate-access',
        'short-course-access',
        'ai_tutor',
    ];

    public function handle(): int
    {
        if (!$this->option('force') && !$this->confirm('This will clear points and revoke course access for everyone. Continue?')) {
            $this->warn('Reset cancelled.');
            return self::SUCCESS;
        }

        $now = now();
        $counts = [
            'leaderboard_points' => 0,
            'course_attempt_points' => 0,
            'revoked_entitlements' => 0,
            'ended_subscriptions' => 0,
        ];

        DB::transaction(function () use (&$counts, $now) {
            $counts['leaderboard_points'] = LeaderboardEntry::query()->update(['points' => 0]);

            $counts['course_attempt_points'] = CourseAttempt::query()->update([
                'grade_points' => 0,
                'credits_earned' => 0,
            ]);

            $counts['revoked_entitlements'] = AcademicEntitlement::query()
                ->whereIn('code', self::COURSE_ACCESS_CODES)
                ->where('status', 'active')
                ->update([
                    'status' => 'revoked',
                    'ends_at' => $now,
                    'metadata' => DB::raw("JSON_SET(COALESCE(metadata, JSON_OBJECT()), '$.reset_by', 'univai:reset-student-access-points', '$.reset_at', '" . $now->toIso8601String() . "')"),
                ]);

            $counts['ended_subscriptions'] = UserSubscription::query()
                ->whereIn('tier', ['programme', 'program', 'premium', 'certificate', 'short-course'])
                ->whereIn('status', ['active', 'paid', 'trialing'])
                ->update([
                    'status' => 'ended',
                    'ends_at' => $now,
                ]);
        });

        $this->info('Student points and course access reset completed.');
        $this->table(['Reset item', 'Rows changed'], [
            ['Leaderboard points set to 0', $counts['leaderboard_points']],
            ['Course attempt points/earned credits set to 0', $counts['course_attempt_points']],
            ['Course-access entitlements revoked', $counts['revoked_entitlements']],
            ['Paid/course subscriptions ended', $counts['ended_subscriptions']],
        ]);

        return self::SUCCESS;
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class StudentGamificationReadController extends Controller
{
    public function state(Request $request)
    {
        return response()->json($this->statePayload($this->studentId($request)));
    }

    public function dailyQuests(Request $request)
    {
        return response()->json($this->dailyQuestPayload($this->studentId($request)));
    }

    public function leaderboard(Request $request)
    {
        $period = $request->query('period', 'weekly');
        $since = $this->periodStart(is_string($period) ? $period : 'weekly');
        $rows = $this->leaderboardRows(null, $since, 50);

        return response()->json($this->mapLeaderboardRows($rows));
    }

    private function statePayload(int $studentId): array
    {
        $xp = DB::table('student_xp_balances')->where('student_id', $studentId)->first();
        $points = DB::table('student_reward_points')->where('student_id', $studentId)->first();
        $streak = DB::table('student_streaks')->where('student_id', $studentId)->first();
        $xpValue = (int) ($xp->xp ?? 0);
        $level = $this->levelFor($xpValue);
        $weeklyPoints = (int) DB::table('student_learning_events')
            ->where('student_id', $studentId)
            ->where('created_at', '>=', now()->startOfWeek())
            ->sum('activity_points_awarded');
        $rankings = $this->rankingsPayload($studentId);

        return [
            'xp' => $xpValue,
            'level' => $level['level'],
            'levelTitle' => $level['title'],
            'nextLevelXp' => $level['next'],
            'rewardPoints' => (int) ($points->balance ?? 0),
            'streakDays' => (int) ($streak->current_days ?? 0),
            'streakProtected' => (int) ($streak->streak_shields ?? 0) > 0,
            'weeklyRank' => $rankings['globalWeekly']['rank'],
            'rankings' => $rankings,
            'weeklyActivityPoints' => $weeklyPoints,
            'badges' => $this->badgesFor($studentId, $xpValue),
            'novaMessage' => $this->novaMessage($xpValue, $weeklyPoints),
            'quests' => $this->dailyQuestPayload($studentId),
        ];
    }

    private function rankingsPayload(int $studentId): array
    {
        $activeCourse = $this->activeShortCourse($studentId);
        $activeCourseWeekly = null;
        $activeCourseAllTime = null;

        if ($activeCourse) {
            $activeCourseWeekly = $this->rankSnapshot($studentId, $activeCourse->course_id, now()->startOfWeek()) + [
                'courseId' => $activeCourse->course_id,
                'courseTitle' => $activeCourse->course_title,
            ];
            $activeCourseAllTime = $this->rankSnapshot($studentId, $activeCourse->course_id, null) + [
                'courseId' => $activeCourse->course_id,
                'courseTitle' => $activeCourse->course_title,
            ];
        }

        return [
            'globalWeekly' => $this->rankSnapshot($studentId, null, now()->startOfWeek()),
            'globalAllTime' => $this->rankSnapshot($studentId, null, null),
            'activeCourseWeekly' => $activeCourseWeekly,
            'activeCourseAllTime' => $activeCourseAllTime,
        ];
    }

    private function rankSnapshot(int $studentId, ?string $courseId, ?Carbon $since): array
    {
        $rows = $this->leaderboardRows($courseId, $since, null);
        foreach ($rows as $index => $row) {
            if ((int) $row->student_id === $studentId) {
                return [
                    'rank' => $index + 1,
                    'points' => (int) $row->activity_points,
                    'xpPoints' => (int) $row->xp_points,
                    'rewardPoints' => (int) $row->reward_points,
                    'missionsCompleted' => (int) $row->missions_completed,
                    'practicesPassed' => (int) $row->practices_passed,
                    'finalTrialsPassed' => (int) $row->final_trials_passed,
                    'lastActivityAt' => $row->last_activity_at ? Carbon::parse($row->last_activity_at)->toISOString() : null,
                ];
            }
        }

        $pointsQuery = DB::table('student_learning_events')->where('student_id', $studentId);
        if ($courseId) {
            $pointsQuery->where('short_course_id', $courseId);
        }
        if ($since) {
            $pointsQuery->where('created_at', '>=', $since);
        }

        return [
            'rank' => null,
            'points' => (int) $pointsQuery->sum('activity_points_awarded'),
            'xpPoints' => 0,
            'rewardPoints' => 0,
            'missionsCompleted' => 0,
            'practicesPassed' => 0,
            'finalTrialsPassed' => 0,
            'lastActivityAt' => null,
        ];
    }

    private function leaderboardRows(?string $courseId, ?Carbon $since, ?int $limit = 50)
    {
        $query = DB::table('student_learning_events')
            ->join('users', 'users.id', '=', 'student_learning_events.student_id')
            ->leftJoin('student_xp_balances', 'student_xp_balances.student_id', '=', 'student_learning_events.student_id')
            ->leftJoin('student_streaks', 'student_streaks.student_id', '=', 'student_learning_events.student_id')
            ->groupBy('student_learning_events.student_id', 'users.name', 'student_xp_balances.level_title', 'student_streaks.current_days')
            ->selectRaw('
                student_learning_events.student_id,
                users.name,
                COALESCE(student_xp_balances.level_title, ?) as level_title,
                COALESCE(student_streaks.current_days, 0) as streak_days,
                SUM(student_learning_events.activity_points_awarded) as activity_points,
                SUM(student_learning_events.xp_awarded) as xp_points,
                SUM(student_learning_events.reward_points_awarded) as reward_points,
                SUM(CASE WHEN student_learning_events.event_type = ? THEN 1 ELSE 0 END) as missions_completed,
                SUM(CASE WHEN student_learning_events.event_type = ? THEN 1 ELSE 0 END) as practices_passed,
                SUM(CASE WHEN student_learning_events.event_type = ? THEN 1 ELSE 0 END) as final_trials_passed,
                MAX(student_learning_events.created_at) as last_activity_at
            ', ['New Learner', 'mission_completed', 'practice_passed', 'final_trial_passed'])
            ->havingRaw('SUM(student_learning_events.activity_points_awarded) > 0')
            ->orderByDesc('activity_points')
            ->orderByDesc('xp_points')
            ->orderByDesc('final_trials_passed')
            ->orderByDesc('last_activity_at');

        if ($courseId) {
            $query->where('student_learning_events.short_course_id', $courseId);
        }
        if ($since) {
            $query->where('student_learning_events.created_at', '>=', $since);
        }
        if ($limit) {
            $query->take($limit);
        }

        return $query->get()->values();
    }

    private function mapLeaderboardRows($rows)
    {
        return $rows->values()->map(fn ($row, $index) => [
            'rank' => $index + 1,
            'studentId' => $row->student_id,
            'name' => $row->name ?? 'UnivAI Learner',
            'levelTitle' => $row->level_title,
            'activityPoints' => (int) $row->activity_points,
            'xpPoints' => (int) $row->xp_points,
            'rewardPoints' => (int) $row->reward_points,
            'streakDays' => (int) $row->streak_days,
            'missionsCompleted' => (int) $row->missions_completed,
            'practicesPassed' => (int) $row->practices_passed,
            'finalTrialsPassed' => (int) $row->final_trials_passed,
            'lastActivityAt' => $row->last_activity_at ? Carbon::parse($row->last_activity_at)->toISOString() : null,
        ])->values();
    }

    private function activeShortCourse(int $studentId): ?object
    {
        return DB::table('short_course_enrollments')
            ->leftJoin('short_courses', 'short_courses.id', '=', 'short_course_enrollments.short_course_id')
            ->where('short_course_enrollments.student_id', $studentId)
            ->where(function ($query) {
                $query->where('short_course_enrollments.entry_fee_paid', true)
                    ->orWhereIn('short_course_enrollments.status', ['active', 'lessons_completed', 'completed', 'exam_failed']);
            })
            ->orderByDesc('short_course_enrollments.updated_at')
            ->selectRaw('short_course_enrollments.short_course_id as course_id, short_courses.title as course_title')
            ->first();
    }

    private function periodStart(string $period): ?Carbon
    {
        return match ($period) {
            'daily' => now()->startOfDay(),
            'monthly' => now()->startOfMonth(),
            'all_time' => null,
            default => now()->startOfWeek(),
        };
    }

    private function dailyQuestPayload(int $studentId): array
    {
        $today = now()->toDateString();
        $templates = $this->questTemplates();
        foreach ($templates as $quest) {
            DB::table('student_daily_quests')->updateOrInsert(
                ['student_id' => $studentId, 'quest_key' => $quest['id'], 'quest_date' => $today],
                ['target' => $quest['target'], 'updated_at' => now(), 'created_at' => now()]
            );
        }
        $rows = DB::table('student_daily_quests')->where('student_id', $studentId)->where('quest_date', $today)->get()->keyBy('quest_key');

        return collect($templates)->map(function ($quest) use ($rows) {
            $row = $rows->get($quest['id']);
            return $quest + [
                'progress' => (int) ($row->progress ?? 0),
                'completed' => (bool) ($row->completed ?? false),
            ];
        })->values()->all();
    }

    private function questTemplates(): array
    {
        return [
            ['id' => 'daily-card-set', 'title' => 'Complete 1 mission card set', 'description' => 'Finish one meaningful learning step today.', 'rewardXp' => 50, 'rewardPoints' => 5, 'target' => 1],
            ['id' => 'training-battle', 'title' => 'Win 1 Training Arena battle', 'description' => 'Use practice to sharpen weak areas.', 'rewardXp' => 60, 'rewardPoints' => 8, 'target' => 1],
            ['id' => 'ask-nova', 'title' => 'Ask Nova 1 learning question', 'description' => 'Use AI guidance to unblock your learning.', 'rewardXp' => 20, 'rewardPoints' => 2, 'target' => 1],
        ];
    }

    private function levelFor(int $xp): array
    {
        return match (true) {
            $xp >= 5000 => ['level' => 7, 'title' => 'UnivAI Scholar', 'next' => 8000],
            $xp >= 3000 => ['level' => 6, 'title' => 'Certified Builder', 'next' => 5000],
            $xp >= 1800 => ['level' => 5, 'title' => 'Specialist', 'next' => 3000],
            $xp >= 1000 => ['level' => 4, 'title' => 'Problem Solver', 'next' => 1800],
            $xp >= 600 => ['level' => 3, 'title' => 'Builder', 'next' => 1000],
            $xp >= 250 => ['level' => 2, 'title' => 'Explorer', 'next' => 600],
            default => ['level' => 1, 'title' => 'New Learner', 'next' => 250],
        };
    }

    private function badgesFor(int $studentId, int $xp): array
    {
        $events = DB::table('student_learning_events')->where('student_id', $studentId);
        $missions = (clone $events)->where('event_type', 'mission_completed')->where('xp_awarded', '>', 0)->count();
        $arenaWins = (clone $events)->where('event_type', 'practice_passed')->where('xp_awarded', '>', 0)->count();
        $finalTrials = (clone $events)->where('event_type', 'final_trial_passed')->where('xp_awarded', '>', 0)->count();
        $mistakesFixed = (clone $events)->where('event_type', 'mistake_fixed')->count();
        $streak = DB::table('student_streaks')->where('student_id', $studentId)->first();
        $streakDays = (int) ($streak->current_days ?? 0);

        $badges = [];
        if ($xp > 0) $badges[] = 'First Steps';
        if ($missions >= 1) $badges[] = 'Mission Starter';
        if ($missions >= 10) $badges[] = 'Mission Grinder';
        if ($arenaWins >= 1) $badges[] = 'Arena Fighter';
        if ($arenaWins >= 5) $badges[] = 'Arena Champion';
        if ($finalTrials >= 1) $badges[] = 'Final Trial Victor';
        if ($mistakesFixed >= 5) $badges[] = 'Mistake Slayer';
        if ($streakDays >= 3) $badges[] = 'Streak Keeper';
        if ($streakDays >= 7) $badges[] = 'Weekly Flame';
        if ($xp >= 600) $badges[] = 'Builder';
        if ($xp >= 1000) $badges[] = 'Problem Solver';
        if ($xp >= 3000) $badges[] = 'Certified Builder';

        return array_values(array_unique($badges));
    }

    private function novaMessage(int $xp, int $weeklyPoints): string
    {
        if ($weeklyPoints < 20) return 'Start with one mission today. Small progress, repeated daily, becomes serious skill.';
        if ($xp >= 1000) return 'You are entering builder territory. Use the Training Arena to clean weak areas before the Final Trial.';
        return 'Your path is moving. Complete one more mission and convert effort into visible Skill Proof progress.';
    }

    private function studentId(Request $request): int
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;
        abort_unless($studentId && is_numeric($studentId), 403, 'Unauthorized');
        return (int) $studentId;
    }
}

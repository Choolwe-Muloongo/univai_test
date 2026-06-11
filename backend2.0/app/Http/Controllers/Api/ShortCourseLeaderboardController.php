<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ShortCourseLeaderboardController extends Controller
{
    public function show(Request $request, string $courseId)
    {
        $studentId = $this->studentId($request);
        $period = $request->query('period', 'weekly');
        $since = $this->periodStart(is_string($period) ? $period : 'weekly');

        $query = DB::table('student_learning_events')
            ->join('users', 'users.id', '=', 'student_learning_events.student_id')
            ->leftJoin('student_xp_balances', 'student_xp_balances.student_id', '=', 'student_learning_events.student_id')
            ->leftJoin('student_streaks', 'student_streaks.student_id', '=', 'student_learning_events.student_id')
            ->where('student_learning_events.short_course_id', $courseId)
            ->groupBy('student_learning_events.student_id', 'users.name', 'student_xp_balances.level_title', 'student_streaks.current_days')
            ->selectRaw('
                student_learning_events.student_id,
                users.name,
                COALESCE(student_xp_balances.level_title, ?) as level_title,
                COALESCE(student_streaks.current_days, 0) as streak_days,
                SUM(student_learning_events.activity_points_awarded) as activity_points,
                SUM(student_learning_events.xp_awarded) as xp_points,
                SUM(student_learning_events.reward_points_awarded) as reward_points,
                SUM(CASE WHEN student_learning_events.event_type = "mission_completed" THEN 1 ELSE 0 END) as missions_completed,
                SUM(CASE WHEN student_learning_events.event_type = "practice_passed" THEN 1 ELSE 0 END) as practices_passed,
                SUM(CASE WHEN student_learning_events.event_type = "final_trial_passed" THEN 1 ELSE 0 END) as final_trials_passed,
                MAX(student_learning_events.created_at) as last_activity_at
            ', ['New Learner'])
            ->havingRaw('SUM(student_learning_events.activity_points_awarded) > 0');

        if ($since) {
            $query->where('student_learning_events.created_at', '>=', $since);
        }

        $rows = $query
            ->orderByDesc('activity_points')
            ->orderByDesc('xp_points')
            ->orderByDesc('final_trials_passed')
            ->orderByDesc('last_activity_at')
            ->take(50)
            ->get();

        $mapped = $rows->values()->map(fn ($row, $index) => [
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
        ]);

        $myRank = $mapped->firstWhere('studentId', $studentId);

        return response()->json([
            'courseId' => $courseId,
            'period' => $since ? $period : 'all_time',
            'generatedAt' => now()->toISOString(),
            'myRank' => $myRank,
            'rows' => $mapped,
        ]);
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

    private function studentId(Request $request): int
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;
        abort_unless($studentId && is_numeric($studentId), 403, 'Unauthorized');
        return (int) $studentId;
    }
}

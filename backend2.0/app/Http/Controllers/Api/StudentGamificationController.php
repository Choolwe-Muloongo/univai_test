<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class StudentGamificationController extends Controller
{
    public function state(Request $request)
    {
        return response()->json($this->statePayload($this->studentId($request)));
    }

    public function dailyQuests(Request $request)
    {
        return response()->json($this->dailyQuestPayload($this->studentId($request)));
    }

    public function recordEvent(Request $request)
    {
        $studentId = $this->studentId($request);
        $payload = $request->validate([
            'type' => ['required', 'string'],
            'courseId' => ['nullable', 'string'],
            'lessonId' => ['nullable', 'string'],
            'metadata' => ['nullable', 'array'],
        ]);

        if (!$this->canAwardEvent($studentId, $payload['type'], $payload['courseId'] ?? null, $payload['lessonId'] ?? null)) {
            return response()->json($this->statePayload($studentId) + ['message' => 'Learning event recorded, but no extra reward was awarded because the daily or duplicate limit was reached.']);
        }

        $award = $this->awardFor($payload['type']);

        DB::table('student_learning_events')->insert([
            'student_id' => $studentId,
            'event_type' => $payload['type'],
            'short_course_id' => $payload['courseId'] ?? null,
            'lesson_id' => $payload['lessonId'] ?? null,
            'xp_awarded' => $award['xp'],
            'reward_points_awarded' => $award['points'],
            'activity_points_awarded' => $award['activity'],
            'metadata' => json_encode($payload['metadata'] ?? []),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $xp = DB::table('student_xp_balances')->where('student_id', $studentId)->first();
        $newXp = (int) ($xp->xp ?? 0) + $award['xp'];
        $level = $this->levelFor($newXp);
        DB::table('student_xp_balances')->updateOrInsert(
            ['student_id' => $studentId],
            ['xp' => $newXp, 'level' => $level['level'], 'level_title' => $level['title'], 'updated_at' => now(), 'created_at' => $xp->created_at ?? now()]
        );

        $points = DB::table('student_reward_points')->where('student_id', $studentId)->first();
        DB::table('student_reward_points')->updateOrInsert(
            ['student_id' => $studentId],
            [
                'balance' => (int) ($points->balance ?? 0) + $award['points'],
                'lifetime_earned' => (int) ($points->lifetime_earned ?? 0) + $award['points'],
                'updated_at' => now(),
                'created_at' => $points->created_at ?? now(),
            ]
        );

        $this->touchStreak($studentId);
        $this->updateDailyQuests($studentId, $payload['type']);

        return response()->json($this->statePayload($studentId));
    }

    public function rewards(Request $request)
    {
        $studentId = $this->studentId($request);
        $balance = (int) (DB::table('student_reward_points')->where('student_id', $studentId)->value('balance') ?? 0);
        $history = DB::table('student_reward_redemptions')->where('student_id', $studentId)->latest()->take(20)->get()->map(fn ($row) => [
            'id' => $row->id,
            'type' => 'redemption',
            'title' => $row->title,
            'points' => -1 * (int) $row->points_spent,
            'createdAt' => optional(Carbon::parse($row->created_at))->toISOString(),
        ]);

        return response()->json(['balance' => $balance, 'shop' => $this->rewardShop(), 'history' => $history]);
    }

    public function redeem(Request $request)
    {
        $studentId = $this->studentId($request);
        $payload = $request->validate([
            'code' => ['required', 'string'],
            'courseId' => ['nullable', 'string'],
        ]);
        $item = collect($this->rewardShop())->firstWhere('code', $payload['code']);
        abort_unless($item && $item['enabled'], 404, 'Reward not available.');
        $balance = (int) (DB::table('student_reward_points')->where('student_id', $studentId)->value('balance') ?? 0);
        abort_if($balance < $item['cost'], 422, 'Not enough reward points.');

        $effect = $this->applyRewardEffect($studentId, $payload['code'], $payload['courseId'] ?? null);

        DB::table('student_reward_points')->where('student_id', $studentId)->update(['balance' => $balance - $item['cost'], 'updated_at' => now()]);
        DB::table('student_reward_redemptions')->insert([
            'student_id' => $studentId,
            'reward_code' => $item['code'],
            'title' => $item['name'],
            'points_spent' => $item['cost'],
            'status' => 'completed',
            'metadata' => json_encode($effect),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => $effect['message'] ?? 'Reward redeemed.', 'balance' => $balance - $item['cost']]);
    }

    public function leaderboard(Request $request)
    {
        $rows = DB::table('student_learning_events')
            ->join('users', 'users.id', '=', 'student_learning_events.student_id')
            ->leftJoin('student_xp_balances', 'student_xp_balances.student_id', '=', 'student_learning_events.student_id')
            ->leftJoin('student_streaks', 'student_streaks.student_id', '=', 'student_learning_events.student_id')
            ->where('student_learning_events.created_at', '>=', now()->startOfWeek())
            ->groupBy('student_learning_events.student_id', 'users.name', 'student_xp_balances.level_title', 'student_streaks.current_days')
            ->selectRaw('student_learning_events.student_id, users.name, COALESCE(student_xp_balances.level_title, ?) as level_title, COALESCE(student_streaks.current_days, 0) as streak_days, SUM(activity_points_awarded) as activity_points', ['New Learner'])
            ->orderByDesc('activity_points')
            ->take(50)
            ->get();

        return response()->json($rows->values()->map(fn ($row, $index) => [
            'rank' => $index + 1,
            'studentId' => $row->student_id,
            'name' => $row->name ?? 'UnivAI Learner',
            'levelTitle' => $row->level_title,
            'activityPoints' => (int) $row->activity_points,
            'streakDays' => (int) $row->streak_days,
        ]));
    }

    public function mistakes(Request $request)
    {
        $studentId = $this->studentId($request);
        $rows = DB::table('student_mistakes')->where('student_id', $studentId)->latest()->take(100)->get();
        return response()->json($rows->map(fn ($row) => [
            'id' => $row->id,
            'question' => $row->question,
            'studentAnswer' => $row->student_answer,
            'correctAnswer' => $row->correct_answer,
            'topic' => $row->topic,
            'difficulty' => $row->difficulty,
            'lessonId' => $row->lesson_id,
            'explanation' => $row->explanation,
            'fixed' => (bool) $row->fixed,
            'createdAt' => optional(Carbon::parse($row->created_at))->toISOString(),
        ])->values());
    }

    public function reviewMistake(Request $request, int $id)
    {
        $studentId = $this->studentId($request);
        DB::table('student_mistakes')->where('student_id', $studentId)->where('id', $id)->where('fixed', false)->update(['fixed' => true, 'fixed_at' => now(), 'updated_at' => now()]);
        if ($this->canAwardEvent($studentId, 'mistake_fixed', null, null)) {
            $this->recordSyntheticEvent($studentId, 'mistake_fixed', 30, 3, 10);
        }
        return response()->json(['message' => 'Mistake marked as fixed.']);
    }

    private function canAwardEvent(int $studentId, string $type, ?string $courseId, ?string $lessonId): bool
    {
        $today = now()->startOfDay();

        if ($type === 'final_trial_passed' && $courseId) {
            return !DB::table('student_learning_events')
                ->where('student_id', $studentId)
                ->where('event_type', $type)
                ->where('short_course_id', $courseId)
                ->exists();
        }

        if ($type === 'mission_completed' && $courseId && $lessonId) {
            return !DB::table('student_learning_events')
                ->where('student_id', $studentId)
                ->where('event_type', $type)
                ->where('short_course_id', $courseId)
                ->where('lesson_id', $lessonId)
                ->exists();
        }

        $dailyCaps = [
            'practice_started' => 10,
            'practice_passed' => 5,
            'practice_failed' => 5,
            'ai_help_used' => 10,
            'mistake_fixed' => 10,
            'card_completed' => 80,
            'checkpoint_correct' => 80,
            'checkpoint_wrong' => 80,
        ];

        $cap = $dailyCaps[$type] ?? 20;
        $count = DB::table('student_learning_events')
            ->where('student_id', $studentId)
            ->where('event_type', $type)
            ->where('created_at', '>=', $today)
            ->count();

        return $count < $cap;
    }

    private function applyRewardEffect(int $studentId, string $code, ?string $courseId): array
    {
        if ($code === 'streak_shield') {
            $streak = DB::table('student_streaks')->where('student_id', $studentId)->first();
            DB::table('student_streaks')->updateOrInsert(
                ['student_id' => $studentId],
                [
                    'streak_shields' => (int) ($streak->streak_shields ?? 0) + 1,
                    'current_days' => (int) ($streak->current_days ?? 0),
                    'best_days' => (int) ($streak->best_days ?? 0),
                    'last_activity_date' => $streak->last_activity_date ?? null,
                    'updated_at' => now(),
                    'created_at' => $streak->created_at ?? now(),
                ]
            );
            return ['message' => 'Streak Shield added to your account.'];
        }

        if ($code === 'access_day') {
            $query = DB::table('short_course_enrollments')->where('student_id', $studentId);
            if ($courseId) {
                $query->where('short_course_id', $courseId);
            }
            $enrollment = $query->orderByDesc('updated_at')->first();
            abort_unless($enrollment, 422, 'Join a Journey before redeeming an access day.');

            $base = $enrollment->access_expires_at && Carbon::parse($enrollment->access_expires_at)->isFuture()
                ? Carbon::parse($enrollment->access_expires_at)
                : now();

            DB::table('short_course_enrollments')->where('id', $enrollment->id)->update([
                'entry_fee_paid' => true,
                'status' => 'active',
                'access_expires_at' => $base->copy()->addDay(),
                'updated_at' => now(),
            ]);

            return ['message' => 'One extra Journey access day has been added.', 'shortCourseId' => $enrollment->short_course_id];
        }

        if ($code === 'ai_boost') {
            $query = DB::table('short_course_enrollments')->where('student_id', $studentId);
            if ($courseId) {
                $query->where('short_course_id', $courseId);
            }
            $enrollment = $query->orderByDesc('updated_at')->first();
            abort_unless($enrollment, 422, 'Join a Journey before redeeming an AI boost.');

            $base = $enrollment->ai_access_expires_at && Carbon::parse($enrollment->ai_access_expires_at)->isFuture()
                ? Carbon::parse($enrollment->ai_access_expires_at)
                : now();

            DB::table('short_course_enrollments')->where('id', $enrollment->id)->update([
                'ai_plan' => 'reward_boost',
                'ai_access_expires_at' => $base->copy()->addHours(6),
                'hourly_ai_quota' => max((int) ($enrollment->hourly_ai_quota ?? 0), 10),
                'daily_ai_quota' => max((int) ($enrollment->daily_ai_quota ?? 0), 25),
                'updated_at' => now(),
            ]);

            return ['message' => 'AI Boost added for 6 hours.', 'shortCourseId' => $enrollment->short_course_id];
        }

        return ['message' => 'Reward redeemed.'];
    }

    private function statePayload(int $studentId): array
    {
        $xp = DB::table('student_xp_balances')->where('student_id', $studentId)->first();
        $points = DB::table('student_reward_points')->where('student_id', $studentId)->first();
        $streak = DB::table('student_streaks')->where('student_id', $studentId)->first();
        $xpValue = (int) ($xp->xp ?? 0);
        $level = $this->levelFor($xpValue);
        $weeklyPoints = (int) DB::table('student_learning_events')->where('student_id', $studentId)->where('created_at', '>=', now()->startOfWeek())->sum('activity_points_awarded');

        return [
            'xp' => $xpValue,
            'level' => $level['level'],
            'levelTitle' => $level['title'],
            'nextLevelXp' => $level['next'],
            'rewardPoints' => (int) ($points->balance ?? 0),
            'streakDays' => (int) ($streak->current_days ?? 0),
            'streakProtected' => (int) ($streak->streak_shields ?? 0) > 0,
            'weeklyRank' => null,
            'weeklyActivityPoints' => $weeklyPoints,
            'badges' => $this->badgesFor($studentId, $xpValue),
            'novaMessage' => $this->novaMessage($studentId, $xpValue, $weeklyPoints),
            'quests' => $this->dailyQuestPayload($studentId),
        ];
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

    private function updateDailyQuests(int $studentId, string $eventType): void
    {
        $map = ['mission_completed' => 'daily-card-set', 'card_completed' => 'daily-card-set', 'practice_passed' => 'training-battle', 'ai_help_used' => 'ask-nova'];
        $questKey = $map[$eventType] ?? null;
        if (!$questKey) return;
        $today = now()->toDateString();
        $quest = DB::table('student_daily_quests')->where('student_id', $studentId)->where('quest_key', $questKey)->where('quest_date', $today)->first();
        if (!$quest) return;
        $progress = min((int) $quest->target, (int) $quest->progress + 1);
        $completed = $progress >= (int) $quest->target;
        DB::table('student_daily_quests')->where('id', $quest->id)->update(['progress' => $progress, 'completed' => $completed, 'completed_at' => $completed ? now() : null, 'updated_at' => now()]);
    }

    private function touchStreak(int $studentId): void
    {
        $today = now()->toDateString();
        $streak = DB::table('student_streaks')->where('student_id', $studentId)->first();
        if (!$streak) {
            DB::table('student_streaks')->insert(['student_id' => $studentId, 'current_days' => 1, 'best_days' => 1, 'last_activity_date' => $today, 'created_at' => now(), 'updated_at' => now()]);
            return;
        }
        if ($streak->last_activity_date === $today) return;
        $yesterday = now()->subDay()->toDateString();
        $current = $streak->last_activity_date === $yesterday ? (int) $streak->current_days + 1 : 1;
        DB::table('student_streaks')->where('student_id', $studentId)->update(['current_days' => $current, 'best_days' => max((int) $streak->best_days, $current), 'last_activity_date' => $today, 'updated_at' => now()]);
    }

    private function awardFor(string $type): array
    {
        return match ($type) {
            'practice_started' => ['xp' => 0, 'points' => 0, 'activity' => 0],
            'card_completed' => ['xp' => 5, 'points' => 0, 'activity' => 2],
            'checkpoint_correct' => ['xp' => 10, 'points' => 0, 'activity' => 4],
            'mission_completed' => ['xp' => 50, 'points' => 5, 'activity' => 20],
            'practice_passed' => ['xp' => 60, 'points' => 8, 'activity' => 15],
            'boss_battle_completed' => ['xp' => 200, 'points' => 50, 'activity' => 50],
            'final_trial_passed' => ['xp' => 500, 'points' => 100, 'activity' => 100],
            'ai_help_used' => ['xp' => 20, 'points' => 2, 'activity' => 5],
            'mistake_fixed' => ['xp' => 30, 'points' => 3, 'activity' => 10],
            default => ['xp' => 0, 'points' => 0, 'activity' => 1],
        };
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
        $badges = [];
        if ($xp > 0) $badges[] = 'First Steps';
        if ($xp >= 600) $badges[] = 'Builder';
        if ((int) DB::table('student_learning_events')->where('student_id', $studentId)->where('event_type', 'practice_passed')->count() >= 3) $badges[] = 'Arena Fighter';
        if ((int) DB::table('student_learning_events')->where('student_id', $studentId)->where('event_type', 'boss_battle_completed')->count() > 0) $badges[] = 'Boss Breaker';
        return $badges;
    }

    private function novaMessage(int $studentId, int $xp, int $weeklyPoints): string
    {
        if ($weeklyPoints < 20) return 'Start with one mission today. Small progress, repeated daily, becomes serious skill.';
        if ($xp >= 1000) return 'You are entering builder territory. Use the Training Arena to clean weak areas before the Final Trial.';
        return 'Your path is moving. Complete one more mission and convert effort into visible Skill Proof progress.';
    }

    private function rewardShop(): array
    {
        return [
            ['code' => 'ai_boost', 'name' => 'AI Boost', 'description' => 'Extra Nova support for a focused study session.', 'cost' => 50, 'enabled' => true],
            ['code' => 'streak_shield', 'name' => 'Streak Shield', 'description' => 'Protect your streak when life interrupts learning.', 'cost' => 100, 'enabled' => true],
            ['code' => 'access_day', 'name' => '1 Free Access Day', 'description' => 'Redeem one extra platform access day.', 'cost' => 250, 'enabled' => true],
            ['code' => 'premium_ai_trial', 'name' => 'Premium AI Trial', 'description' => 'Try a stronger AI support window when enabled.', 'cost' => 2000, 'enabled' => false],
        ];
    }

    private function recordSyntheticEvent(int $studentId, string $type, int $xp, int $points, int $activity): void
    {
        DB::table('student_learning_events')->insert(['student_id' => $studentId, 'event_type' => $type, 'xp_awarded' => $xp, 'reward_points_awarded' => $points, 'activity_points_awarded' => $activity, 'created_at' => now(), 'updated_at' => now()]);
    }

    private function studentId(Request $request): int
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;
        abort_unless($studentId && is_numeric($studentId), 403, 'Unauthorized');
        return (int) $studentId;
    }
}

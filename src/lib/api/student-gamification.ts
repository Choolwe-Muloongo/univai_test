import { apiFetch } from '@/lib/api/client';

export type LearningEventType =
  | 'card_completed'
  | 'checkpoint_correct'
  | 'checkpoint_wrong'
  | 'mission_completed'
  | 'practice_started'
  | 'practice_passed'
  | 'practice_failed'
  | 'boss_battle_started'
  | 'boss_battle_completed'
  | 'final_trial_passed'
  | 'ai_help_used'
  | 'streak_extended'
  | 'reward_redeemed';

export type DailyQuest = {
  id: string;
  title: string;
  description: string;
  rewardXp: number;
  rewardPoints: number;
  progress: number;
  target: number;
  completed: boolean;
};

export type RankSnapshot = {
  rank: number | null;
  points: number;
  xpPoints?: number;
  rewardPoints?: number;
  missionsCompleted?: number;
  practicesPassed?: number;
  finalTrialsPassed?: number;
  lastActivityAt?: string | null;
};

export type CourseRankSnapshot = RankSnapshot & {
  courseId: string;
  courseTitle?: string | null;
};

export type RankingSummary = {
  globalWeekly: RankSnapshot;
  globalAllTime: RankSnapshot;
  activeCourseWeekly: CourseRankSnapshot | null;
  activeCourseAllTime: CourseRankSnapshot | null;
};

export type GamificationState = {
  xp: number;
  level: number;
  levelTitle: string;
  nextLevelXp: number;
  rewardPoints: number;
  streakDays: number;
  streakProtected: boolean;
  weeklyRank: number | null;
  rankings?: RankingSummary;
  weeklyActivityPoints: number;
  badges: string[];
  novaMessage: string;
  quests: DailyQuest[];
};

export type RewardShopItem = {
  code: string;
  name: string;
  description: string;
  cost: number;
  enabled: boolean;
};

export type RewardHistoryItem = {
  id: string | number;
  type: string;
  title: string;
  points: number;
  createdAt?: string | null;
};

export type LeaderboardRow = {
  rank: number;
  studentId: string | number;
  name: string;
  levelTitle: string;
  activityPoints: number;
  streakDays: number;
  xpPoints?: number;
  rewardPoints?: number;
  missionsCompleted?: number;
  practicesPassed?: number;
  finalTrialsPassed?: number;
  lastActivityAt?: string | null;
};

export type ShortCourseLeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';

export type ShortCourseLeaderboard = {
  courseId: string;
  period: ShortCourseLeaderboardPeriod;
  generatedAt: string;
  myRank: LeaderboardRow | null;
  rows: LeaderboardRow[];
};

export type MistakeBankItem = {
  id: string | number;
  question: string;
  studentAnswer?: string | null;
  correctAnswer?: string | null;
  topic?: string | null;
  difficulty?: string | null;
  lessonId?: string | null;
  explanation?: string | null;
  fixed: boolean;
  createdAt?: string | null;
};

export async function getStudentGamification(): Promise<GamificationState> {
  return apiFetch<GamificationState>('/students/me/gamification');
}

export async function getStudentDailyQuests(): Promise<DailyQuest[]> {
  return apiFetch<DailyQuest[]>('/students/me/daily-quests');
}

export async function recordLearningEvent(payload: {
  type: LearningEventType;
  courseId?: string | null;
  lessonId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<GamificationState> {
  return apiFetch<GamificationState>('/students/me/learning-events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getStudentRewards(): Promise<{ balance: number; shop: RewardShopItem[]; history: RewardHistoryItem[] }> {
  return apiFetch('/students/me/rewards');
}

export async function redeemStudentReward(code: string, courseId?: string | null): Promise<{ message: string; balance: number }> {
  return apiFetch('/students/me/rewards/redeem', {
    method: 'POST',
    body: JSON.stringify({ code, courseId: courseId ?? null }),
  });
}

export async function getStudentActivityLeaderboard(period: ShortCourseLeaderboardPeriod = 'weekly'): Promise<LeaderboardRow[]> {
  const query = new URLSearchParams({ period });
  return apiFetch<LeaderboardRow[]>(`/students/me/leaderboard/activity?${query.toString()}`);
}

export async function getShortCourseLeaderboard(courseId: string, period: ShortCourseLeaderboardPeriod = 'weekly'): Promise<ShortCourseLeaderboard> {
  const query = new URLSearchParams({ period });
  return apiFetch<ShortCourseLeaderboard>(`/students/me/short-courses/${courseId}/leaderboard?${query.toString()}`);
}

export async function getStudentMistakes(): Promise<MistakeBankItem[]> {
  return apiFetch<MistakeBankItem[]>('/students/me/mistakes');
}

export async function markMistakeReviewed(id: string | number): Promise<{ message: string }> {
  return apiFetch(`/students/me/mistakes/${id}/review`, { method: 'POST' });
}

export function fallbackGamification(progress = 0): GamificationState {
  const xp = Math.max(0, Math.round(progress * 12.4));
  const level = xp >= 1000 ? 4 : xp >= 600 ? 3 : xp >= 250 ? 2 : 1;
  const levelTitle = ['New Learner', 'Explorer', 'Builder', 'Problem Solver'][level - 1] ?? 'UnivAI Scholar';
  const weeklyPoints = Math.floor(xp / 2);
  return {
    xp,
    level,
    levelTitle,
    nextLevelXp: level === 1 ? 250 : level === 2 ? 600 : level === 3 ? 1000 : 1600,
    rewardPoints: Math.floor(xp / 15),
    streakDays: progress > 0 ? 1 : 0,
    streakProtected: false,
    weeklyRank: null,
    rankings: {
      globalWeekly: { rank: null, points: weeklyPoints },
      globalAllTime: { rank: null, points: weeklyPoints },
      activeCourseWeekly: null,
      activeCourseAllTime: null,
    },
    weeklyActivityPoints: weeklyPoints,
    badges: progress >= 100 ? ['Skill Proof Ready'] : progress >= 50 ? ['Halfway Builder'] : ['First Steps'],
    novaMessage: progress >= 100
      ? 'Your Skill Proof path is ready. Finish the Final Trial and show the work, not just the score.'
      : 'I have prepared your next mission. One focused session today keeps the momentum alive.',
    quests: [
      { id: 'daily-card-set', title: 'Complete 1 mission card set', description: 'Finish a meaningful mission step today.', rewardXp: 50, rewardPoints: 5, progress: progress > 0 ? 1 : 0, target: 1, completed: progress > 0 },
      { id: 'training-battle', title: 'Win 1 Training Arena battle', description: 'Use practice to sharpen weak areas.', rewardXp: 60, rewardPoints: 8, progress: 0, target: 1, completed: false },
      { id: 'ask-nova', title: 'Ask Nova 1 learning question', description: 'Use AI help only when it moves learning forward.', rewardXp: 20, rewardPoints: 2, progress: 0, target: 1, completed: false },
    ],
  };
}

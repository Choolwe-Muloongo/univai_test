import type { NovaMode } from '@/components/ai/nova-mode-selector';

export type NovaPageContext =
  | 'mission_home'
  | 'journeys'
  | 'journey'
  | 'lesson'
  | 'practice'
  | 'exam'
  | 'mistakes'
  | 'rewards'
  | 'league'
  | 'student';

export type NovaQuickAction = {
  label: string;
  mode: NovaMode;
  intent: string;
};

type NovaSearchParams = {
  get: (name: string) => string | null;
};

export type NovaRouteContext = {
  page: NovaPageContext;
  label: string;
  courseId: string | null;
  lessonId: string | null;
  cardId: string | null;
  mistakeId: string | null;
  attemptId: string | null;
  questionId: string | null;
};

export const validNovaModes: NovaMode[] = ['tutor', 'explain', 'quiz', 'summarize', 'exam_prep', 'code_help', 'study_plan'];

const pageLabels: Record<NovaPageContext, string> = {
  mission_home: 'Mission Home',
  journeys: 'My Journeys',
  journey: 'Journey',
  lesson: 'Lesson Player',
  practice: 'Training Arena',
  exam: 'Final Trial',
  mistakes: 'Mistake Bank',
  rewards: 'Rewards',
  league: 'Leaderboard',
  student: 'Student Space',
};

const quickActions: Record<NovaPageContext, NovaQuickAction[]> = {
  mission_home: [
    { label: 'What should I study today?', mode: 'study_plan', intent: 'today_plan' },
    { label: 'Create today’s plan', mode: 'study_plan', intent: 'create_today_plan' },
    { label: 'Explain my progress', mode: 'explain', intent: 'explain_progress' },
    { label: 'Train weak area', mode: 'quiz', intent: 'train_weak_area' },
  ],
  journeys: [
    { label: 'Which Journey should I continue?', mode: 'study_plan', intent: 'recommend_journey' },
    { label: 'Compare my Journeys', mode: 'explain', intent: 'compare_journeys' },
    { label: 'Recommend next Journey', mode: 'study_plan', intent: 'recommend_next_journey' },
    { label: 'Explain access status', mode: 'explain', intent: 'explain_access' },
  ],
  journey: [
    { label: 'Explain this Journey', mode: 'explain', intent: 'explain_journey' },
    { label: 'Create study plan', mode: 'study_plan', intent: 'journey_study_plan' },
    { label: 'Prepare me for Final Trial', mode: 'exam_prep', intent: 'final_trial_prep' },
    { label: 'Show weak areas', mode: 'explain', intent: 'show_weak_areas' },
  ],
  lesson: [
    { label: 'Explain this card', mode: 'explain', intent: 'explain_current_card' },
    { label: 'Give simpler example', mode: 'explain', intent: 'simpler_example' },
    { label: 'Quiz me on this card', mode: 'quiz', intent: 'quiz_current_card' },
    { label: 'Summarize mission so far', mode: 'summarize', intent: 'summarize_mission' },
  ],
  practice: [
    { label: 'Explain my score', mode: 'explain', intent: 'explain_practice_score' },
    { label: 'Create rescue drill', mode: 'quiz', intent: 'create_rescue_drill' },
    { label: 'Give similar questions', mode: 'quiz', intent: 'similar_questions' },
    { label: 'Explain mistakes', mode: 'explain', intent: 'explain_practice_mistakes' },
  ],
  exam: [
    { label: 'Am I ready?', mode: 'exam_prep', intent: 'readiness_check' },
    { label: 'Create final revision plan', mode: 'exam_prep', intent: 'final_revision_plan' },
    { label: 'Quiz me before exam', mode: 'quiz', intent: 'pre_exam_quiz' },
    { label: 'Explain weak topics', mode: 'explain', intent: 'explain_weak_topics' },
  ],
  mistakes: [
    { label: 'Explain this mistake', mode: 'explain', intent: 'explain_mistake' },
    { label: 'Give similar practice', mode: 'quiz', intent: 'similar_mistake_practice' },
    { label: 'Help me fix weak area', mode: 'tutor', intent: 'fix_weak_area' },
  ],
  rewards: [
    { label: 'Which reward should I redeem?', mode: 'explain', intent: 'reward_advice' },
    { label: 'Should I save points?', mode: 'explain', intent: 'save_or_redeem' },
    { label: 'Explain my rewards', mode: 'explain', intent: 'explain_rewards' },
  ],
  league: [
    { label: 'Explain my league position', mode: 'explain', intent: 'explain_league' },
    { label: 'How can I climb higher?', mode: 'study_plan', intent: 'league_climb_plan' },
    { label: 'Train for more points', mode: 'quiz', intent: 'train_for_points' },
  ],
  student: [
    { label: 'Help me with this page', mode: 'tutor', intent: 'current_page_help' },
    { label: 'Create a study plan', mode: 'study_plan', intent: 'create_today_plan' },
    { label: 'Quiz me', mode: 'quiz', intent: 'train_weak_area' },
  ],
};

export const novaIntentPrompts: Record<string, string> = {
  explain_current_card: 'Explain the current lesson card in simple language, then give me one example and one quick check question.',
  simpler_example: 'Give me a simpler example for the current lesson card, using everyday language.',
  quiz_current_card: 'Quiz me on the current lesson card one question at a time. Wait for my answer before giving the next question.',
  summarize_mission: 'Summarize this mission so far into clear study notes and list what I should remember.',
  create_rescue_drill: 'Create a short rescue drill from my weak areas. Ask one question at a time and explain after I answer.',
  final_trial_prep: 'Prepare me for the Final Trial. Show the most important topics, likely question types, and a short revision plan.',
  today_plan: 'Look at my current learning context and help me decide what to study today.',
  create_today_plan: 'Create a practical study plan for today with clear tasks and priorities.',
  explain_progress: 'Explain my current progress in simple terms and tell me what I should do next.',
  train_weak_area: 'Train my weak area with short questions. Ask one question at a time and explain after I answer.',
  recommend_journey: 'Help me decide which Journey I should continue next and explain why.',
  compare_journeys: 'Compare my current Journeys and help me understand which one needs attention first.',
  recommend_next_journey: 'Recommend the next Journey I should take based on my learning context.',
  explain_access: 'Explain my access status and what I can do with my current learning access.',
  explain_journey: 'Explain this Journey, what it teaches, and how I should approach it.',
  journey_study_plan: 'Create a focused study plan for this Journey.',
  show_weak_areas: 'Show me the weak areas I should focus on and suggest how to fix them.',
  explain_practice_score: 'Explain my practice score and what it says about my understanding.',
  similar_questions: 'Give me similar practice questions so I can strengthen this topic.',
  explain_practice_mistakes: 'Explain the mistakes from my practice attempt and show how to avoid them next time.',
  readiness_check: 'Check whether I am ready for the Final Trial and tell me what to revise first.',
  final_revision_plan: 'Create a final revision plan before I start the exam.',
  pre_exam_quiz: 'Quiz me before the exam one question at a time.',
  explain_weak_topics: 'Explain my weak topics and how I can improve them before the exam.',
  explain_mistake: 'Explain this mistake clearly and show me the correct thinking process.',
  similar_mistake_practice: 'Give me similar practice questions based on this mistake.',
  fix_weak_area: 'Help me fix this weak area step by step.',
  reward_advice: 'Help me decide which reward I should redeem and why.',
  save_or_redeem: 'Tell me whether I should save my points or redeem a reward now.',
  explain_rewards: 'Explain my rewards and how I can use them wisely.',
  explain_league: 'Explain my leaderboard position and what it means.',
  league_climb_plan: 'Create a practical plan to improve my leaderboard position.',
  train_for_points: 'Train me with quick questions that can help me earn more points.',
  current_page_help: 'Help me understand what I can do on this page.',
};

function getFirstQueryValue(searchParams: NovaSearchParams | undefined, keys: string[]) {
  if (!searchParams) return null;
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value) return value;
  }
  return null;
}

export function isValidNovaMode(value: string | null | undefined): value is NovaMode {
  return Boolean(value && validNovaModes.includes(value as NovaMode));
}

export function getNovaIntentPrompt(intent: string | null | undefined) {
  if (!intent) return null;
  return novaIntentPrompts[intent] ?? 'Help me with my current learning context.';
}

export function getNovaQuickActions(page: NovaPageContext) {
  return quickActions[page] ?? quickActions.student;
}

export function getNovaRouteContext(pathname: string, searchParams?: NovaSearchParams): NovaRouteContext {
  const cleanPath = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  const segments = cleanPath.split('/').filter(Boolean);
  const studentIndex = segments.indexOf('student');
  const afterStudent = studentIndex >= 0 ? segments.slice(studentIndex + 1) : segments;

  let page: NovaPageContext = 'student';
  let courseId: string | null = getFirstQueryValue(searchParams, ['courseId', 'shortCourseId', 'journeyId']);
  let lessonId: string | null = getFirstQueryValue(searchParams, ['lessonId', 'missionId']);
  const cardId = getFirstQueryValue(searchParams, ['cardId']);
  const mistakeId = getFirstQueryValue(searchParams, ['mistakeId']);
  const attemptId = getFirstQueryValue(searchParams, ['attemptId']);
  const questionId = getFirstQueryValue(searchParams, ['questionId']);

  if (cleanPath === '/student' || cleanPath === '/student/dashboard') {
    page = 'mission_home';
  } else if (afterStudent[0] === 'courses') {
    courseId = courseId ?? afterStudent[1] ?? null;

    if (!courseId) {
      page = 'journeys';
    } else if (afterStudent[2] === 'lessons') {
      page = 'lesson';
      lessonId = lessonId ?? afterStudent[3] ?? null;
    } else if (afterStudent[2] === 'practice') {
      page = 'practice';
    } else if (afterStudent[2] === 'exam') {
      page = 'exam';
    } else {
      page = 'journey';
    }
  } else if (afterStudent[0] === 'mistakes') {
    page = 'mistakes';
  } else if (afterStudent[0] === 'rewards') {
    page = 'rewards';
  } else if (afterStudent[0] === 'leaderboard') {
    page = 'league';
  }

  return { page, label: pageLabels[page], courseId, lessonId, cardId, mistakeId, attemptId, questionId };
}

export function buildNovaChatHref(action: NovaQuickAction, context: NovaRouteContext) {
  const params = new URLSearchParams({ mode: action.mode, intent: action.intent });
  if (context.courseId) params.set('courseId', context.courseId);
  if (context.lessonId) params.set('lessonId', context.lessonId);
  if (context.cardId) params.set('cardId', context.cardId);
  if (context.mistakeId) params.set('mistakeId', context.mistakeId);
  if (context.attemptId) params.set('attemptId', context.attemptId);
  if (context.questionId) params.set('questionId', context.questionId);
  return `/student/ai/chat?${params.toString()}`;
}

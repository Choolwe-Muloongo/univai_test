import type { SessionUser } from '@/lib/api/types';

export type AiAccessTier = 'free' | 'paid-certificate' | 'premium' | 'programme';

export type AiFeatureKey =
  | 'chat'
  | 'tutor'
  | 'lessonCompanion'
  | 'studyPlan'
  | 'flashcards'
  | 'mockExam'
  | 'weakAreas'
  | 'career'
  | 'notes'
  | 'cashback'
  | 'groundedAnswers';

export type AiAccessPolicy = {
  tier: AiAccessTier;
  label: string;
  description: string;
  dailyPromptLimit: number;
  maxPromptCharacters: number;
  features: Record<AiFeatureKey, boolean>;
  guidance: string;
};

const baseFeatures: Record<AiFeatureKey, boolean> = {
  chat: false,
  tutor: false,
  lessonCompanion: false,
  studyPlan: false,
  flashcards: false,
  mockExam: false,
  weakAreas: false,
  career: false,
  notes: false,
  cashback: false,
  groundedAnswers: false,
};

export const AI_ACCESS_POLICIES: Record<AiAccessTier, AiAccessPolicy> = {
  free: {
    tier: 'free',
    label: 'Free AI',
    description: 'Limited AI support for orientation, short summaries, and basic study questions. Cashback is not available on the free tier.',
    dailyPromptLimit: 5,
    maxPromptCharacters: 700,
    features: {
      ...baseFeatures,
      chat: true,
      tutor: true,
      notes: true,
    },
    guidance: 'Keep responses short, introductory, and focused on next-step guidance. Do not offer cashback, premium tutoring, mock exams, flashcards, or detailed study plans.',
  },
  'paid-certificate': {
    tier: 'paid-certificate',
    label: 'Paid Certificate AI',
    description: 'Certificate-focused AI for course explanations, summaries, and revision prompts without premium coaching features.',
    dailyPromptLimit: 30,
    maxPromptCharacters: 2500,
    features: {
      ...baseFeatures,
      chat: true,
      tutor: true,
      lessonCompanion: true,
      notes: true,
      studyPlan: true,
    },
    guidance: 'Focus on certificate completion, course explanations, summaries, and practical revision. Avoid premium-only mock exams, weak-area diagnostics, and flashcards.',
  },
  premium: {
    tier: 'premium',
    label: 'Premium AI',
    description: 'Advanced tutor, adaptive study plans, flashcards, mock exams, and weak-area support.',
    dailyPromptLimit: 150,
    maxPromptCharacters: 6000,
    features: {
      ...baseFeatures,
      chat: true,
      tutor: true,
      lessonCompanion: true,
      studyPlan: true,
      flashcards: true,
      mockExam: true,
      weakAreas: true,
      career: true,
      notes: true,
      cashback: true,
    },
    guidance: 'Provide advanced tutoring with worked examples, adaptive study plans, flashcards, mock-exam drills, and weak-area remediation when requested.',
  },
  programme: {
    tier: 'programme',
    label: 'Programme AI',
    description: 'Programme-aware AI that grounds answers in approved module materials and cites gaps when approved materials are insufficient.',
    dailyPromptLimit: 120,
    maxPromptCharacters: 6000,
    features: {
      ...baseFeatures,
      chat: true,
      tutor: true,
      lessonCompanion: true,
      studyPlan: true,
      flashcards: true,
      mockExam: true,
      weakAreas: true,
      career: true,
      notes: true,
      groundedAnswers: true,
    },
    guidance: 'Answer only from approved module materials provided in context or form fields. If the approved materials do not support an answer, say so and ask for the relevant module material.',
  },
};

export function resolveAiAccessTier(role?: string | null): AiAccessTier {
  switch (role) {
    case 'free-student':
    case 'freemium-student':
      return 'free';
    case 'paid-certificate-student':
    case 'paid-certificate':
    case 'certificate-student':
      return 'paid-certificate';
    case 'programme-student':
    case 'program-student':
    case 'enrolled':
    case 'student':
      return 'programme';
    case 'premium-student':
    default:
      return 'premium';
  }
}

export function getAiAccessPolicy(role?: string | null): AiAccessPolicy {
  return AI_ACCESS_POLICIES[resolveAiAccessTier(role)];
}

export function canUseAiFeature(role: string | null | undefined, feature: AiFeatureKey): boolean {
  return getAiAccessPolicy(role).features[feature];
}

export function aiAccessSummaryFor(user: SessionUser | null | undefined): string {
  const policy = getAiAccessPolicy(user?.role);
  return [
    `AI access tier: ${policy.tier}`,
    `AI access label: ${policy.label}`,
    `AI daily prompt limit: ${policy.dailyPromptLimit}`,
    `AI max prompt characters: ${policy.maxPromptCharacters}`,
    `AI cashback eligible: ${policy.features.cashback ? 'yes' : 'no'}`,
    `AI grounding required: ${policy.features.groundedAnswers ? 'approved module materials only' : 'no'}`,
    `AI tier guidance: ${policy.guidance}`,
  ].join('. ');
}

export type AccountingLearningMode = 'teach' | 'guided_practice' | 'workbook' | 'exam' | 'correction';

export const accountingLearningModes: { id: AccountingLearningMode; label: string; description: string }[] = [
  { id: 'teach', label: 'Teach mode', description: 'Teacher-style explanation before the workpaper.' },
  { id: 'guided_practice', label: 'Guided practice', description: 'Step-by-step hints and prompts while the learner tries.' },
  { id: 'workbook', label: 'Workbook mode', description: 'Complete the workpaper with fewer explanations.' },
  { id: 'exam', label: 'Exam mode', description: 'Attempt without hints, then compare with model logic.' },
  { id: 'correction', label: 'Correction mode', description: 'Review common mistakes and how to fix them.' },
];

export function modeInstruction(mode: AccountingLearningMode) {
  switch (mode) {
    case 'teach':
      return 'Watch the explanation first. The goal is understanding, not speed.';
    case 'guided_practice':
      return 'Try each step. Use hints only when you are stuck.';
    case 'workbook':
      return 'Complete the workpaper like a serious accounting workbook.';
    case 'exam':
      return 'Attempt this without hints. Then compare your answer with the model logic.';
    case 'correction':
      return 'Study the mistake patterns and repair your accounting reasoning.';
    default:
      return 'Follow the accounting logic step by step.';
  }
}

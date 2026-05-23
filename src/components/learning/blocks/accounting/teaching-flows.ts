import type { AccountingCardContent } from './engine';

export type AccountingTeachingStepKind = 'intro' | 'scenario' | 'concept' | 'worked_example' | 'guided_practice' | 'model_answer' | 'exam_practice' | 'reflection';

export type AccountingTeachingStep = {
  kind: AccountingTeachingStepKind;
  title: string;
  body: string;
  prompt?: string;
};

export type AccountingTeachingFlow = {
  topic: string;
  teacherIntro: string;
  learnerGoal: string;
  steps: AccountingTeachingStep[];
  commonMistake: string;
  examTip: string;
};

export function buildAccountingTeachingFlow(content: AccountingCardContent, title: string): AccountingTeachingFlow {
  const data = content.data;
  const tableKind = String(data.tableKind ?? content.accountingType);
  const topic = humanize(String(data.caseTitle ?? data.concept ?? data.accountName ?? tableKind ?? title));
  const text = `${tableKind} ${title} ${content.accountingType}`.toLowerCase();

  if (text.includes('suspense') || text.includes('error') || text.includes('corrected') || text.includes('revised profit')) {
    return suspenseTeachingFlow(topic, data);
  }
  if (content.accountingType === 'journal_entry') return journalTeachingFlow(topic, data);
  if (content.accountingType === 'trial_balance') return focusedFlow(topic, data, 'trial balance', 'A trial balance checks whether total debit balances equal total credit balances.', 'Extract balances, place them on the correct side, total both columns, and explain any difference.');
  if (content.accountingType === 'ledger') return focusedFlow(topic, data, 'ledger posting', 'A ledger shows how one account changes over time.', 'Post each entry to the correct side and explain the closing balance.');
  if (content.accountingType === 'financial_statement' || content.accountingType === 'cash_flow_statement') return focusedFlow(topic, data, 'financial statements', 'Financial statements turn accounting records into a business story.', 'Classify each line, calculate totals, and interpret the result.');
  if (content.accountingType === 'ifrs_treatment') return focusedFlow(topic, data, 'IFRS treatment', 'A professional IFRS answer connects the facts, the standard, the treatment, and the disclosure.', 'Defend the accounting treatment using evidence from the case.');
  if (content.accountingType === 'audit_risk') return focusedFlow(topic, data, 'audit judgement', 'An audit answer links risk, assertion, procedure, and evidence.', 'Identify the risk, choose the procedure, and state the evidence needed.');
  if (content.accountingType === 'tax_computation') return focusedFlow(topic, data, 'tax computation', 'A tax computation moves from accounting profit or income to taxable profit or tax payable.', 'Apply each adjustment clearly and explain the result.');
  if (content.accountingType === 'consolidation') return focusedFlow(topic, data, 'group accounts', 'Group accounting combines entities while removing internal transactions.', 'Complete the working, apply adjustments, and explain the group result.');
  if (content.accountingType === 'budgeting' || content.accountingType === 'variance_analysis') return focusedFlow(topic, data, 'management accounting', 'Management accounting is about calculation plus decision-making.', 'Calculate, interpret, and recommend action.');
  if (content.difficulty === 'phd' || content.accountingType.startsWith('research')) return focusedFlow(topic, data, 'doctoral accounting research', 'Doctoral accounting work needs theory, evidence, method, validity, and contribution.', 'Move from problem to theory, gap, method, evidence, and contribution.');

  return focusedFlow(topic, data, humanize(content.accountingType), `Today we are working through ${topic}. Follow the accounting logic behind each row.`, 'Understand the scenario, complete the workpaper, and explain the business meaning.');
}

function suspenseTeachingFlow(topic: string, data: Record<string, unknown>): AccountingTeachingFlow {
  return {
    topic,
    teacherIntro: 'Let us walk through this like a teacher. A suspense account is used when a trial balance does not agree and the accountant needs a temporary place for the difference while errors are investigated.',
    learnerGoal: 'Find the difference, decide which side is short, open the suspense account, correct errors, and check that suspense clears.',
    commonMistake: 'A common mistake is putting suspense on the larger side. The side that is short is the side that needs the suspense amount.',
    examTip: 'For a wrong-side posting, the correction often uses double the amount because the wrong entry must be reversed and then placed correctly.',
    steps: baseSteps(topic, data, 'Find the trial balance difference, open suspense on the short side, correct each error, and check the suspense balance.', 'A trial balance differs by K1,200. The debit side is greater. Open suspense, correct errors, and prepare the revised profit statement.'),
  };
}

function journalTeachingFlow(topic: string, data: Record<string, unknown>): AccountingTeachingFlow {
  return {
    topic,
    teacherIntro: 'A journal entry is the first formal accounting record of a transaction.',
    learnerGoal: 'Identify the accounts, classify them, apply debit and credit rules, and make sure total debits equal total credits.',
    commonMistake: 'A common mistake is guessing debit and credit sides instead of analysing what increased and decreased.',
    examTip: 'Always total debits and credits before moving to the ledger.',
    steps: baseSteps(topic, data, 'Identify the accounts, classify them, decide debit or credit, and confirm the entry balances.', 'Record a transaction where equipment is bought partly for cash and partly on credit.'),
  };
}

function focusedFlow(topic: string, data: Record<string, unknown>, focus: string, intro: string, goal: string): AccountingTeachingFlow {
  return {
    topic,
    teacherIntro: intro,
    learnerGoal: goal,
    commonMistake: 'A common mistake is filling the table without explaining why each line belongs there.',
    examTip: 'Format earns marks, but explanation protects the learner when the scenario changes.',
    steps: baseSteps(topic, data, goal, `Create a similar ${focus} question with new figures and complete it without hints.`),
  };
}

function baseSteps(topic: string, data: Record<string, unknown>, concept: string, examPractice: string): AccountingTeachingStep[] {
  return [
    { kind: 'intro', title: `Today we are learning ${topic}`, body: 'Start by understanding the accounting purpose before looking at the table.' },
    { kind: 'scenario', title: 'Business situation', body: String(data.scenario ?? data.question ?? data.description ?? 'Read the case and identify what the business is trying to record, correct, or report.') },
    { kind: 'concept', title: 'Teacher explanation', body: concept },
    { kind: 'worked_example', title: 'Worked example', body: 'Watch the workpaper build step by step. Notice the order, labels, amounts, totals, and final conclusion.' },
    { kind: 'guided_practice', title: 'Your turn', body: 'Pause the animation, predict the next row, then continue. Use the workbook below to try your own answer.', prompt: 'Try first. Then compare with the model answer.' },
    { kind: 'model_answer', title: 'Model answer', body: 'Compare your answer with the professional format. Check labels, account sides, amounts, totals, and interpretation.' },
    { kind: 'exam_practice', title: 'Mini exam practice', body: examPractice },
    { kind: 'reflection', title: 'Mastery check', body: 'Explain the answer in plain business language, not only as a table.' },
  ];
}

export function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().replace(/^./, (letter) => letter.toUpperCase());
}

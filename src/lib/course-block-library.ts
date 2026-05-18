export type CourseBlockSeed = {
  type: string;
  title?: string;
  body?: string;
  question?: string;
  options?: string[];
  correctAnswer?: string | boolean;
  explanation?: string;
  text?: string;
  statement?: string;
  prompt?: string;
  front?: string;
  back?: string;
  items?: string[];
  pairs?: Array<{ left: string; right: string }>;
  criteria?: string[];
  code?: string;
  visual?: Record<string, unknown>;
  [key: string]: unknown;
};

export type CourseBlockTemplate = {
  id: string;
  label: string;
  domain: string;
  domainLabel: string;
  category: string;
  intent: string;
  description: string;
  block: CourseBlockSeed;
};

type DomainSpec = {
  id: string;
  label: string;
  topic: string;
  artifact: string;
  metric: string;
  scenario: string;
};

type BlockArchetype = {
  id: string;
  label: string;
  category: string;
  intent: string;
  create: (domain: DomainSpec) => CourseBlockSeed;
};

export const BLOCK_TEMPLATE_DOMAINS: DomainSpec[] = [
  { id: 'finance', label: 'Finance', topic: 'cash flow', artifact: 'budget', metric: 'net margin', scenario: 'a growing small business' },
  { id: 'accounting', label: 'Accounting', topic: 'journal entries', artifact: 'ledger', metric: 'trial balance', scenario: 'month-end reporting' },
  { id: 'entrepreneurship', label: 'Entrepreneurship', topic: 'customer validation', artifact: 'lean canvas', metric: 'conversion rate', scenario: 'a new service launch' },
  { id: 'business', label: 'Business Management', topic: 'operating models', artifact: 'process map', metric: 'cycle time', scenario: 'a team improving delivery' },
  { id: 'marketing', label: 'Marketing', topic: 'positioning', artifact: 'campaign brief', metric: 'cost per lead', scenario: 'a product awareness campaign' },
  { id: 'sales', label: 'Sales', topic: 'consultative selling', artifact: 'pipeline', metric: 'close rate', scenario: 'a B2B discovery call' },
  { id: 'project_management', label: 'Project Management', topic: 'scope control', artifact: 'project plan', metric: 'schedule variance', scenario: 'a delayed implementation' },
  { id: 'human_resources', label: 'Human Resources', topic: 'performance feedback', artifact: 'review form', metric: 'retention rate', scenario: 'a manager coaching an employee' },
  { id: 'leadership', label: 'Leadership', topic: 'decision quality', artifact: 'decision memo', metric: 'team alignment', scenario: 'a cross-functional decision' },
  { id: 'data_analytics', label: 'Data Analytics', topic: 'data cleaning', artifact: 'dashboard', metric: 'accuracy rate', scenario: 'a weekly operations report' },
  { id: 'programming', label: 'Programming', topic: 'control flow', artifact: 'function', metric: 'test pass rate', scenario: 'debugging a feature' },
  { id: 'web_development', label: 'Web Development', topic: 'responsive layout', artifact: 'component', metric: 'load time', scenario: 'a mobile checkout page' },
  { id: 'cybersecurity', label: 'Cybersecurity', topic: 'access control', artifact: 'risk register', metric: 'incident count', scenario: 'protecting user accounts' },
  { id: 'cloud_computing', label: 'Cloud Computing', topic: 'service reliability', artifact: 'architecture diagram', metric: 'uptime', scenario: 'scaling a web app' },
  { id: 'ai_ml', label: 'AI and Machine Learning', topic: 'model evaluation', artifact: 'experiment log', metric: 'precision', scenario: 'classifying support tickets' },
  { id: 'mathematics', label: 'Mathematics', topic: 'functions', artifact: 'worked solution', metric: 'error rate', scenario: 'solving a practical problem' },
  { id: 'statistics', label: 'Statistics', topic: 'sampling', artifact: 'survey dataset', metric: 'confidence interval', scenario: 'estimating customer satisfaction' },
  { id: 'science', label: 'Science', topic: 'experimental design', artifact: 'lab note', metric: 'measurement error', scenario: 'testing a hypothesis' },
  { id: 'health_safety', label: 'Health and Safety', topic: 'hazard control', artifact: 'inspection checklist', metric: 'near-miss rate', scenario: 'a workplace safety review' },
  { id: 'healthcare', label: 'Healthcare', topic: 'patient triage', artifact: 'care note', metric: 'response time', scenario: 'prioritizing patient needs' },
  { id: 'education', label: 'Education', topic: 'lesson planning', artifact: 'learning plan', metric: 'mastery score', scenario: 'supporting mixed-ability learners' },
  { id: 'agriculture', label: 'Agriculture', topic: 'yield planning', artifact: 'farm record', metric: 'yield per hectare', scenario: 'planning a planting season' },
  { id: 'logistics', label: 'Logistics', topic: 'inventory flow', artifact: 'dispatch schedule', metric: 'on-time delivery', scenario: 'reducing delivery delays' },
  { id: 'hospitality', label: 'Hospitality', topic: 'service recovery', artifact: 'guest profile', metric: 'satisfaction score', scenario: 'handling a guest complaint' },
  { id: 'legal_compliance', label: 'Legal and Compliance', topic: 'policy obligations', artifact: 'compliance checklist', metric: 'audit finding count', scenario: 'preparing for an internal audit' },
];

const archetypes: BlockArchetype[] = [
  {
    id: 'concept',
    label: 'Concept explainer',
    category: 'Teaching',
    intent: 'Teach one core idea',
    create: (d) => ({ type: 'explanation', title: `${d.label}: ${titleCase(d.topic)}`, body: `Explain ${d.topic} in ${d.label} using one clear idea, one plain-language definition, and one realistic example from ${d.scenario}.` }),
  },
  {
    id: 'definition',
    label: 'Definition card',
    category: 'Teaching',
    intent: 'Define key terms',
    create: (d) => ({ type: 'definition', title: `Define ${d.topic}`, body: `${titleCase(d.topic)} means the specific idea learners must recognize before they use the ${d.artifact}. Add a short definition, then explain why it matters.` }),
  },
  {
    id: 'why',
    label: 'Why it matters',
    category: 'Motivation',
    intent: 'Connect value to practice',
    create: (d) => ({ type: 'callout', title: `Why ${d.topic} matters`, body: `In ${d.scenario}, weak understanding of ${d.topic} can distort ${d.metric}. Show the learner what improves when the concept is handled well.` }),
  },
  {
    id: 'analogy',
    label: 'Analogy',
    category: 'Teaching',
    intent: 'Make abstract ideas memorable',
    create: (d) => ({ type: 'analogy', title: `${titleCase(d.topic)} analogy`, body: `Compare ${d.topic} to a familiar everyday activity. Keep the analogy short, then point out where the analogy stops being perfect.` }),
  },
  {
    id: 'worked_example',
    label: 'Worked example',
    category: 'Practice',
    intent: 'Model expert thinking',
    create: (d) => ({ type: 'example', title: `Worked example: ${d.artifact}`, body: `Walk through ${d.artifact} for ${d.scenario}. Show the starting information, the decision made, and how ${d.metric} changes.` }),
  },
  {
    id: 'case_study',
    label: 'Case study',
    category: 'Practice',
    intent: 'Apply ideas in context',
    create: (d) => ({ type: 'case_study', title: `${d.label} case study`, body: `A learner is advising ${d.scenario}. Present the situation, the constraint, and the decision that depends on ${d.topic}.`, prompt: `What should be checked first in the ${d.artifact}?` }),
  },
  {
    id: 'scenario',
    label: 'Scenario card',
    category: 'Practice',
    intent: 'Prompt situational judgment',
    create: (d) => ({ type: 'scenario', title: `Scenario: ${d.scenario}`, body: `Set up a realistic ${d.label} scenario where ${d.topic} is misunderstood. Ask the learner to identify the consequence for ${d.metric}.` }),
  },
  {
    id: 'mcq',
    label: 'Multiple choice check',
    category: 'Assessment',
    intent: 'Check recognition',
    create: (d) => ({
      type: 'question',
      title: `Quick check: ${d.topic}`,
      question: `In ${d.scenario}, what is the best first step when working with ${d.topic}?`,
      options: [`Review the ${d.artifact}`, `Ignore ${d.metric}`, 'Skip the context', 'Choose the fastest answer'],
      correctAnswer: `Review the ${d.artifact}`,
      explanation: `The ${d.artifact} gives the learner evidence before they act on ${d.topic}.`,
    }),
  },
  {
    id: 'fill_blank',
    label: 'Fill blank',
    category: 'Assessment',
    intent: 'Check recall',
    create: (d) => ({ type: 'fill_blank', title: `Complete the idea`, text: `A strong ${d.artifact} helps learners evaluate ____ in ${d.label}.`, correctAnswer: d.metric, explanation: `${titleCase(d.metric)} is the measure used to judge whether the work is improving.` }),
  },
  {
    id: 'true_false',
    label: 'True or false',
    category: 'Assessment',
    intent: 'Correct misconceptions',
    create: (d) => ({ type: 'true_false', title: `Misconception check`, statement: `In ${d.label}, ${d.topic} should be applied without checking the learner's context.`, correctAnswer: false, explanation: `Context matters because ${d.scenario} changes the evidence and tradeoffs.` }),
  },
  {
    id: 'summary',
    label: 'Lesson summary',
    category: 'Wrap-up',
    intent: 'Consolidate learning',
    create: (d) => ({ type: 'summary', title: `${d.label} summary`, body: `Summarize ${d.topic}, the role of the ${d.artifact}, and the one mistake that would damage ${d.metric}.` }),
  },
  {
    id: 'checklist',
    label: 'Checklist',
    category: 'Job aid',
    intent: 'Guide repeated action',
    create: (d) => ({ type: 'checklist', title: `${titleCase(d.artifact)} checklist`, body: `Use this checklist before making a decision about ${d.topic}.`, items: [`Confirm the goal for ${d.scenario}`, `Review the ${d.artifact}`, `Check ${d.metric}`, 'Write the next action'] }),
  },
  {
    id: 'process',
    label: 'Step-by-step process',
    category: 'Teaching',
    intent: 'Sequence a workflow',
    create: (d) => ({ type: 'process', title: `${titleCase(d.topic)} process`, body: `Break ${d.topic} into steps a beginner can follow.`, items: ['Identify the problem', `Collect the ${d.artifact}`, `Calculate or observe ${d.metric}`, 'Decide and explain why'] }),
  },
  {
    id: 'common_mistake',
    label: 'Common mistake',
    category: 'Coaching',
    intent: 'Prevent errors',
    create: (d) => ({ type: 'mistake', title: `Common mistake in ${d.topic}`, body: `A common mistake is treating ${d.metric} as the only signal. Show why that is incomplete in ${d.scenario}.` }),
  },
  {
    id: 'compare',
    label: 'Compare and contrast',
    category: 'Teaching',
    intent: 'Separate similar ideas',
    create: (d) => ({ type: 'comparison', title: `Compare two ${d.label} choices`, body: `Compare a strong ${d.artifact} with a weak one. Focus on clarity, evidence, and effect on ${d.metric}.`, items: ['Strong approach: evidence-led', 'Weak approach: assumption-led', `Signal to watch: ${d.metric}`] }),
  },
  {
    id: 'equation',
    label: 'Formula card',
    category: 'Visual',
    intent: 'Teach calculation structure',
    create: (d) => ({ type: 'equation', title: `${titleCase(d.metric)} formula`, body: `Use this formula structure as a placeholder for ${d.label}.`, equation: `${toSymbol(d.metric)} = \\frac{useful\\ outcome}{input}` }),
  },
  {
    id: 'table',
    label: 'Data table',
    category: 'Visual',
    intent: 'Compare evidence',
    create: (d) => ({ type: 'table', title: `${d.label} comparison table`, description: `Compare options in ${d.scenario}.`, columns: ['Option', d.artifact, d.metric], rows: [['A', 'Complete', 'High'], ['B', 'Partial', 'Medium'], ['C', 'Missing', 'Low']] }),
  },
  {
    id: 'graph',
    label: 'Trend graph',
    category: 'Visual',
    intent: 'Show change over time',
    create: (d) => ({ type: 'graph', title: `${titleCase(d.metric)} trend`, description: `Show how ${d.metric} changes as learners improve ${d.topic}.`, graphType: 'line', data: [{ x: 'Start', y: 35 }, { x: 'Practice', y: 58 }, { x: 'Apply', y: 78 }] }),
  },
  {
    id: 'number_line',
    label: 'Scale visual',
    category: 'Visual',
    intent: 'Locate values on a range',
    create: (d) => ({ type: 'number_line', title: `${titleCase(d.metric)} scale`, description: `Place ${d.metric} on a low-to-high performance scale.`, min: 0, max: 100, points: [{ value: 35, label: 'baseline' }, { value: 75, label: 'target' }] }),
  },
  {
    id: 'formula_sheet',
    label: 'Formula sheet',
    category: 'Visual',
    intent: 'Collect formulas',
    create: (d) => ({ type: 'formula_sheet', title: `${d.label} formula sheet`, formulas: [{ name: titleCase(d.metric), formula: `${toSymbol(d.metric)} = output / input`, description: `A compact way to discuss ${d.metric}.` }] }),
  },
  {
    id: 'reflection',
    label: 'Reflection prompt',
    category: 'Coaching',
    intent: 'Connect to learner experience',
    create: (d) => ({ type: 'reflection', title: `Reflect on ${d.topic}`, body: `Think about ${d.scenario}.`, prompt: `Where would you look first in the ${d.artifact}, and why?` }),
  },
  {
    id: 'flashcard',
    label: 'Flashcard',
    category: 'Recall',
    intent: 'Build memory',
    create: (d) => ({ type: 'flashcard', title: `${d.label} flashcard`, front: `What does ${d.topic} help you understand?`, back: `It helps you interpret the ${d.artifact} and improve ${d.metric}.` }),
  },
  {
    id: 'diagnostic',
    label: 'Diagnostic question',
    category: 'Assessment',
    intent: 'Find learner gaps',
    create: (d) => ({
      type: 'question',
      title: `Diagnostic: ${d.topic}`,
      question: `Which answer shows the learner understands ${d.topic}?`,
      options: [`They can explain ${d.metric}`, 'They memorized a word only', 'They skipped the evidence', 'They copied the example'],
      correctAnswer: `They can explain ${d.metric}`,
      explanation: `Understanding shows up when the learner can connect the concept to a measurable signal.`,
    }),
  },
  {
    id: 'mini_project',
    label: 'Mini project',
    category: 'Project',
    intent: 'Create portfolio evidence',
    create: (d) => ({ type: 'mini_project', title: `${d.label} mini project`, body: `Build a small ${d.artifact} for ${d.scenario}.`, criteria: [`Uses ${d.topic}`, `Explains ${d.metric}`, 'Includes one recommendation'] }),
  },
  {
    id: 'rubric',
    label: 'Rubric',
    category: 'Assessment',
    intent: 'Show quality levels',
    create: (d) => ({ type: 'rubric', title: `${d.artifact} rubric`, body: `Use this rubric to judge the learner's ${d.artifact}.`, criteria: ['Clear goal', 'Accurate evidence', `Correct use of ${d.metric}`, 'Practical next step'] }),
  },
  {
    id: 'role_play',
    label: 'Role play',
    category: 'Practice',
    intent: 'Practice communication',
    create: (d) => ({ type: 'role_play', title: `${d.label} role play`, body: `Learner explains ${d.topic} to someone in ${d.scenario}.`, prompt: `Use the ${d.artifact} to justify one recommendation.` }),
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary builder',
    category: 'Recall',
    intent: 'Strengthen terminology',
    create: (d) => ({ type: 'vocabulary', title: `${d.label} vocabulary`, body: `Add three terms connected to ${d.topic}.`, items: [titleCase(d.topic), titleCase(d.artifact), titleCase(d.metric)] }),
  },
  {
    id: 'timeline',
    label: 'Timeline',
    category: 'Visual',
    intent: 'Show order across time',
    create: (d) => ({ type: 'timeline', title: `${d.label} timeline`, body: `Show when ${d.topic} decisions happen.`, items: ['Before action: define the goal', `During action: update the ${d.artifact}`, `After action: review ${d.metric}`] }),
  },
  {
    id: 'audit',
    label: 'Audit trail',
    category: 'Job aid',
    intent: 'Make evidence inspectable',
    create: (d) => ({ type: 'audit_trail', title: `${d.artifact} audit trail`, body: `List the evidence a reviewer would need to trust the ${d.artifact}.`, items: ['Source data', 'Assumption', 'Decision', 'Result'] }),
  },
  {
    id: 'risk',
    label: 'Risk review',
    category: 'Decision',
    intent: 'Evaluate downside',
    create: (d) => ({ type: 'risk_review', title: `Risk review: ${d.topic}`, body: `Identify what can go wrong when ${d.topic} is used poorly in ${d.scenario}.`, items: [`Misread ${d.metric}`, `Incomplete ${d.artifact}`, 'Wrong recommendation'] }),
  },
  {
    id: 'calculator',
    label: 'Calculator card',
    category: 'Practice',
    intent: 'Practice numeric thinking',
    create: (d) => ({ type: 'calculator', title: `${titleCase(d.metric)} calculator`, body: `Give learners two inputs and ask them to estimate ${d.metric}.`, prompt: `What changes if the input increases by 10%?` }),
  },
  {
    id: 'peer_explain',
    label: 'Teach-back',
    category: 'Coaching',
    intent: 'Check if learner can explain',
    create: (d) => ({ type: 'teach_back', title: `Explain ${d.topic}`, body: `Learner explains ${d.topic} to a peer using the ${d.artifact}.`, prompt: `Keep the explanation under three sentences.` }),
  },
  {
    id: 'misconception',
    label: 'Misconception repair',
    category: 'Coaching',
    intent: 'Replace false mental models',
    create: (d) => ({ type: 'misconception', title: `Repair a misconception`, body: `Misconception: ${d.topic} is only theory. Better view: it changes decisions in ${d.scenario} by improving ${d.metric}.` }),
  },
  {
    id: 'practice_task',
    label: 'Practice task',
    category: 'Practice',
    intent: 'Move from reading to doing',
    create: (d) => ({ type: 'practice_task', title: `Practice ${d.topic}`, body: `Complete one action using the ${d.artifact}.`, prompt: `Write the decision and the evidence used.` }),
  },
  {
    id: 'benchmark',
    label: 'Benchmark',
    category: 'Decision',
    intent: 'Compare current state to target',
    create: (d) => ({ type: 'benchmark', title: `${titleCase(d.metric)} benchmark`, body: `Compare current ${d.metric} with a target level and explain the gap.`, items: ['Current', 'Target', 'Gap', 'Action'] }),
  },
  {
    id: 'exam_tip',
    label: 'Exam tip',
    category: 'Assessment',
    intent: 'Prepare for tests',
    create: (d) => ({ type: 'exam_tip', title: `${d.label} exam tip`, body: `When asked about ${d.topic}, define it, connect it to the ${d.artifact}, then explain how it affects ${d.metric}.` }),
  },
  {
    id: 'glossary',
    label: 'Glossary',
    category: 'Recall',
    intent: 'Collect useful words',
    create: (d) => ({ type: 'glossary', title: `${d.label} glossary`, items: [`${titleCase(d.topic)}: key idea`, `${titleCase(d.artifact)}: evidence source`, `${titleCase(d.metric)}: performance signal`] }),
  },
  {
    id: 'objectives',
    label: 'Learning objectives',
    category: 'Planning',
    intent: 'Set learner expectations',
    create: (d) => ({ type: 'objectives', title: `${d.label} objectives`, body: `By the end, learners should be able to use ${d.topic} in ${d.scenario}.`, items: [`Explain ${d.topic}`, `Read the ${d.artifact}`, `Interpret ${d.metric}`] }),
  },
  {
    id: 'transfer',
    label: 'Transfer task',
    category: 'Practice',
    intent: 'Apply learning in a new context',
    create: (d) => ({ type: 'transfer_task', title: `Transfer ${d.topic}`, body: `Apply ${d.topic} outside the original example.`, prompt: `How would the ${d.artifact} change in a different organization?` }),
  },
  {
    id: 'capstone',
    label: 'Capstone prompt',
    category: 'Project',
    intent: 'Combine lesson skills',
    create: (d) => ({ type: 'capstone_prompt', title: `${d.label} capstone`, body: `Create a final ${d.artifact} for ${d.scenario} and defend the decision using ${d.metric}.`, criteria: ['Clear context', 'Correct method', 'Evidence-based recommendation'] }),
  },
];

export const BLOCK_TEMPLATE_LIBRARY: CourseBlockTemplate[] = BLOCK_TEMPLATE_DOMAINS.flatMap((domain) =>
  archetypes.map((archetype) => ({
    id: `${domain.id}-${archetype.id}`,
    label: archetype.label,
    domain: domain.id,
    domainLabel: domain.label,
    category: archetype.category,
    intent: archetype.intent,
    description: `${archetype.intent} for ${domain.label.toLowerCase()} courses.`,
    block: archetype.create(domain),
  }))
);

export const COURSE_BLOCK_TEMPLATE_COUNT = BLOCK_TEMPLATE_LIBRARY.length;

export const BLOCK_TEMPLATE_CATEGORIES = Array.from(new Set(BLOCK_TEMPLATE_LIBRARY.map((template) => template.category))).sort();

export function findBlockTemplate(id: string) {
  return BLOCK_TEMPLATE_LIBRARY.find((template) => template.id === id) ?? null;
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toSymbol(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

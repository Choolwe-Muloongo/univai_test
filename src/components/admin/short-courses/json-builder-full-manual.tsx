'use client';

import { AlertTriangle, BookOpen, CheckCircle2, Code2, FileJson, Layers3, Sparkles } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ManualFamily = { name: string; category: string; description: string; types: string[] };
type ManualSpecialCard = { title: string; type: string; category: string; purpose: string; fields: string[]; minimum: unknown; recommended: unknown; mistakes: string[] };
type GuideSection = { title: string; body: string; code?: unknown; notes?: string[] };

const universalCardSchema = {
  type: 'explanation',
  title: 'Clear learner-facing title',
  body: 'Main explanation, instruction, story, note, or teaching content.',
  prompt: 'Optional learner instruction or task.',
  question: 'Optional question text.',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  correctAnswer: 'Option A',
  answer: 'Optional answer for simpler cards.',
  explanation: 'Feedback, reasoning, or answer guidance.',
  visual: { type: 'graph | table | equation | formula_sheet | number_line | venn' },
  required: false,
  certificateRequired: false,
  workflowTemplate: 'teach | example | checkpoint | visual | flashcard | practice_task | case_scenario | summary | worked_solution | proof',
  subjectArea: 'mathematics, physics, coding, business, accounting, etc.',
  teachingMove: 'The teaching purpose of this card.',
};

const fullCourseExample = {
  course: {
    title: 'MA110: Set Theory and Real Numbers',
    description: 'A structured short course built from JSON.',
    schoolId: 'school-id-here',
    level: 'first_year_university',
    durationHours: 24,
    entryFee: 0,
    currency: 'ZMW',
    certificateFee: 50,
    audience: 'First-year university mathematics students.',
    prerequisites: ['Basic algebra', 'Secondary school arithmetic'],
    outcomes: ['Use set notation', 'Draw Venn diagrams', 'Solve real-number property questions'],
  },
  modules: [
    {
      id: 'module-sets',
      title: 'Sets and Venn Diagrams',
      description: 'Learners move from notation to visual reasoning.',
      outcomes: ['Represent sets correctly', 'Interpret union and intersection'],
      lessons: [
        {
          id: 'lesson-set-basics',
          title: 'Set basics',
          summary: 'Learn notation, elements, subsets, and membership.',
          outcomes: ['Define a set', 'Use membership symbols'],
          cards: [
            { type: 'lesson_intro', title: 'Why sets matter', body: 'Sets help us group objects clearly before solving problems.', workflowTemplate: 'teach', subjectArea: 'mathematics' },
            { type: 'definition', title: 'Set', body: 'A set is a well-defined collection of objects.', teachingMove: 'Define the core term.' },
            { type: 'worked_example', title: 'Membership example', body: 'If A = {1, 2, 3}, then 2 ∈ A and 5 ∉ A.', explanation: 'Membership checks whether an item belongs to a set.' },
            { type: 'venn_diagram', title: 'Union and intersection', body: 'Use overlapping circles to show shared and separate regions.', visual: { type: 'venn', setCount: 2, labels: ['A', 'B'], highlight: 'intersection', description: 'The overlap represents A ∩ B.' } },
            { type: 'lesson_checkpoint', question: 'Which symbol means belongs to?', options: ['∈', '⊂', '∪', '∩'], correctAnswer: '∈', explanation: 'The symbol ∈ means an element belongs to a set.', certificateRequired: true },
          ],
          subLessons: [
            {
              id: 'sub-venn-regions',
              title: 'Reading Venn regions',
              summary: 'Practise region identification.',
              outcomes: ['Identify intersection and complement'],
              cards: [
                { type: 'graph_labeling_activity', title: 'Label the regions', body: 'Ask learners to label each Venn region before solving.', prompt: 'Label A only, B only, A ∩ B, and outside both sets.' },
              ],
            },
          ],
        },
      ],
    },
  ],
  questions: [
    { id: 'q1', type: 'mcq', difficulty: 'medium', question: 'What does A ∩ B represent?', options: ['Items in A only', 'Items in B only', 'Items in both A and B', 'Items outside both sets'], answer: 'Items in both A and B', explanation: 'Intersection means the shared part of the sets.' },
  ],
};

const guideSections: GuideSection[] = [
  {
    title: '1. What this manual teaches',
    body: 'This page teaches how to type valid UnivAI course JSON. It is a schema and examples manual, not just a button-click guide. A teacher or AI assistant should be able to copy these patterns and generate lessons, sub-lessons, cards, visuals, and assessment questions safely.',
  },
  {
    title: '2. Full course JSON shape',
    body: 'A complete course should have course information, modules, lessons, cards, optional subLessons, and a question bank. Keep the hierarchy clean: modules contain lessons; lessons contain cards; subLessons also contain cards.',
    code: { course: 'object', modules: ['module objects'], questions: ['quiz/question bank objects'] },
    notes: ['Use arrays for modules, lessons, cards, subLessons, outcomes, options, and questions.', 'Give every major item a clear title.', 'Keep one teaching idea per card. Long paragraphs should become multiple cards.'],
  },
  {
    title: '3. Universal card schema',
    body: 'Most UnivAI cards are built from the same shared shape. Not every card needs every field. Start with type, title, and body, then add question fields, visual fields, or certificate fields only when needed.',
    code: universalCardSchema,
    notes: ['type decides how the card behaves.', 'title and body are the safest basic fields.', 'question/options/correctAnswer/explanation are used for auto-marked checks.', 'visual is used for graphs, tables, formula sheets, number lines, equations, and diagrams.'],
  },
  {
    title: '4. Lesson and sub-lesson format',
    body: 'Use subLessons when one lesson has smaller parts. Example: a main lesson on Sets can have sub-lessons for membership, subsets, Venn regions, and real-number intervals.',
    code: {
      id: 'lesson-id',
      title: 'Lesson title',
      summary: 'Short lesson summary.',
      outcomes: ['Outcome 1', 'Outcome 2'],
      cards: [{ type: 'explanation', title: 'Main idea', body: 'Teach the idea.' }],
      subLessons: [{ id: 'sub-lesson-id', title: 'Sub-lesson title', summary: 'Short summary.', cards: [{ type: 'example', title: 'Example', body: 'Show one example.' }] }],
    },
  },
  {
    title: '5. Question and assessment format',
    body: 'Questions can appear inside lessons as cards or in the course question bank. For MCQs, always provide options and the correct answer. For short-answer questions, provide answer guidance and an explanation.',
    code: {
      type: 'mcq',
      difficulty: 'easy | medium | hard | very_hard',
      question: 'Question text?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: 'Option A',
      explanation: 'Why the answer is correct.',
      timeSeconds: 60,
    },
  },
  {
    title: '6. Recommended card writing pattern',
    body: 'A strong lesson usually follows this rhythm: intro, definition, explanation, example, activity, checkpoint, summary. Do not dump an entire chapter into one card. UnivAI works best when each card has one job.',
    code: [
      { type: 'lesson_intro', title: 'What you will learn', body: 'Frame the lesson.' },
      { type: 'definition', title: 'Key term', body: 'Define one term.' },
      { type: 'worked_example', title: 'Worked example', body: 'Show one full example.' },
      { type: 'practice_task', title: 'Try it', prompt: 'Give the learner one task.', criteria: ['Shows working', 'Checks answer'] },
      { type: 'lesson_checkpoint', question: 'Check understanding?', options: ['A', 'B'], correctAnswer: 'A', explanation: 'Feedback.' },
      { type: 'summary', title: 'Remember this', body: 'Summarize the key ideas.' },
    ],
  },
];

const visualFormats: GuideSection[] = [
  { title: 'Equation visual', body: 'Use this when the card needs a displayed equation.', code: { type: 'equation', title: 'Newton’s Second Law', body: 'Force equals mass times acceleration.', visual: { type: 'equation', equation: 'F = ma' } } },
  { title: 'Function graph visual', body: 'Use this for a graph of a function.', code: { type: 'graph', title: 'Linear graph', body: 'Study the line y = 2x + 1.', visual: { type: 'graph', graphType: 'function', functions: [{ expression: '2*x + 1', label: 'y = 2x + 1' }], xMin: -5, xMax: 5, yMin: -10, yMax: 10 } } },
  { title: 'Point/scatter graph visual', body: 'Use this when learners need points instead of a function.', code: { type: 'graph_point_plotter', title: 'Plot ordered pairs', body: 'Plot the points on the graph.', visual: { type: 'graph', graphType: 'scatter', data: [{ x: 1, y: 2, label: '(1,2)' }, { x: 3, y: 4, label: '(3,4)' }] } } },
  { title: 'Table visual', body: 'Use this for values, observations, formulas, comparisons, budgets, accounts, or datasets.', code: { type: 'statistics_table', title: 'Class scores', body: 'Read the values and answer the question.', visual: { type: 'table', columns: ['Student', 'Score'], rows: [['A', 70], ['B', 82], ['C', 65]] } } },
  { title: 'Formula sheet visual', body: 'Use this when a lesson needs several formulas with explanations.', code: { type: 'formula_sheet', title: 'Motion formulas', body: 'Use the right formula for each motion problem.', visual: { type: 'formula_sheet', formulas: [{ name: 'Speed', formula: 'v = d/t', description: 'Speed equals distance divided by time.' }, { name: 'Acceleration', formula: 'a = Δv/t', description: 'Acceleration is change in velocity over time.' }] } } },
  { title: 'Number line visual', body: 'Use this for intervals, inequalities, integer movement, or real number sets.', code: { type: 'number_line', title: 'Interval notation', body: 'Show the interval 1 < x ≤ 5.', visual: { type: 'number_line', min: -2, max: 8, points: [1, 5], intervals: [{ start: 1, end: 5, startClosed: false, endClosed: true, label: '1 < x ≤ 5' }] } } },
  { title: 'Venn visual', body: 'Use this for sets, logic, probability, overlap, and classification.', code: { type: 'venn_diagram', title: 'A intersection B', body: 'The overlap is the intersection.', visual: { type: 'venn', setCount: 2, labels: ['A', 'B'], highlight: 'intersection', description: 'A ∩ B means items in both A and B.' } } },
];

const specialCards: ManualSpecialCard[] = [
  {
    title: 'Chemistry Visual Engine',
    type: 'chemistry_visual',
    category: 'science',
    purpose: 'Build chemistry activities that render equations, particles, tables, steps, observations, and interactions instead of static text only.',
    fields: ['type', 'title', 'body', 'chemistryTemplate', 'chemistryCardType', 'visual', 'required'],
    minimum: { type: 'chemistry_visual', title: 'Balancing equations', body: 'Balance the equation.', chemistryTemplate: 'equation_balancer' },
    recommended: { type: 'chemistry_visual', title: 'Balancing sodium and chlorine', body: 'Learners balance the equation, count atoms, and answer a checkpoint.', chemistryTemplate: 'equation_balancer', chemistryCardType: 'equation_balancer_card', required: true, visual: { id: 'chem-eq-1', subject: 'chemistry', visualType: 'equation', template: 'equation_balancer', equation: { reactants: ['Na', 'Cl2'], products: ['NaCl'], balanced: '2Na + Cl2 -> 2NaCl' }, steps: [{ id: 's1', title: 'Count atoms', explanation: 'Count each atom on both sides before changing coefficients.' }], interactions: [{ id: 'q1', type: 'enter_coefficients', prompt: 'Enter the missing coefficients.', correctAnswer: '2,1,2' }] } },
    mistakes: ['Do not put the entire chemistry activity only in body.', 'Do not omit the balanced equation when the card is an equation balancer.', 'Do not use images when structured equation data is possible.'],
  },
  {
    title: 'Physics Visual Engine',
    type: 'physics_visual',
    category: 'physics',
    purpose: 'Build interactive physics diagrams, simulations, forces, pulleys, collisions, waves, circuits, optics, lab visuals, arrows, labels, steps, and interactions.',
    fields: ['type', 'title', 'body', 'physicsTemplate', 'physicsCardType', 'visual', 'required'],
    minimum: { type: 'physics_visual', title: 'Free-body diagram', body: 'Identify the forces acting on the object.', physicsTemplate: 'free_body' },
    recommended: { type: 'physics_visual', title: 'Free-body diagram', body: 'Learners identify the forces acting on a block.', physicsTemplate: 'free_body', physicsCardType: 'free_body_diagram_card', required: true, visual: { id: 'physics-free-body-1', subject: 'physics', visualType: 'diagram', template: 'free_body', renderMode: 'svg', canvas: { width: 800, height: 500, background: 'plain' }, objects: [{ id: 'block', type: 'rectangle', x: 340, y: 230, width: 120, height: 90, label: 'Block' }], arrows: [{ id: 'weight', type: 'force', from: { x: 400, y: 320 }, to: { x: 400, y: 430 }, label: 'W = mg', isInteractive: true }], labels: [{ id: 'title', text: 'Forces acting on the block', x: 260, y: 70 }], steps: [{ id: 's1', title: 'Find weight', explanation: 'Weight acts vertically downward.', highlightObjectIds: ['weight'], equation: 'W = mg' }], interactions: [{ id: 'select-weight', type: 'select_arrow', prompt: 'Which arrow shows weight?', correctTargetId: 'weight' }] } },
    mistakes: ['Do not describe a diagram only in words when arrows, objects, and labels are needed.', 'Use clear object IDs because interactions depend on them.', 'Keep coordinates realistic inside the canvas.'],
  },
  {
    title: 'First-class Coding Card',
    type: 'code_playground / debug_code / complete_code / predict_output / code_explanation / code_mini_project',
    category: 'coding',
    purpose: 'Give learners a real code workspace with files, tests, hints, solution files, expected output, preview mode, and AI help.',
    fields: ['type', 'title', 'instructions', 'language', 'files', 'tests', 'hints', 'solutionFiles', 'expectedOutput', 'previewMode', 'aiHelpEnabled'],
    minimum: { type: 'debug_code', title: 'Fix the bug', instructions: 'Find and fix the bug.', language: 'javascript', files: [{ name: 'script.js', content: 'console.log("Hello")' }] },
    recommended: { type: 'debug_code', title: 'Fix the broken HTML form', instructions: 'Find and fix the missing closing label and invalid input type.', language: 'html', files: [{ name: 'index.html', content: '<form><label>Name<input typ="text"></form>' }], tests: [{ type: 'contains', file: 'index.html', value: 'type="text"', description: 'Input type fixed' }], hints: ['Check attributes carefully.'], solutionFiles: [{ name: 'index.html', content: '<form><label>Name</label><input type="text"></form>' }], expectedOutput: 'A valid form with one text input.', previewMode: 'html', aiHelpEnabled: true },
    mistakes: ['Do not forget files; coding cards need actual file content.', 'Do not give tests that check something unrelated to the task.', 'Keep solutionFiles separate from the learner starter files.'],
  },
];

const families: ManualFamily[] = [
  { name: 'Teaching Cards', category: 'teaching', description: 'General explanation, context, revision, tips, stories, mistakes, comparisons, and teacher guidance.', types: ['explanation','example','summary','definition','key_point','note','tip','warning','important_notice','concept_card','fact_card','story_card','scenario','case_study','real_world_example','analogy','myth_vs_fact','common_mistake','best_practice','quick_revision','recap','lesson_intro','lesson_objectives','lesson_outcomes','lesson_checkpoint','lesson_wrap_up','prerequisite_reminder','background_context','historical_context','industry_context','step_by_step','process_explanation','workflow_explanation','comparison','pros_and_cons','cause_and_effect','problem_solution','timeline','checklist','do_and_dont','teacher_note','learner_note'] },
  { name: 'Classroom Board Cards', category: 'classroom_board', description: 'Teacher-on-the-board style steps for equations, proofs, accounting, code tracing, reveals, and mistake correction.', types: ['board_intro','board_problem','board_step','board_explanation','board_reveal','board_highlight','board_annotation','board_question','board_missing_step','board_side_note','board_common_error','board_final_answer','board_summary','equation_board','algebra_step_board','proof_step_board','calculus_step_board','geometry_step_board','formula_substitution_board','missing_math_step','reveal_solution_step','compare_two_methods','mistake_correction_step','transaction_board','account_identification_step','debit_credit_reasoning_step','journal_entry_step','ledger_posting_step','t_account_step','trial_balance_step','financial_statement_step','accounting_error_step','accounting_final_explanation','code_explanation_step','code_trace_step','output_prediction_step','bug_fix_step','test_case_step','code_reveal_step'] },
  { name: 'Question and Assessment Cards', category: 'questions', description: 'Tests, quizzes, mocks, diagnostics, reviews, certificate gates, and teacher-marked assessment prompts.', types: ['mini_quiz','timed_quiz','checkpoint_test','section_test','module_test','diagnostic_test','placement_test','pre_test','post_test','mock_exam','past_paper_question','case_assessment','scenario_assessment','rubric_assessment','oral_assessment_prompt','peer_review_prompt','self_assessment','teacher_marked_question','auto_marked_question','adaptive_question','difficulty_scaled_question','randomized_question','question_bank_draw','exam_unlock_question','certificate_requirement_question','exam_section_intro','exam_timer_block','exam_review_block','exam_result_block','retake_prompt'] },
  { name: 'Mathematics Cards', category: 'math', description: 'Formulae, worked examples, graphs, number lines, geometry, statistics, set theory, logic, and mathematical reasoning.', types: ['equation','formula','formula_sheet','worked_example','step_solution','missing_step','proof_step','algebra_solver_step','factorization_activity','simplification_activity','expansion_activity','equation_balancing','simultaneous_equation_activity','quadratic_activity','function_plot','graph','graph_interpretation','coordinate_plane','number_line','fraction_input','decimal_input','percentage_activity','ratio_activity','proportion_activity','unit_conversion','scientific_notation','matrix','determinant_activity','vector_activity','trigonometry_activity','geometry_diagram','angle_finder','triangle_solver','circle_activity','area_calculation','volume_calculation','calculus_limit','derivative_activity','integration_activity','sequence_activity','series_activity','statistics_table','mean_median_mode','standard_deviation_activity','probability_tree','venn_diagram','set_notation_activity','truth_table','logic_expression','logic_gate','math_error_correction','math_method_comparison','formula_substitution','symbol_matching','math_word_problem'] },
  { name: 'Graphing Cards', category: 'graphing', description: 'Axis setup, tables of values, point plotting, gradients, intercepts, transformations, interpretation, and graph error finding.', types: ['graph_intro','graph_equation_setup','graph_table_of_values','graph_point_plotter','graph_axis_setup','graph_intercept_finder','graph_gradient_explainer','graph_curve_explainer','graph_turning_point_explainer','graph_asymptote_explainer','graph_domain_range_explainer','graph_transformation_step','graph_final_plot','graph_interpretation_question','linear_graph_builder','quadratic_graph_builder','exponential_graph_builder','logarithmic_graph_builder','trigonometric_graph_builder','piecewise_graph_builder','inequality_graph_builder','scatter_plot_builder','line_of_best_fit','graph_matching_activity','graph_error_finder','graph_prediction_activity','graph_labeling_activity'] },
  { name: 'Coding Cards', category: 'coding', description: 'First-class coding labs plus generic debugging, completion, tracing, testing, API, SQL, JSON, YAML, Markdown, and security review cards.', types: ['code_playground','debug_code','complete_code','predict_output','code_explanation','code_mini_project','code_snippet','code_activity','code_output_prediction','fix_the_bug','fill_missing_code','complete_function','complete_class','complete_loop','complete_condition','reorder_code','code_multiple_choice','code_trace','code_review','unit_test_activity','function_test','input_output_test','algorithm_challenge','pseudocode_activity','flowchart_to_code','code_to_flowchart','terminal_command_activity','regex_activity','json_editor','yaml_editor','markdown_editor','api_request_builder','sql_query_activity','database_table_activity','database_schema_builder','crud_activity','auth_logic_activity','error_message_interpretation','refactor_code','optimize_code','security_code_review'] },
  { name: 'Web Development Cards', category: 'web', description: 'HTML, CSS, JavaScript, UI, APIs, auth, uploads, responsive design, accessibility, SEO, and portfolio building.', types: ['html_preview','html_structure_activity','html_tag_match','html_attribute_activity','semantic_html_activity','form_builder_activity','css_selector_activity','css_box_model','css_specificity_activity','flexbox_activity','grid_layout_activity','responsive_design_activity','media_query_activity','color_palette_activity','typography_activity','ui_component_builder','dom_manipulation_activity','event_listener_activity','javascript_console_task','form_validation_activity','fetch_api_activity','local_storage_activity','component_builder','props_state_activity','route_builder','database_crud_activity','api_integration_activity','auth_flow_activity','session_cookie_activity','file_upload_activity','ui_clone_activity','landing_page_builder','portfolio_section_builder','navbar_builder','card_layout_builder','dashboard_layout_builder','responsive_preview','accessibility_check_web','seo_basics_activity'] },
  { name: 'Science Cards', category: 'science', description: 'Lab simulations, experiments, observations, chemistry, physics, biology diagrams, safety, scientific graphs, and error analysis.', types: ['lab_simulation','experiment_steps','hypothesis_builder','observation_table','results_table','scientific_method_activity','chemical_equation_balancer','periodic_table_activity','molecule_builder','atom_structure_activity','reaction_type_activity','circuit_diagram','force_diagram','energy_calculation','motion_graph_activity','wave_diagram','optics_diagram','biology_label_diagram','body_system_labeling','cell_labeling','genetics_cross_activity','classification_tree','food_chain_activity','ecosystem_activity','climate_data_activity','lab_safety_check','scientific_graph_builder','experiment_error_analysis'] },
  { name: 'Accounting Cards', category: 'accounting', description: 'Transactions, debit-credit reasoning, journals, ledgers, trial balance, financial statements, reconciliation, depreciation, and inventory.', types: ['transaction_board','account_identification_step','debit_credit_reasoning_step','journal_entry_step','ledger_posting_step','t_account_step','trial_balance_step','financial_statement_step','accounting_error_step','accounting_final_explanation','account_sorting','accounting_cycle_simulation','income_statement_builder','balance_sheet_builder','cash_flow_statement_builder','double_entry_check','adjusting_entry_step','bank_reconciliation_activity','depreciation_activity','inventory_valuation_activity'] },
  { name: 'Spreadsheet Cards', category: 'spreadsheet', description: 'Tables, spreadsheet formulas, dashboards, charts, budgets, payroll, gradebooks, forecasting, validation, and formula debugging.', types: ['spreadsheet_activity','editable_table','formula_cell','sum_activity','average_activity','min_max_activity','count_activity','if_formula_activity','lookup_activity','vlookup_activity','xlookup_activity','index_match_activity','pivot_table_activity','sort_filter_activity','data_cleaning_activity','conditional_formatting_activity','chart_builder','bar_chart_activity','line_chart_activity','pie_chart_activity','scatter_plot_activity','dashboard_builder','budget_spreadsheet','sales_report_table','invoice_spreadsheet','inventory_table','gradebook_table','payroll_table','financial_model_table','loan_amortization_table','forecasting_table','what_if_analysis','scenario_table','data_validation_activity','spreadsheet_error_finder','formula_debugging','cell_reference_activity','relative_absolute_reference','spreadsheet_shortcut_tip','excel_case_task'] },
  { name: 'Business Cards', category: 'business', description: 'Business model, SWOT, pricing, marketing, sales, pitch decks, decision matrices, HR, operations, and planning.', types: ['business_model_canvas','swot_analysis','pestle_analysis','market_segmentation','customer_persona_builder','value_proposition_builder','pricing_strategy_activity','break_even_activity','marketing_plan_builder','sales_funnel_activity','pitch_deck_builder','competitor_analysis','business_case_study','decision_matrix','risk_matrix','budget_planning','operations_flowchart','business_process_mapping','customer_journey_map','brand_positioning_activity','mission_vision_builder','startup_cost_calculator','revenue_model_builder','cash_flow_planning','sales_script_builder','negotiation_scenario','customer_service_scenario','hr_policy_activity','recruitment_plan_builder','performance_review_activity','business_pitch_activity','business_plan_section'] },
  { name: 'Project Cards', category: 'projects', description: 'Project intros, stages, tasks, milestones, portfolios, rubrics, validation, gates, final projects, showcase, and export.', types: ['project_intro','project_step','project_stage','project_checklist','milestone','build_task','mini_project','portfolio_item','project_reflection','rubric_check','stage_complete','project_preview','project_validation','project_score','project_hint','project_unlock','project_required_gate','final_project_stage','project_showcase','project_export'] },
];

const commonMistakes = [
  { title: 'Invalid JSON comments', wrong: '{ // do not write comments inside JSON }', fix: { type: 'explanation', title: 'No comments', body: 'JSON cannot contain comments.' } },
  { title: 'Missing commas', wrong: '{ "type": "explanation" "title": "Broken" }', fix: { type: 'explanation', title: 'Fixed comma', body: 'Separate fields with commas.' } },
  { title: 'Wrong options format', wrong: { type: 'lesson_checkpoint', question: 'Pick one', options: 'A, B, C', correctAnswer: 'A' }, fix: { type: 'lesson_checkpoint', question: 'Pick one', options: ['A', 'B', 'C'], correctAnswer: 'A' } },
  { title: 'Too much in one card', wrong: { type: 'explanation', title: 'Whole chapter', body: 'A very long chapter pasted into one card...' }, fix: [{ type: 'lesson_intro', title: 'Intro', body: 'Frame the topic.' }, { type: 'definition', title: 'Key term', body: 'Define one idea.' }, { type: 'worked_example', title: 'Example', body: 'Show one example.' }] },
  { title: 'Visual stored only as text', wrong: { type: 'graph', title: 'Graph y = x²', body: 'Draw a graph of y = x squared.' }, fix: { type: 'graph', title: 'Graph y = x²', body: 'Study the curve.', visual: { type: 'graph', graphType: 'function', functions: [{ expression: 'x*x', label: 'y = x²' }] } } },
];

const questionSignals = ['question', 'quiz', 'test', 'exam', 'assessment', 'prediction', 'debug', 'fix', 'fill', 'match', 'sort', 'label', 'review', 'checker', 'checkpoint'];
const visualCategories = ['math', 'graphing', 'science', 'media', 'drag-drop'];
const visualTypeSignals = ['graph', 'diagram', 'chart', 'table', 'visual', 'equation', 'formula', 'venn', 'number_line', 'matrix'];

function titleCase(value: string) { return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function pretty(value: unknown) { return typeof value === 'string' ? value : JSON.stringify(value, null, 2); }
function isQuestionLike(type: string) { return questionSignals.some((signal) => type.includes(signal)); }
function isVisualLike(type: string, category: string) { return visualCategories.includes(category) || visualTypeSignals.some((signal) => type.includes(signal)); }

function useWhen(type: string, category: string) {
  const name = titleCase(type);
  if (type.includes('intro')) return `Use ${name} to open a lesson, frame the purpose, and tell learners what they are about to master.`;
  if (type.includes('summary') || type.includes('recap')) return `Use ${name} after a concept to compress the key ideas without losing the lesson logic.`;
  if (type.includes('mistake') || type.includes('error') || type.includes('bug')) return `Use ${name} to show a wrong attempt, explain why it fails, and train learners to diagnose errors.`;
  if (isQuestionLike(type)) return `Use ${name} when the learner must answer, prove understanding, unlock progress, or receive feedback.`;
  if (type.includes('builder')) return `Use ${name} when the learner must construct something, not just read about it.`;
  if (type.includes('activity')) return `Use ${name} when learners need hands-on practice inside the lesson.`;
  if (type.includes('step')) return `Use ${name} for one step in a larger worked process. Keep one step per card.`;
  if (type.includes('table')) return `Use ${name} when information must be organized in rows, columns, values, observations, or calculations.`;
  if (isVisualLike(type, category)) return `Use ${name} when the lesson needs structured visual data, not just plain text.`;
  return `Use ${name} when this exact teaching move improves the lesson flow and helps the learner do something specific.`;
}

function aiPrompt(type: string, category: string) {
  return `Create one UnivAI JSON card of type "${type}" for a ${category} lesson. Return valid JSON only. Include title, body, prompt/question where needed, options and correctAnswer for marked questions, explanation for feedback, and visual data if this card needs a graph, table, diagram, equation, or media.`;
}

function minimumExample(type: string) {
  if (isQuestionLike(type)) return { type, title: titleCase(type), question: `Write one ${titleCase(type)} question.`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A', explanation: 'Explain why this answer is correct.' };
  return { type, title: titleCase(type), body: `Learner-facing content for ${titleCase(type)}.` };
}

function recommendedExample(type: string, category: string) {
  const example: Record<string, unknown> = { ...minimumExample(type), workflowTemplate: isQuestionLike(type) ? 'checkpoint' : isVisualLike(type, category) ? 'visual' : 'teach', subjectArea: category, teachingMove: useWhen(type, category), required: false, certificateRequired: false };
  if (isVisualLike(type, category)) example.visual = { type: type.includes('venn') ? 'venn' : type.includes('table') ? 'table' : type.includes('equation') || type.includes('formula') ? 'equation' : 'graph', instruction: 'Replace this with structured visual data from the visual examples section.' };
  if (type.includes('rubric') || type.includes('project') || type.includes('portfolio')) Object.assign(example, { rubric: ['Clear work', 'Correct method', 'Good explanation'], submissionInstructions: 'Tell learners what to submit.', manualReview: true });
  return example;
}

function usefulFields(type: string, category: string) {
  const fields = ['type', 'title', 'body', 'workflowTemplate', 'subjectArea', 'teachingMove'];
  if (isQuestionLike(type)) fields.push('question', 'options', 'correctAnswer', 'answer', 'explanation');
  if (isVisualLike(type, category)) fields.push('visual');
  if (type.includes('rubric') || type.includes('project') || type.includes('portfolio')) fields.push('rubric', 'submissionInstructions', 'manualReview');
  fields.push('required', 'certificateRequired');
  return fields;
}

export function JsonBuilderFullManual() {
  const totalCards = specialCards.length + families.reduce((sum, family) => sum + family.types.length, 0);
  return (
    <Card className="rounded-3xl border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl"><BookOpen className="h-6 w-6 text-primary" /> UnivAI JSON Builder Card Manual</CardTitle>
            <CardDescription className="mt-2 max-w-5xl text-sm leading-6">A JSON-first guide for writing UnivAI course files by hand or with AI. It covers the full course structure, universal card schema, lesson/sub-lesson format, visual payloads, assessment format, special cards, common mistakes, and examples for every registered card family.</CardDescription>
          </div>
          <div className="rounded-2xl border bg-background px-4 py-3 text-sm shadow-sm"><b>{totalCards}+</b> card formats documented</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border bg-background/80 p-4"><Layers3 className="mb-2 h-5 w-5 text-primary" /><h3 className="font-semibold">Full JSON hierarchy</h3><p className="mt-1 text-sm text-muted-foreground">Course, modules, lessons, sub-lessons, cards, visuals, and questions.</p></div>
          <div className="rounded-2xl border bg-background/80 p-4"><FileJson className="mb-2 h-5 w-5 text-primary" /><h3 className="font-semibold">Type-by-type examples</h3><p className="mt-1 text-sm text-muted-foreground">Each card type includes fields, minimum JSON, recommended JSON, and AI prompts.</p></div>
          <div className="rounded-2xl border bg-background/80 p-4"><Sparkles className="mb-2 h-5 w-5 text-primary" /><h3 className="font-semibold">AI-ready prompts</h3><p className="mt-1 text-sm text-muted-foreground">Teachers can ask AI to generate strict JSON without guessing the structure.</p></div>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Part 1: JSON foundations</h2>
          {guideSections.map((section) => <GuideArticle key={section.title} section={section} />)}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Part 2: Visual JSON formats</h2>
          <p className="text-sm leading-6 text-muted-foreground">Do not describe graphs, tables, equations, and Venn diagrams only in body text. Put structured data inside visual so UnivAI can render it properly.</p>
          <div className="grid gap-4 lg:grid-cols-2">{visualFormats.map((section) => <GuideArticle key={section.title} section={section} />)}</div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Part 3: Special cards with dedicated formats</h2>
          <div className="grid gap-4 lg:grid-cols-2">{specialCards.map((card) => <SpecialCardArticle key={card.title} card={card} />)}</div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Part 4: Common JSON mistakes and fixes</h2>
          <div className="grid gap-4 lg:grid-cols-2">{commonMistakes.map((mistake) => <article key={mistake.title} className="rounded-2xl border bg-background/80 p-4 shadow-sm"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /><h3 className="font-semibold">{mistake.title}</h3></div><div className="mt-3 grid gap-3"><CodePanel title="Wrong" value={mistake.wrong} /><CodePanel title="Fixed" value={mistake.fix} /></div></article>)}</div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Part 5: Every card family and type</h2>
          {families.map((family) => <div key={family.name} className="space-y-4"><div className="rounded-2xl border bg-primary/5 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{family.category}</p><h3 className="text-lg font-bold">{family.name}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{family.description}</p></div><div className="grid gap-4 lg:grid-cols-2">{family.types.map((type) => <CardTypeArticle key={`${family.category}-${type}`} type={type} category={family.category} />)}</div></div>)}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Part 6: Complete sample course JSON</h2>
          <p className="text-sm leading-6 text-muted-foreground">Use this as the master pattern when asking AI to generate a full course. Replace the titles, modules, cards, visuals, and questions with the target course content.</p>
          <CodePanel title="Complete UnivAI course JSON" value={fullCourseExample} open />
        </section>
      </CardContent>
    </Card>
  );
}

function GuideArticle({ section }: { section: GuideSection }) {
  return <article className="rounded-2xl border bg-background/80 p-4 shadow-sm"><h3 className="font-semibold">{section.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{section.body}</p>{section.notes?.length ? <ul className="mt-3 space-y-1 text-sm text-muted-foreground">{section.notes.map((note) => <li key={note} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{note}</li>)}</ul> : null}{section.code ? <div className="mt-3"><CodePanel title="JSON pattern" value={section.code} open /></div> : null}</article>;
}

function SpecialCardArticle({ card }: { card: ManualSpecialCard }) {
  return <article className="rounded-2xl border bg-background/80 p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{card.category}</p><h3 className="mt-1 text-lg font-semibold">{card.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{card.purpose}</p><div className="mt-3 rounded-xl border bg-muted/40 p-3 text-sm"><b>Fields:</b> {card.fields.join(', ')}</div><div className="mt-3 grid gap-3"><CodePanel title="Minimum JSON" value={card.minimum} /><CodePanel title="Recommended JSON" value={card.recommended} /></div><div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><b>Avoid:</b><ul className="mt-1 list-disc space-y-1 pl-5">{card.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></div></article>;
}

function CardTypeArticle({ type, category }: { type: string; category: string }) {
  return <article className="rounded-2xl border bg-background/80 p-4 shadow-sm"><p className="font-mono text-xs text-primary">{type}</p><h4 className="mt-1 text-base font-semibold">{titleCase(type)}</h4><p className="mt-2 text-sm leading-6 text-muted-foreground">{useWhen(type, category)}</p><div className="mt-3 rounded-xl border bg-muted/40 p-3 text-sm"><b>Teacher AI prompt:</b> {aiPrompt(type, category)}</div><div className="mt-3 rounded-xl border bg-muted/40 p-3 text-sm"><b>Useful fields:</b> {usefulFields(type, category).join(', ')}</div><div className="mt-3 grid gap-3"><CodePanel title="Minimum JSON" value={minimumExample(type)} /><CodePanel title="Recommended JSON" value={recommendedExample(type, category)} /></div></article>;
}

function CodePanel({ title, value, open = false }: { title: string; value: unknown; open?: boolean }) {
  return <details className="rounded-xl border bg-muted/40 p-3" open={open}><summary className="cursor-pointer text-sm font-medium"><Code2 className="mr-2 inline h-4 w-4" />{title}</summary><pre className="mt-3 max-h-[520px] overflow-auto rounded-xl bg-background p-3 text-xs leading-5"><code>{pretty(value)}</code></pre></details>;
}

'use client';

import { BookOpen, Code2, Download, FileJson, Layers3, Sparkles } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ManualFamily = { name: string; category: string; description: string; types: string[] };
type ManualSpecialCard = { title: string; type: string; category: string; purpose: string; fields: string[]; example: unknown };

const fullCourseExample = {
  course: {
    title: 'MA110: Set Theory and Real Numbers',
    description: 'A structured short course built from JSON.',
    schoolId: 'school-id-here',
    level: 'first_year_university',
    durationHours: 24,
    entryFee: 20,
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
      outcomes: ['Represent sets correctly'],
      lessons: [
        {
          id: 'lesson-set-basics',
          title: 'Set basics',
          summary: 'Learn notation, elements, subsets, and membership.',
          outcomes: ['Define a set', 'Use membership symbols'],
          cards: [
            { type: 'lesson_intro', title: 'Why sets matter', body: 'Sets help us group objects clearly before solving problems.' },
            { type: 'venn_diagram', title: 'Union and intersection', body: 'Use overlapping circles to show shared and separate regions.', visual: { sets: ['A', 'B'], highlight: 'intersection' } },
            { type: 'lesson_checkpoint', question: 'Which symbol means belongs to?', options: ['∈', '⊂', '∪', '∩'], correctAnswer: '∈', explanation: 'The symbol ∈ means an element belongs to a set.' },
          ],
          subLessons: [
            {
              id: 'sub-venn',
              title: 'Reading Venn regions',
              summary: 'Practise region identification.',
              outcomes: ['Identify intersection and complement'],
              cards: [{ type: 'graph_labeling_activity', title: 'Label the regions', body: 'Ask learners to label each Venn region before solving.' }],
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

const specialCards: ManualSpecialCard[] = [
  {
    title: 'Chemistry Visual Engine',
    type: 'chemistry_visual',
    category: 'science',
    purpose: 'Build chemistry activities that render as structured equations, particles, tables, steps, observations, and interactions instead of static images.',
    fields: ['type', 'title', 'body', 'chemistryTemplate', 'chemistryCardType', 'visual', 'required'],
    example: { type: 'chemistry_visual', title: 'Balancing sodium and chlorine', body: 'Learners balance the equation, count atoms, and answer a checkpoint.', chemistryTemplate: 'equation_balancer', chemistryCardType: 'equation_balancer_card', required: true, visual: { id: 'chem-eq-1', subject: 'chemistry', visualType: 'equation', template: 'equation_balancer', equation: { reactants: ['Na', 'Cl2'], products: ['NaCl'], balanced: '2Na + Cl2 -> 2NaCl' }, steps: [{ id: 's1', title: 'Count atoms', explanation: 'Count each atom on both sides before changing coefficients.' }], interactions: [{ id: 'q1', type: 'enter_coefficients', prompt: 'Enter the missing coefficients.', correctAnswer: '2,1,2' }] } },
  },
  {
    title: 'Physics Visual Engine',
    type: 'physics_visual',
    category: 'physics',
    purpose: 'Build interactive physics diagrams, simulations, forces, pulleys, collisions, waves, graphs, circuits, optics, and lab visuals using canvas, objects, arrows, labels, steps, and interactions.',
    fields: ['type', 'title', 'body', 'physicsTemplate', 'physicsCardType', 'visual', 'required'],
    example: { type: 'physics_visual', title: 'Free-body diagram', body: 'Learners identify the forces acting on a block.', physicsTemplate: 'free_body', physicsCardType: 'free_body_diagram_card', required: true, visual: { id: 'physics-free-body-1', subject: 'physics', visualType: 'diagram', template: 'free_body', renderMode: 'svg', canvas: { width: 800, height: 500, background: 'plain' }, objects: [{ id: 'block', type: 'rectangle', x: 340, y: 230, width: 120, height: 90, label: 'Block' }], arrows: [{ id: 'weight', type: 'force', from: { x: 400, y: 320 }, to: { x: 400, y: 430 }, label: 'W = mg', isInteractive: true }], labels: [{ id: 'title', text: 'Forces acting on the block', x: 260, y: 70 }], steps: [{ id: 's1', title: 'Find weight', explanation: 'Weight acts vertically downward.', highlightObjectIds: ['weight'], equation: 'W = mg' }], interactions: [{ id: 'select-weight', type: 'select_arrow', prompt: 'Which arrow shows weight?', correctTargetId: 'weight' }] } },
  },
  {
    title: 'First-class Coding Card',
    type: 'code_playground / debug_code / complete_code / predict_output / code_explanation / code_mini_project',
    category: 'coding',
    purpose: 'Give learners a real code workspace with files, tests, hints, solution files, expected output, preview mode, and AI help.',
    fields: ['type', 'title', 'instructions', 'language', 'files', 'tests', 'hints', 'solutionFiles', 'expectedOutput', 'previewMode', 'aiHelpEnabled'],
    example: { type: 'debug_code', title: 'Fix the broken HTML form', instructions: 'Find and fix the missing closing label and invalid input type.', language: 'html', files: [{ name: 'index.html', content: '<form><label>Name<input typ="text"></form>' }], tests: [{ type: 'contains', file: 'index.html', value: 'type="text"', description: 'Input type fixed' }], hints: ['Check attributes carefully.'], solutionFiles: [{ name: 'index.html', content: '<form><label>Name</label><input type="text"></form>' }], expectedOutput: 'A valid form with one text input.', previewMode: 'html', aiHelpEnabled: true },
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
  { name: 'Media Cards', category: 'media', description: 'Images, labels, hotspots, diagrams, infographics, audio, video, slides, PDFs, documents, downloads, maps, and galleries.', types: ['image_card','image_labeling','hotspot_image','before_after_image','diagram','infographic','audio_card','audio_question','video_embed','video_checkpoint','slideshow','pdf_snippet','document_viewer','file_download','resource_link','gallery','interactive_image','annotated_image','map_activity','timeline_media'] },
  { name: 'Drag-and-Drop Cards', category: 'drag-drop', description: 'Matching, sorting, sequencing, diagram labeling, flowcharts, mind maps, timelines, categories, and process ordering.', types: ['drag_drop_match','drag_drop_sort','drag_drop_sequence','drag_drop_label','drag_drop_grouping','reorder_steps','build_flowchart','mind_map_activity','card_sort','timeline_ordering','category_drop','sentence_ordering','process_ordering','diagram_label_drop','code_ordering','account_sorting'] },
  { name: 'Project Cards', category: 'projects', description: 'Project intros, stages, tasks, milestones, portfolios, rubrics, validation, gates, final projects, showcase, and export.', types: ['project_intro','project_step','project_stage','project_checklist','milestone','build_task','mini_project','portfolio_item','project_reflection','rubric_check','stage_complete','project_preview','project_validation','project_score','project_hint','project_unlock','project_required_gate','final_project_stage','project_showcase','project_export'] },
];

const introPages = [
  { title: 'Manual purpose', body: 'This manual is written for teachers, course creators, and non-technical users who may ask AI to generate course JSON. It avoids developer assumptions and explains how to design, edit, import, validate, save, and publish courses using the JSON Builder.', code: fullCourseExample },
  { title: 'The complete course JSON shape', body: 'A full JSON course must have course, modules, and questions. Modules contain lessons. Lessons contain cards and subLessons. Sub-lessons also contain cards. Cards are the teaching engine.', code: { course: 'object', modules: ['module objects'], questions: ['question objects'] } },
  { title: 'Generic block schema', body: 'Most block families are generated by the shared block factory. They accept type, title, body, prompt, question, options, correctAnswer, answer, explanation, visual, required, and certificateRequired. Extra fields are allowed, so creative teachers can add structured data for richer renderers.', code: { type: 'explanation', title: 'Clear title', body: 'Explanation or content', prompt: 'Optional learner prompt', question: 'Optional question text', options: ['A', 'B'], correctAnswer: 'A', explanation: 'Feedback for the learner', visual: {}, required: false, certificateRequired: false } },
  { title: 'How teachers should use AI with this manual', body: 'Give the AI the exact card type and JSON format. Ask it to generate one module or one lesson at a time. Then paste the JSON into the builder, click Format, click Apply JSON, review validation, and save draft before publishing.', code: 'Prompt pattern: Generate a UnivAI JSON lesson using these card types: lesson_intro, explanation, worked_example, lesson_checkpoint. Return valid JSON only.' },
];

const questionSignals = ['question', 'quiz', 'test', 'exam', 'assessment', 'prediction', 'debug', 'fix', 'fill', 'match', 'sort', 'label', 'review', 'checker'];
const visualCategories = ['math', 'graphing', 'science', 'media', 'drag-drop'];

function titleCase(value: string) { return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function pretty(value: unknown) { return typeof value === 'string' ? value : JSON.stringify(value, null, 2); }
function isQuestionLike(type: string) { return questionSignals.some((signal) => type.includes(signal)); }
function useWhen(type: string, category: string) {
  const name = titleCase(type);
  if (type.includes('intro')) return `Use ${name} to open a lesson, frame the purpose, and tell learners what they are about to master.`;
  if (type.includes('summary') || type.includes('recap')) return `Use ${name} after a concept to compress the key ideas without losing the lesson logic.`;
  if (type.includes('mistake') || type.includes('error') || type.includes('bug')) return `Use ${name} to show a wrong attempt, explain why it fails, and train learners to diagnose errors.`;
  if (isQuestionLike(type)) return `Use ${name} when the learner must answer, prove understanding, or unlock progress.`;
  if (type.includes('builder')) return `Use ${name} when the learner must construct something, not just read about it.`;
  if (type.includes('activity')) return `Use ${name} when learners need hands-on practice inside the lesson.`;
  if (type.includes('step')) return `Use ${name} for one step in a larger worked process. Keep one step per card.`;
  if (type.includes('table')) return `Use ${name} when information must be organized in rows, columns, values, observations, or calculations.`;
  if (category === 'media') return `Use ${name} when the lesson depends on a picture, audio, video, document, map, or visual resource.`;
  return `Use ${name} when this exact teaching move improves the lesson flow and helps the learner do something specific.`;
}
function aiPrompt(type: string, category: string) { return `Create a UnivAI JSON card of type "${type}" for a ${category} lesson. Include title, body, any learner prompt/question, options where needed, correctAnswer/answer where needed, explanation, and any visual data needed by the card.`; }
function genericExample(type: string, category: string) {
  const example: Record<string, unknown> = { type, title: titleCase(type), body: `Learner-facing content for ${titleCase(type)}.`, required: false };
  if (isQuestionLike(type)) Object.assign(example, { prompt: `Respond to this ${titleCase(type)} prompt.`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A', explanation: 'Explain the reasoning so the learner learns from the answer.' });
  if (visualCategories.includes(category)) example.visual = { instruction: 'Add structured visual data here when the renderer supports it.' };
  if (['certificate', 'exam', 'project', 'required', 'checkpoint', 'gate', 'completion'].some((signal) => type.includes(signal))) example.certificateRequired = true;
  return example;
}
function usefulFields(type: string, category: string) {
  const fields = ['type', 'title', 'body', 'prompt', 'question', 'options', 'correctAnswer', 'answer', 'explanation'];
  if (visualCategories.includes(category)) fields.push('visual');
  fields.push('required', 'certificateRequired');
  if (type.includes('rubric') || type.includes('project') || type.includes('portfolio')) fields.push('rubric', 'submissionInstructions', 'manualReview');
  return fields;
}

export function JsonBuilderFullManual() {
  const totalCards = specialCards.length + families.reduce((sum, family) => sum + family.types.length, 0);
  return (
    <Card className="rounded-3xl border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl"><BookOpen className="h-6 w-6 text-primary" /> JSON Builder Complete Teacher Manual</CardTitle>
            <CardDescription className="mt-2 max-w-5xl text-sm leading-6">This is not a developer note. It is a teacher-facing manual for creating full UnivAI course JSON, including full course structure, special card formats, generic card formats, AI prompt patterns, and per-card examples.</CardDescription>
          </div>
          <a href="/docs/univai-json-builder-complete-manual.pdf" download className="inline-flex items-center justify-center rounded-2xl border bg-background px-4 py-3 text-sm font-semibold shadow-sm transition hover:border-primary hover:bg-primary/5"><Download className="mr-2 h-4 w-4" /> Download PDF manual</a>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border bg-background/80 p-4"><Layers3 className="mb-2 h-5 w-5 text-primary" /><h3 className="font-semibold">{totalCards} card formats</h3><p className="mt-1 text-sm text-muted-foreground">Every registered family is explained with JSON examples.</p></div>
          <div className="rounded-2xl border bg-background/80 p-4"><FileJson className="mb-2 h-5 w-5 text-primary" /><h3 className="font-semibold">Full JSON structure</h3><p className="mt-1 text-sm text-muted-foreground">Course, modules, lessons, sub-lessons, cards, and questions.</p></div>
          <div className="rounded-2xl border bg-background/80 p-4"><Sparkles className="mb-2 h-5 w-5 text-primary" /><h3 className="font-semibold">AI-ready prompts</h3><p className="mt-1 text-sm text-muted-foreground">Non-technical teachers can copy the patterns and ask AI to generate JSON.</p></div>
        </div>
        <section className="space-y-4"><h2 className="text-xl font-bold">Part 1: How the JSON Builder works</h2>{introPages.map((page) => <article key={page.title} className="rounded-2xl border bg-background/80 p-4 shadow-sm"><h3 className="font-semibold">{page.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{page.body}</p><details className="mt-3 rounded-xl border bg-muted/40 p-3" open><summary className="cursor-pointer text-sm font-medium"><Code2 className="mr-2 inline h-4 w-4" />View code</summary><pre className="mt-3 max-h-[520px] overflow-auto rounded-xl bg-background p-3 text-xs leading-5"><code>{pretty(page.code)}</code></pre></details></article>)}</section>
        <section className="space-y-4"><h2 className="text-xl font-bold">Part 2: Special cards with their own formats</h2><p className="text-sm leading-6 text-muted-foreground">These cards are not ordinary note cards. They have special payloads and renderers. Teachers should follow the exact structures below when asking AI to generate them.</p><div className="grid gap-4 lg:grid-cols-2">{specialCards.map((card) => <article key={card.title} className="rounded-2xl border bg-background/80 p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{card.category}</p><h3 className="mt-1 text-lg font-semibold">{card.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{card.purpose}</p><div className="mt-3 rounded-xl border bg-muted/40 p-3 text-sm"><b>Fields:</b> {card.fields.join(', ')}</div><details className="mt-3 rounded-xl border bg-muted/40 p-3" open><summary className="cursor-pointer text-sm font-medium">View full JSON format</summary><pre className="mt-3 max-h-[520px] overflow-auto rounded-xl bg-background p-3 text-xs leading-5"><code>{pretty(card.example)}</code></pre></details></article>)}</div></section>
        <section className="space-y-8"><h2 className="text-xl font-bold">Part 3: Every registered card family</h2>{families.map((family) => <div key={family.name} className="space-y-4"><div className="rounded-2xl border bg-primary/5 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{family.category}</p><h3 className="text-lg font-bold">{family.name}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{family.description}</p></div><div className="grid gap-4 lg:grid-cols-2">{family.types.map((type) => <article key={type} className="rounded-2xl border bg-background/80 p-4 shadow-sm"><p className="font-mono text-xs text-primary">{type}</p><h4 className="mt-1 text-base font-semibold">{titleCase(type)}</h4><p className="mt-2 text-sm leading-6 text-muted-foreground">{useWhen(type, family.category)}</p><div className="mt-3 rounded-xl border bg-muted/40 p-3 text-sm"><b>Teacher AI prompt:</b> {aiPrompt(type, family.category)}</div><div className="mt-3 rounded-xl border bg-muted/40 p-3 text-sm"><b>Useful fields:</b> {usefulFields(type, family.category).join(', ')}</div><details className="mt-3 rounded-xl border bg-muted/40 p-3"><summary className="cursor-pointer text-sm font-medium">View JSON format for {type}</summary><pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-background p-3 text-xs leading-5"><code>{pretty(genericExample(type, family.category))}</code></pre></details></article>)}</div></div>)}</section>
      </CardContent>
    </Card>
  );
}

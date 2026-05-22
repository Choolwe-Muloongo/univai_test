'use client';

import { BookOpen, CheckCircle2, Code2, FileJson, Layers3 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const fullCourseExample = `{
  "course": {
    "title": "Interactive Chemistry Course",
    "description": "A complete course built with structured JSON.",
    "schoolId": "school-id-here",
    "level": "beginner",
    "durationHours": 12,
    "entryFee": 0,
    "currency": "ZMW",
    "certificateFee": 0,
    "audience": "Learners who need clear explanations and practice.",
    "prerequisites": ["Basic science vocabulary"],
    "outcomes": ["Explain key ideas", "Practise with visual cards"]
  },
  "modules": [
    {
      "id": "module-1",
      "title": "Foundations",
      "description": "The first stage of the course.",
      "outcomes": ["Build the foundation"],
      "lessons": [
        {
          "id": "lesson-1",
          "title": "Lesson title",
          "summary": "What the lesson teaches.",
          "outcomes": ["Understand the lesson"],
          "cards": [],
          "subLessons": []
        }
      ]
    }
  ],
  "questions": []
}`;

const cardExample = `[
  {
    "type": "callout",
    "tone": "info",
    "title": "Remember",
    "body": "Use this card to highlight the main idea."
  },
  {
    "type": "quiz",
    "question": "What is the answer?",
    "options": ["A", "B", "C", "D"],
    "answer": "A",
    "explanation": "Explain why A is correct."
  }
]`;

const chemistryVisualExample = `{
  "type": "chemistry_visual",
  "title": "Balancing chemical equations",
  "body": "Students balance the equation step by step.",
  "chemistryTemplate": "equation_balancer",
  "chemistryCardType": "equation_balancer_card",
  "required": true,
  "visual": {
    "title": "Equation balancer",
    "body": "Balance atoms on both sides.",
    "interactions": []
  }
}`;

const questionExample = `[
  {
    "id": "question-1",
    "type": "mcq",
    "difficulty": "medium",
    "question": "Which coefficient balances oxygen?",
    "options": ["1", "2", "3", "4"],
    "answer": "2",
    "explanation": "Count atoms on both sides before choosing."
  }
]`;

const manualPages = [
  { title: '1. What the JSON Builder is', body: 'The JSON Builder is the power-user course studio. It lets a creator build a full short course as one structured object instead of clicking through every small field.', code: fullCourseExample },
  { title: '2. The three main roots', body: 'Every valid course JSON should have course, modules, and questions. Course stores identity and pricing. Modules store the learning path. Questions store the assessment bank.', code: '{ "course": {}, "modules": [], "questions": [] }' },
  { title: '3. Course object purpose', body: 'The course object controls what the learner sees before entering the course: title, description, fees, certificate fee, level, audience, prerequisites, and outcomes.', code: '{ "title": "Course name", "description": "Course promise", "level": "beginner" }' },
  { title: '4. School selection', body: 'schoolId connects the course to a school or institute record. If schoolId is empty, the page warns you because the backend may reject the save.', code: '{ "schoolId": "replace-with-real-school-id" }' },
  { title: '5. Pricing fields', body: 'entryFee controls the course price. certificateFee controls certificate payment. currency should normally be ZMW for Zambia.', code: '{ "entryFee": 20, "currency": "ZMW", "certificateFee": 50 }' },
  { title: '6. Level field', body: 'Use level to guide filtering and learner expectations. Keep values simple: beginner, intermediate, advanced, a_level, first_year_university.', code: '{ "level": "first_year_university" }' },
  { title: '7. Duration hours', body: 'durationHours is the estimated total course time. It also helps the save payload generate reasonable module durations.', code: '{ "durationHours": 12 }' },
  { title: '8. Audience', body: 'Audience explains who the course is for. Write it like a promise: the exact learner, their level, and their need.', code: '{ "audience": "Grade 12 learners preparing for Chemistry exams." }' },
  { title: '9. Prerequisites', body: 'Prerequisites should be an array. Do not write one long paragraph. Each item should be a clear requirement.', code: '{ "prerequisites": ["Basic algebra", "Atomic structure basics"] }' },
  { title: '10. Outcomes', body: 'Outcomes are the course contract. Each one should start with a learning action such as explain, calculate, identify, design, compare, or solve.', code: '{ "outcomes": ["Balance chemical equations", "Calculate mole ratios"] }' },
  { title: '11. Modules are stages', body: 'Modules are big course stages. A good module groups lessons that belong together. Do not make one giant module for the whole course.', code: '{ "id": "module-1", "title": "Stoichiometry", "description": "Moles and reacting masses", "outcomes": [], "lessons": [] }' },
  { title: '12. Module IDs', body: 'IDs help React render stable lists and help creators reason about structure. They do not need to be beautiful, but they must be unique.', code: '{ "id": "module-stoichiometry" }' },
  { title: '13. Module titles', body: 'Use human titles, not database names. Learners should understand the stage before opening it.', code: '{ "title": "Stage 1: Chemical Equations" }' },
  { title: '14. Module descriptions', body: 'A module description should tell learners what they will master in that stage. Keep it clear, not decorative.', code: '{ "description": "Learn how equations represent real chemical reactions." }' },
  { title: '15. Lessons are missions', body: 'Lessons are the main units learners complete. Each lesson needs a title, summary, outcomes, cards, and subLessons.', code: '{ "id": "lesson-1", "title": "Balancing equations", "summary": "Learn atom conservation.", "outcomes": [], "cards": [], "subLessons": [] }' },
  { title: '16. Lesson summaries', body: 'The summary becomes the learner-facing explanation in previews and payloads. Make it specific enough that a student knows what they are about to learn.', code: '{ "summary": "Balance equations by counting atoms on each side." }' },
  { title: '17. Lesson outcomes', body: 'Lesson outcomes should be smaller than course outcomes. Each lesson should contribute to the bigger module promise.', code: '{ "outcomes": ["Count atoms in formulas", "Choose correct coefficients"] }' },
  { title: '18. Lesson cards', body: 'cards is an array of teaching blocks. This is where explanations, visuals, quizzes, code examples, images, chemistry visuals, and interactive activities live.', code: cardExample },
  { title: '19. Sub-lessons', body: 'subLessons split a lesson into smaller side missions. Use them when one lesson has several teachable parts.', code: '{ "subLessons": [{ "id": "sub-1", "title": "Counting atoms", "summary": "Practise formula reading.", "outcomes": [], "cards": [], "subLessons": [] }] }' },
  { title: '20. Main lesson vs sub-lesson target', body: 'When adding a template, choose Main lesson if the card belongs directly under the lesson. Choose Active sub-lesson if it belongs inside the selected sub-lesson.', code: '{ "cards": [/* main cards */], "subLessons": [/* nested cards */] }' },
  { title: '21. Practice Arena target', body: 'Choose Practice Arena question when the template should become an assessment question instead of a lesson card.', code: questionExample },
  { title: '22. Chemistry template buttons', body: 'Each template button inserts a complete structured chemistry visual. That is safer than manually writing every visual object from scratch.', code: chemistryVisualExample },
  { title: '23. Chemistry visual cards', body: 'A chemistry visual card uses type chemistry_visual, a chemistryTemplate name, and a visual payload. The renderer reads this structure to show the correct learning activity.', code: chemistryVisualExample },
  { title: '24. Card type basics', body: 'Every card should have a type. The renderer uses type to decide how to display the card.', code: '{ "type": "callout", "title": "Key idea", "body": "Main explanation" }' },
  { title: '25. Hero cards', body: 'Use hero cards at the start of a lesson to create a strong opening. They are not for every small note.', code: '{ "type": "hero", "title": "The big idea", "body": "Why this topic matters." }' },
  { title: '26. Callout cards', body: 'Use callout cards for warnings, important reminders, exam tips, or teacher notes.', code: '{ "type": "callout", "tone": "warning", "title": "Common mistake", "body": "Do not change subscripts when balancing." }' },
  { title: '27. Checklist cards', body: 'Use checklists for procedures, revision steps, experiment preparation, or formula-solving routines.', code: '{ "type": "checklist", "title": "Before answering", "items": ["Read the question", "List given values", "Check units"] }' },
  { title: '28. Quiz cards', body: 'Quiz cards teach inside a lesson. Question bank items assess the course. Use both, but do not confuse them.', code: '{ "type": "quiz", "question": "What is conserved?", "options": ["Atoms", "Colour"], "answer": "Atoms", "explanation": "Atoms are rearranged, not created." }' },
  { title: '29. Code cards', body: 'Use code cards for programming courses. They still work inside the same JSON structure.', code: '{ "type": "code", "language": "javascript", "title": "Example", "code": "console.log(\"Hello\");" }' },
  { title: '30. Image cards', body: 'Use image cards when a visual explanation is needed. Always add a caption so the image teaches, not just decorates.', code: '{ "type": "image", "title": "Diagram", "imageUrl": "https://example.com/image.png", "caption": "Explain what the learner should notice." }' },
  { title: '31. Venn cards', body: 'Use Venn cards for sets, logic, classification, overlap, union, intersection, complement, and comparison topics.', code: '{ "type": "venn", "title": "A ∩ B", "setCount": 2, "labels": ["A", "B"], "highlight": "intersection" }' },
  { title: '32. Full JSON editor', body: 'The large editor edits the entire blueprint. Use it when pasting a full course or fixing many parts at once.', code: fullCourseExample },
  { title: '33. Apply JSON', body: 'Apply JSON parses the editor and replaces the builder state. If the JSON is broken, the builder keeps the old working state.', code: 'Click Apply JSON after editing the full JSON object.' },
  { title: '34. Format', body: 'Format prettifies valid JSON. If formatting fails, the JSON has a syntax error such as a missing comma, quote, bracket, or brace.', code: '{ "valid": true }' },
  { title: '35. Copy', body: 'Copy exports the current course blueprint. Use it before risky changes, after generation, or when moving a course between environments.', code: 'Click Copy, then paste into a safe backup note or file.' },
  { title: '36. Import JSON file', body: 'Import accepts .json files. The file must contain course and modules. questions may be empty or missing, but the builder will normalize it to an array.', code: fullCourseExample },
  { title: '37. Save draft', body: 'Save draft sends the course to the backend as unpublished content. Use it while building and reviewing.', code: '{ "status": "draft" }' },
  { title: '38. Publish now', body: 'Publish now saves the course with published status. Only publish after previewing structure, pricing, lessons, cards, and assessment.', code: '{ "status": "published" }' },
  { title: '39. Validation errors', body: 'Errors block saving. Missing title, missing modules, missing lessons, and empty required structures must be fixed first.', code: 'Fix red validation messages before saving.' },
  { title: '40. Validation warnings', body: 'Warnings do not always block saving, but they indicate danger. Empty schoolId or lessons without cards should be reviewed.', code: 'Yellow/neutral warnings mean inspect before publishing.' },
  { title: '41. Common JSON mistake: commas', body: 'Every property except the last one in an object needs a comma. Every item except the last one in an array needs a comma.', code: '{ "title": "One", "level": "beginner" }' },
  { title: '42. Common JSON mistake: quotes', body: 'JSON requires double quotes around property names and strings. Single quotes are invalid JSON.', code: '{ "correct": "double quotes" }' },
  { title: '43. Common JSON mistake: arrays', body: 'outcomes, prerequisites, modules, lessons, cards, subLessons, questions, and options should be arrays.', code: '{ "outcomes": ["One", "Two"] }' },
  { title: '44. Common JSON mistake: numbers', body: 'Fees and duration should be numbers in the builder JSON. Do not write K20 or twelve.', code: '{ "entryFee": 20, "durationHours": 12 }' },
  { title: '45. Professional course structure', body: 'A strong course usually has 3 to 8 modules, each module has 2 to 6 lessons, and each lesson has focused cards or sub-lessons.', code: '{ "modules": [{ "lessons": [{ "cards": [] }] }] }' },
  { title: '46. Avoid giant lessons', body: 'Do not put an entire textbook into one lesson card. Split into sub-lessons and cards so the learner can breathe.', code: '{ "subLessons": [{ "title": "Part 1" }, { "title": "Part 2" }] }' },
  { title: '47. Use cards as teaching moments', body: 'Each card should teach one thing: introduce, explain, demonstrate, test, correct, or summarize.', code: '{ "type": "callout", "title": "Exam tip", "body": "One precise idea." }' },
  { title: '48. Use questions as assessment', body: 'Questions should test whether the learner can apply the lesson, not merely remember a phrase.', code: questionExample },
  { title: '49. Explanations matter', body: 'Every MCQ should include an explanation. The explanation is where UnivAI becomes a teacher, not a marking machine.', code: '{ "explanation": "The answer is correct because..." }' },
  { title: '50. Difficulty levels', body: 'Use easy for recall, medium for application, hard for multi-step reasoning, and challenge for advanced exam practice.', code: '{ "difficulty": "medium" }' },
  { title: '51. Chemistry equation lessons', body: 'For balancing equations, use a chemistry visual card first, then a quiz, then a question-bank item for assessment.', code: chemistryVisualExample },
  { title: '52. Chemistry particle lessons', body: 'For particles, use visuals that show arrangement, movement, charge, bonding, or state changes. Add labels and prompts where possible.', code: '{ "chemistryTemplate": "particle_model", "type": "chemistry_visual" }' },
  { title: '53. Chemistry calculation lessons', body: 'For mole calculations, teach the formula, show units, give a worked example, then ask learners to solve a similar problem.', code: '{ "chemistryTemplate": "mole_calculation", "type": "chemistry_visual" }' },
  { title: '54. Lab and observation lessons', body: 'For experiments, structure the lesson as aim, apparatus, method, observation, conclusion, safety, and practice question.', code: '{ "chemistryTemplate": "lab_observation", "type": "chemistry_visual" }' },
  { title: '55. Preview mindset', body: 'Before saving, read the JSON like a learner: course promise, stages, missions, cards, questions, and final outcome.', code: 'Preview structure before publishing.' },
  { title: '56. Backup discipline', body: 'Before a big edit, copy the full JSON. Old school rule: never edit the only copy of your work.', code: 'Copy JSON before large changes.' },
  { title: '57. Reusing a course shell', body: 'To build faster, copy an existing course JSON, change the course identity, then replace modules and lessons one by one.', code: fullCourseExample },
  { title: '58. Debugging save issues', body: 'If save fails, check title, schoolId, status, price values, module arrays, lesson arrays, and whether the backend accepts the payload.', code: '{ "course": { "schoolId": "must-exist" }, "modules": [] }' },
  { title: '59. Designing better than videos', body: 'Use JSON to combine explanation, visual card, short practice, mistake feedback, and assessment. That is the advantage over passive video.', code: '{ "cards": ["explain", "show", "try", "feedback"] }' },
  { title: '60. Final publishing checklist', body: 'Check spelling, pricing, school, duration, every module, every lesson, every card, every question answer, and every explanation before publishing.', code: '{ "readyToPublish": true }' },
];

export function JsonBuilderFullManual() {
  return (
    <Card className="rounded-3xl border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <BookOpen className="h-6 w-6 text-primary" /> JSON Builder Full Manual
            </CardTitle>
            <CardDescription className="mt-2 max-w-4xl text-sm leading-6">
              A complete in-page guide for course creators using the UnivAI JSON Builder. It explains the full JSON shape, course fields, modules, lessons, sub-lessons, cards, chemistry visuals, questions, importing, formatting, validation, saving, publishing, and professional course-design habits.
            </CardDescription>
          </div>
          <div className="rounded-2xl border bg-background/80 p-3 text-sm">
            <div className="flex items-center gap-2 font-semibold"><Layers3 className="h-4 w-4 text-primary" /> {manualPages.length} manual pages</div>
            <p className="mt-1 text-xs text-muted-foreground">Each page includes explanation plus a View code section.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border bg-background/80 p-4">
            <FileJson className="mb-2 h-5 w-5 text-primary" />
            <h3 className="font-semibold">Use JSON safely</h3>
            <p className="mt-1 text-sm text-muted-foreground">Understand the course blueprint before importing, editing, saving, or publishing.</p>
          </div>
          <div className="rounded-2xl border bg-background/80 p-4">
            <Code2 className="mb-2 h-5 w-5 text-primary" />
            <h3 className="font-semibold">View code examples</h3>
            <p className="mt-1 text-sm text-muted-foreground">Every manual page includes a practical code shape or workflow note.</p>
          </div>
          <div className="rounded-2xl border bg-background/80 p-4">
            <CheckCircle2 className="mb-2 h-5 w-5 text-primary" />
            <h3 className="font-semibold">Publish with confidence</h3>
            <p className="mt-1 text-sm text-muted-foreground">Follow validation, backup, pricing, structure, and final review rules.</p>
          </div>
        </div>

        <details className="rounded-2xl border bg-background/80 p-4" open>
          <summary className="cursor-pointer text-base font-semibold">Start here: complete JSON blueprint example</summary>
          <pre className="mt-4 max-h-[520px] overflow-auto rounded-2xl bg-muted p-4 text-xs leading-5"><code>{fullCourseExample}</code></pre>
        </details>

        <div className="grid gap-4 lg:grid-cols-2">
          {manualPages.map((page) => (
            <article key={page.title} className="rounded-2xl border bg-background/80 p-4 shadow-sm">
              <h3 className="text-base font-semibold">{page.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{page.body}</p>
              <details className="mt-3 rounded-xl border bg-muted/40 p-3">
                <summary className="cursor-pointer text-sm font-medium">View code</summary>
                <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-background p-3 text-xs leading-5"><code>{page.code}</code></pre>
              </details>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

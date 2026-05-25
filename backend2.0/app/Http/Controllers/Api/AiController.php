<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\ExamQuestion;
use App\Models\Lesson;
use App\Models\ShortCourseEnrollment;
use App\Support\Ai\ShortCourseAiQuota;
use App\Support\Branding\UnivAiBranding;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AiController extends Controller
{
    public function generate(Request $request)
    {
        $data = $request->validate([
            'prompt' => 'required|string',
            'mode' => 'nullable|string',
            'model' => 'nullable|string',
            'context' => 'nullable|string',
            'approvedMaterials' => 'nullable|string',
            'accessTier' => 'nullable|string',
            'feature' => 'nullable|string',
            'audience' => 'nullable|string',
            'brandContext' => 'nullable|string',
            'courseId' => 'nullable|string',
            'shortCourseId' => 'nullable|string',
            'lessonId' => 'nullable|string',
            'cardId' => 'nullable|string',
            'questionId' => 'nullable|string',
            'attemptId' => 'nullable|string',
            'mistakeId' => 'nullable|string',
            'action' => 'nullable|string|in:document_map,course_plan,generate_modules,generate_lessons,generate_sub_lessons,generate_cards,generate_single_card,repair_card,generate_questions,generate_code_card,validate_course,suggest_improvements',
            'builderRequest' => 'nullable|array',
            'builderRequest.action' => 'nullable|string|in:document_map,course_plan,generate_modules,generate_lessons,generate_sub_lessons,generate_cards,generate_single_card,repair_card,generate_questions,generate_code_card,validate_course,suggest_improvements',
            'builderRequest.scope' => 'nullable|string|in:course,module,lesson,sub_lesson,card',
            'builderRequest.currentBlueprint' => 'nullable|array',
            'builderRequest.selectedScope' => 'nullable|array',
            'builderRequest.selectedDocumentChunks' => 'nullable|array',
            'builderRequest.count' => 'nullable|integer|min:1|max:20',
            'builderRequest.difficulty' => 'nullable|string|max:100',
            'builderRequest.instruction' => 'nullable|string|max:2000',
        ]);

        $requestedMode = $data['mode'] ?? 'general';
        $mode = $this->normalizeMode($requestedMode);
        $allowedModes = ['general', 'lesson', 'quiz', 'summary', 'tutor', 'document', 'video', 'email', 'public-notice', 'admissions-letter'];
        if (!in_array($mode, $allowedModes, true)) {
            return response()->json(['error' => 'Unsupported AI mode.'], 422);
        }

        $sessionUser = $request->session()->get('user');
        $role = is_array($sessionUser) ? ($sessionUser['role'] ?? null) : null;
        $tier = $this->resolveAccessTier($role, $data['accessTier'] ?? null);
        $policy = $this->accessPolicyFor($tier);
        $feature = $data['feature'] ?? null;
        $courseId = $data['courseId'] ?? $data['shortCourseId'] ?? null;
        $studentId = is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null;
        $isShortCourseAi = ($feature && str_contains($feature, 'short_course')) || ($data['accessTier'] ?? null) === 'short-course' || $courseId;

        if ($feature && !in_array($feature, $policy['features'], true)) {
            return response()->json(['error' => "The {$policy['label']} tier does not include {$feature} AI access.", 'tier' => $tier], 403);
        }

        if (!in_array($mode, $policy['modes'], true)) {
            return response()->json(['error' => "The {$policy['label']} tier does not include {$mode} AI access.", 'tier' => $tier], 403);
        }

        $quota = null;
        if ($isShortCourseAi && $studentId && is_numeric($studentId)) {
            $quota = ShortCourseAiQuota::check((int) $studentId, $courseId ? (string) $courseId : null);
            if (!$quota['allowed']) {
                $message = ($quota['cooldownMinutes'] ?? 0) > 0
                    ? 'You have reached your hourly AI study limit. Your AI tutor will be available again in 30 minutes. Use this time to review your notes or attempt the next quiz.'
                    : 'Your daily AI limit has been reached or AI tutor access is not included in this plan.';
                return response()->json(['error' => $message, 'quota' => $quota], 429);
            }
        }

        $prompt = trim($data['prompt']);
        $builderRequest = $data['builderRequest'] ?? null;
        if (is_array($builderRequest)) {
            $prompt .= "\n\nStructured AI builder request:\n" . json_encode($builderRequest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }
        $maxPrompt = min((int) env('AI_MAX_PROMPT', 4000), $policy['maxPrompt']);
        if (mb_strlen($prompt) > $maxPrompt) {
            return response()->json(['error' => "Prompt exceeds {$maxPrompt} characters."], 422);
        }

        $context = trim($data['context'] ?? '');
        $shortCourseContext = $isShortCourseAi ? $this->shortCourseContext($studentId ? (int) $studentId : null, $courseId, $data) : '';
        if ($shortCourseContext !== '') {
            $context = trim($context . "\n\n" . $shortCourseContext);
        }
        $approvedMaterials = trim($data['approvedMaterials'] ?? '');
        $brandContext = trim($data['brandContext'] ?? '');
        $maxContext = (int) env('AI_MAX_CONTEXT', 8000);
        if ($context !== '' && mb_strlen($context) > $maxContext) {
            $context = Str::limit($context, $maxContext, '\n[Context trimmed to fit AI limit.]');
        }
        if ($brandContext !== '' && mb_strlen($brandContext) > 3000) {
            return response()->json(['error' => 'Brand context exceeds 3000 characters.'], 422);
        }

        logger()->info('ai_request', [
            'mode' => $mode,
            'requested_mode' => $requestedMode,
            'tier' => $tier,
            'feature' => $feature,
            'action' => $data['action'] ?? ($builderRequest['action'] ?? null),
            'builder_scope' => is_array($builderRequest) ? ($builderRequest['scope'] ?? null) : null,
            'model' => $data['model'] ?? null,
            'prompt_length' => mb_strlen($prompt),
            'context_length' => mb_strlen($context),
            'approved_materials_length' => mb_strlen($approvedMaterials),
            'brand_context_length' => mb_strlen($brandContext),
            'audience' => $data['audience'] ?? null,
            'user_id' => $studentId,
            'course_id' => $courseId,
        ]);

        $systemInstruction = $this->systemInstructionFor($mode, $tier, $policy, $feature, $data['action'] ?? ($builderRequest['action'] ?? null), $requestedMode);
        if ($approvedMaterials !== '') {
            $systemInstruction .= "\n\nApproved module materials:\n{$approvedMaterials}";
        }
        if ($context !== '') {
            $systemInstruction .= "\n\nStudent context:\n{$context}";
        }
        if ($brandContext !== '') {
            $systemInstruction .= "\n\nAdditional UnivAI brand/context requirements:\n{$brandContext}";
        }
        if (!empty($data['audience'])) {
            $systemInstruction .= "\n\nAudience: {$data['audience']}";
        }

        $provider = strtolower(trim((string) env('AI_PROVIDER', 'apifree')));
        if ($provider !== 'apifree') {
            return response()->json([
                'error' => 'AI provider is not configured correctly. Please contact support.',
                'provider' => $provider,
            ], 500);
        }

        $apiKey = env('AI_API_KEY');
        if (!$apiKey) {
            return response()->json(['error' => 'AI service is not configured yet. Please contact support.'], 500);
        }

        $model = $data['model'] ?? env('AI_MODEL', 'google/gemini-2.5-flash-lite');
        $baseUrl = rtrim(env('AI_BASE_URL', 'https://api.apifree.ai'), '/');
        $payload = [
            'max_tokens' => (int) env('AI_MAX_TOKENS', 1024),
            'messages' => [
                ['role' => 'system', 'content' => $systemInstruction],
                ['role' => 'user', 'content' => $prompt],
            ],
            'model' => $model,
            'stream' => false,
            'temperature' => (float) env('AI_TEMPERATURE', 0.5),
            'top_p' => 1,
        ];

        $response = Http::timeout(30)
            ->withHeaders(['Authorization' => "Bearer {$apiKey}"])
            ->post("{$baseUrl}/v1/chat/completions", $payload);

        $json = $response->json();
        if (!$response->successful() || isset($json['error'])) {
            return response()->json(['error' => 'Nova is temporarily unavailable. Please try again shortly.', 'details' => $json], 502);
        }

        $text = $json['choices'][0]['message']['content'] ?? '';
        if ($quota && $studentId && is_numeric($studentId)) {
            $quota = ShortCourseAiQuota::consume((int) $studentId, $courseId ? (string) $courseId : null);
        }
        return response()->json(['text' => $text, 'quota' => $quota]);
    }

    private function normalizeMode(?string $mode): string
    {
        return match ($mode) {
            'flashcards', 'mock-exam', 'mock_exam', 'exam_prep', 'quiz_current_card', 'weak-areas', 'weak_areas' => 'quiz',
            'summarize' => 'summary',
            'explain', 'code_help', 'study_plan' => 'tutor',
            default => $mode ?: 'general',
        };
    }

    private function shortCourseContext(?int $studentId, ?string $courseId, array $data): string
    {
        if (!$courseId) return '';

        $course = Course::with(['lessons.learningObjects'])->find($courseId);
        if (!$course) return "Short-course context: course {$courseId} was requested, but it could not be found.";

        $lines = [
            'Short-course AI grounding context:',
            "Course: {$course->title}",
            "Level: " . ($course->level ?? 'not set'),
            "Duration hours: " . ($course->duration_hours ?? 'not set'),
            "Description: " . $this->cleanText($course->description),
        ];

        if ($studentId) {
            $enrollment = ShortCourseEnrollment::where('student_id', $studentId)->where('short_course_id', $course->id)->first();
            if ($enrollment) {
                $lines[] = "Student progress: {$enrollment->progress}%";
                $lines[] = 'Access plan: ' . ($enrollment->access_plan ?? 'not active');
                $lines[] = 'AI plan: ' . ($enrollment->ai_plan ?? 'not active');
                $lines[] = 'AI quota: ' . ((int) $enrollment->hourly_ai_quota) . '/hour, ' . ((int) $enrollment->daily_ai_quota) . '/day';
                $lines[] = 'AI active: ' . ($enrollment->hasActiveAiAccess() ? 'yes' : 'no');
            }
        }

        $lessonId = $data['lessonId'] ?? null;
        $lesson = $lessonId ? $course->lessons->firstWhere('id', $lessonId) : $course->lessons->first();
        if ($lesson) {
            $lines[] = "Current lesson: {$lesson->title}";
            if (!empty($lesson->summary)) $lines[] = 'Lesson summary: ' . $this->cleanText($lesson->summary);
            if (!empty($lesson->content)) $lines[] = 'Lesson content excerpt: ' . Str::limit($this->cleanText($lesson->content), 1200);

            $objects = $lesson->learningObjects ?? collect();
            $cardId = $data['cardId'] ?? null;
            $targetObjects = $cardId ? $objects->filter(fn ($object) => (string) $object->id === (string) $cardId) : $objects->take(4);
            foreach ($targetObjects as $object) {
                $lines[] = 'Learning card: ' . ($object->title ?: $object->type ?: $object->id);
                if (!empty($object->description)) $lines[] = 'Card description: ' . $this->cleanText($object->description);
                if (!empty($object->body)) $lines[] = 'Card body: ' . Str::limit($this->cleanText($object->body), 1000);
                if (!empty($object->payload)) $lines[] = 'Card payload excerpt: ' . Str::limit($this->cleanText(json_encode($object->payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)), 1200);
            }
        }

        if (!empty($data['questionId'])) {
            $question = ExamQuestion::where('course_id', $course->id)->where('id', $data['questionId'])->first();
            if ($question) {
                $lines[] = 'Question context: ' . $this->cleanText($question->question);
                if (!empty($question->options)) $lines[] = 'Question options: ' . $this->cleanText(is_array($question->options) ? json_encode($question->options, JSON_UNESCAPED_UNICODE) : (string) $question->options);
            }
        }

        return Str::limit(implode("\n", array_filter($lines)), 6000, '\n[Short-course context trimmed.]');
    }

    private function cleanText(?string $value): string
    {
        if (!$value) return '';
        $decoded = json_decode($value, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $value = json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: $value;
        }
        return trim(preg_replace('/\s+/', ' ', strip_tags($value)) ?? '');
    }

    private function systemInstructionFor(string $mode, string $tier, array $policy, ?string $feature = null, ?string $action = null, ?string $requestedMode = null): string
    {
        $brand = UnivAiBranding::brand();
        $guardrails = implode(' ', config('univai.ai.brand_guardrails', []));
        $base = "You are " . UnivAiBranding::name() . "'s academic assistant for an online-first and hybrid university platform. Brand name: " . UnivAiBranding::name() . ". Legal name: " . ($brand['legal_name'] ?? UnivAiBranding::name()) . ". Tagline: " . ($brand['tagline'] ?? '') . ". Public URL: " . UnivAiBranding::publicUrl() . ". Support email: " . UnivAiBranding::supportEmail() . ". Use UnivAI branding on every public-facing output. Never invent accreditation, tuition, dates, policies, or guarantees not supplied in context. Formal programme content, admissions letters, certificates, policy documents, and public notices must be marked as human-review-required drafts. Use the provided student context to personalize responses and reference their program, progress, current course, current lesson, current card, and upcoming tasks. If context is missing, ask a clarifying question instead of guessing. Be concise, structured, accessible, and accurate. Apply this AI access tier: {$policy['label']}. {$policy['guidance']} Brand guardrails: {$guardrails}";
        $modeInstruction = match ($mode) {
            'lesson' => 'Produce a SoloLearn-style UnivAI lesson as strict JSON only. Do not return markdown, prose outside JSON, or code fences. No videos for launch. The lesson must be card-based and use block types such as explanation, example, question, fill_blank, true_false, summary, equation, graph, table and visual blocks where useful. Questions must appear between cards. Each card should teach one idea only.',
            'quiz' => 'Create clear UnivAI assessment questions with answer keys and rationale. When the learner asks for quiz mode, ask one question at a time unless they requested a full set.',
            'summary' => 'Summarize the provided material into a clear, student-friendly UnivAI explanation.',
            'tutor' => 'Act as a supportive UnivAI tutor. Explain step by step, use the supplied course/lesson/card context, and ask clarifying questions when needed.',
            'document' => 'Create a branded UnivAI document draft suitable for formal programmes and short courses: include context, title, purpose, audience, body, academic integrity checks, next steps, review status, and support contact.',
            'video' => 'Video generation is disabled for launch. Instead, create a no-video interactive lesson support package with learning objectives, card ideas, accessibility notes, and review-required production notes.',
            'email' => 'Create a branded UnivAI email with subject, preview text, greeting, concise body, call to action, support contact, and compliant footer.',
            'public-notice' => 'Create a branded UnivAI public notice with headline, summary, details, dates if provided, next steps, support contact, and review-required note.',
            'admissions-letter' => 'Create a formal UnivAI admissions letter draft with reference placeholders, programme details from context only, conditions, next steps, admissions contact, and review-required note.',
            default => 'Answer as a helpful UnivAI university assistant.',
        };

        $frontendInstruction = $requestedMode ? " Frontend Nova mode requested: {$requestedMode}. Respect that learning intent even if it was normalized to backend mode {$mode}." : '';
        $builderInstruction = $feature === 'admin_short_course_stepwise_builder'
            ? " Stepwise short-course builder rule: treat action {$action} as authoritative, use the supplied builderRequest/currentBlueprint/selectedScope/selectedDocumentChunks, generate only the requested section, avoid duplicate course parts, and return strict JSON for the requested patch only. Use coding cards with language, instructions, files, tests, hints, solutionFiles, expectedOutput, previewMode, and aiHelpEnabled when coding is involved."
            : '';

        $grounding = $tier === 'programme'
            ? ' Programme student rule: ground answers in approved module materials supplied in Approved module materials or Student context. If materials are insufficient, state that the approved module materials do not contain the answer. Formal programme delivery modes are online, hybrid, and physical only.'
            : '';

        return $base . ' ' . $modeInstruction . $frontendInstruction . $builderInstruction . $grounding;
    }

    private function resolveAccessTier(?string $role, ?string $requestedTier): string
    {
        if ($requestedTier === 'short-course') {
            return 'paid-certificate';
        }
        return match ($role) {
            'free-student', 'freemium-student' => 'free',
            'paid-certificate-student', 'paid-certificate', 'certificate-student' => 'paid-certificate',
            'programme-student', 'program-student', 'student', 'enrolled' => 'programme',
            'premium-student' => 'premium',
            default => in_array($requestedTier, ['free', 'paid-certificate', 'premium', 'programme'], true) ? $requestedTier : 'premium',
        };
    }

    private function accessPolicyFor(string $tier): array
    {
        return match ($tier) {
            'free' => [
                'label' => 'Free AI',
                'maxPrompt' => 700,
                'modes' => ['general', 'summary', 'tutor'],
                'features' => ['chat', 'tutor', 'notes'],
                'guidance' => 'Free students receive limited AI support only. Keep answers brief, introductory, and practical.',
            ],
            'paid-certificate' => [
                'label' => 'Paid Certificate AI',
                'maxPrompt' => 6000,
                'modes' => ['general', 'summary', 'tutor', 'lesson', 'document', 'email', 'quiz'],
                'features' => ['chat', 'tutor', 'lessonCompanion', 'notes', 'studyPlan', 'short_course_ai', 'admin_short_course_builder_multi_document', 'admin_short_course_stepwise_builder'],
                'guidance' => 'Support certificate and short-course completion with explanations, summaries, and focused revision.',
            ],
            'programme' => [
                'label' => 'Programme AI',
                'maxPrompt' => 6000,
                'modes' => ['general', 'summary', 'tutor', 'lesson', 'quiz', 'document', 'video', 'email', 'public-notice', 'admissions-letter'],
                'features' => ['chat', 'tutor', 'lessonCompanion', 'studyPlan', 'flashcards', 'mockExam', 'weakAreas', 'career', 'notes', 'groundedAnswers', 'docs', 'video', 'email', 'publicComms'],
                'guidance' => 'Programme students receive answers grounded in approved module materials.',
            ],
            default => [
                'label' => 'Premium AI',
                'maxPrompt' => 6000,
                'modes' => ['general', 'summary', 'tutor', 'lesson', 'quiz', 'document', 'video', 'email', 'public-notice', 'admissions-letter'],
                'features' => ['chat', 'tutor', 'lessonCompanion', 'studyPlan', 'flashcards', 'mockExam', 'weakAreas', 'career', 'notes', 'cashback', 'docs', 'video', 'email', 'publicComms', 'short_course_ai', 'admin_short_course_builder_multi_document', 'admin_short_course_stepwise_builder'],
                'guidance' => 'Premium students receive advanced tutor, adaptive study plan, flashcards, mock exam, and weak-area support.',
            ],
        };
    }
}

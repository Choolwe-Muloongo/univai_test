<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Support\Branding\UnivAiBranding;
use App\Support\Ai\ShortCourseAiQuota;
use Illuminate\Support\Facades\Http;

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

        $mode = $data['mode'] ?? 'general';
        $mode = match ($mode) {
            'flashcards' => 'quiz',
            'mock-exam' => 'quiz',
            'weak-areas' => 'tutor',
            default => $mode,
        };
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
        if ($isShortCourseAi && $studentId && is_numeric($studentId)) {
            $quota = ShortCourseAiQuota::checkAndIncrement((int) $studentId, $courseId ? (string) $courseId : null);
            if (!$quota['allowed']) {
                $message = ($quota['cooldownMinutes'] ?? 0) > 0
                    ? 'You have reached your hourly AI study limit. Your AI tutor will be available again in 30 minutes. Use this time to review your notes or attempt the next quiz.'
                    : 'Your daily AI limit has been reached or AI tutor access is not included in this plan.';
                return response()->json([
                    'error' => $message,
                    'quota' => $quota,
                ], 429);
            }
        }

        if ($feature && !in_array($feature, $policy['features'], true)) {
            return response()->json([
                'error' => "The {$policy['label']} tier does not include {$feature} AI access.",
                'tier' => $tier,
            ], 403);
        }

        if (!in_array($mode, $policy['modes'], true)) {
            return response()->json([
                'error' => "The {$policy['label']} tier does not include {$mode} AI access.",
                'tier' => $tier,
            ], 403);
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
        $approvedMaterials = trim($data['approvedMaterials'] ?? '');
        $brandContext = trim($data['brandContext'] ?? '');
        $maxContext = (int) env('AI_MAX_CONTEXT', 8000);
        if ($context !== '' && mb_strlen($context) > $maxContext) {
            return response()->json(['error' => "Context exceeds {$maxContext} characters."], 422);
        }
        if ($brandContext !== '' && mb_strlen($brandContext) > 3000) {
            return response()->json(['error' => 'Brand context exceeds 3000 characters.'], 422);
        }

        logger()->info('ai_request', [
            'mode' => $mode,
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
            'user_id' => is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null,
        ]);

        $systemInstruction = $this->systemInstructionFor($mode, $tier, $policy, $feature, $data['action'] ?? ($builderRequest['action'] ?? null));
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

        $provider = env('AI_PROVIDER', 'gemini');

        if ($provider === 'apifree') {
            $apiKey = env('AI_API_KEY');
            if (!$apiKey) {
                return response()->json(['error' => 'AI_API_KEY is not configured for apifree.'], 500);
            }

            $model = $data['model'] ?? env('AI_MODEL', 'google/gemini-2.5-pro');
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

            $response = Http::timeout(30)->withHeaders(['Authorization' => "Bearer {$apiKey}"])->post("{$baseUrl}/v1/chat/completions", $payload);
            $json = $response->json();
            if (!$response->successful() || isset($json['error'])) {
                return response()->json(['error' => 'Apifree request failed.', 'details' => $json], 502);
            }

            $text = $json['choices'][0]['message']['content'] ?? '';
            return response()->json(['text' => $text]);
        }

        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            return response()->json(['error' => 'GEMINI_API_KEY is not configured.'], 500);
        }

        $model = $data['model'] ?? env('AI_MODEL', 'gemini-1.5-flash');
        $payload = [
            'systemInstruction' => ['parts' => [['text' => $systemInstruction]]],
            'contents' => [['role' => 'user', 'parts' => [['text' => $prompt]]]],
            'generationConfig' => [
                'temperature' => (float) env('AI_TEMPERATURE', 0.5),
                'maxOutputTokens' => (int) env('AI_MAX_TOKENS', 1024),
            ],
        ];

        $response = Http::timeout(30)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", $payload);
        if (!$response->successful()) {
            return response()->json(['error' => 'Gemini request failed.', 'details' => $response->json()], 502);
        }

        $json = $response->json();
        $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
        return response()->json(['text' => $text]);
    }

    private function systemInstructionFor(string $mode, string $tier, array $policy, ?string $feature = null, ?string $action = null): string
    {
        $brand = UnivAiBranding::brand();
        $guardrails = implode(' ', config('univai.ai.brand_guardrails', []));
        $base = "You are " . UnivAiBranding::name() . "'s academic assistant for an online-first and hybrid university platform. Brand name: " . UnivAiBranding::name() . ". Legal name: " . ($brand['legal_name'] ?? UnivAiBranding::name()) . ". Tagline: " . ($brand['tagline'] ?? '') . ". Public URL: " . UnivAiBranding::publicUrl() . ". Support email: " . UnivAiBranding::supportEmail() . ". Use UnivAI branding on every public-facing output. Never invent accreditation, tuition, dates, policies, or guarantees not supplied in context. Formal programme content, admissions letters, certificates, policy documents, and public notices must be marked as human-review-required drafts. Use the provided student context to personalize responses and reference their program, progress, GPA, standing, and upcoming tasks. If context is missing, ask a clarifying question instead of guessing. Be concise, structured, accessible, and accurate. Apply this AI access tier: {$policy['label']}. {$policy['guidance']} Brand guardrails: {$guardrails}";
        $modeInstruction = match ($mode) {
            'lesson' => 'Produce a SoloLearn-style UnivAI lesson as strict JSON only. Do not return markdown, prose outside JSON, or code fences. No videos for launch. The lesson must be card-based and use block types such as explanation, example, question, fill_blank, true_false, summary, equation, graph, table and visual blocks where useful. Questions must appear between cards. Each card should teach one idea only.',
            'quiz' => 'Create clear UnivAI assessment questions with answer keys and rationale. Return 3-5 questions unless asked otherwise.',
            'summary' => 'Summarize the provided material into a clear, student-friendly UnivAI explanation.',
            'tutor' => 'Act as a supportive UnivAI tutor. Ask clarifying questions when needed and give step-by-step guidance.',
            'document' => 'Create a branded UnivAI document draft suitable for formal programmes and short courses: include context, title, purpose, audience, body, academic integrity checks, next steps, review status, and support contact.',
            'video' => 'Video generation is disabled for launch. Instead, create a no-video interactive lesson support package with learning objectives, card ideas, accessibility notes, and review-required production notes.',
            'email' => 'Create a branded UnivAI email with subject, preview text, greeting, concise body, call to action, support contact, and compliant footer.',
            'public-notice' => 'Create a branded UnivAI public notice with headline, summary, details, dates if provided, next steps, support contact, and review-required note.',
            'admissions-letter' => 'Create a formal UnivAI admissions letter draft with reference placeholders, programme details from context only, conditions, next steps, admissions contact, and review-required note.',
            default => 'Answer as a helpful UnivAI university assistant.',
        };

        $builderInstruction = $feature === 'admin_short_course_stepwise_builder'
            ? " Stepwise short-course builder rule: treat action {$action} as authoritative, use the supplied builderRequest/currentBlueprint/selectedScope/selectedDocumentChunks, generate only the requested section, avoid duplicate course parts, and return strict JSON for the requested patch only. Use coding cards with language, instructions, files, tests, hints, solutionFiles, expectedOutput, previewMode, and aiHelpEnabled when coding is involved."
            : '';

        $grounding = $tier === 'programme'
            ? ' Programme student rule: ground answers in approved module materials supplied in Approved module materials or Student context. If materials are insufficient, state that the approved module materials do not contain the answer. Formal programme delivery modes are online, hybrid, and physical only.'
            : '';

        return $base . ' ' . $modeInstruction . $builderInstruction . $grounding;
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
                'modes' => ['general', 'summary', 'tutor', 'lesson', 'document', 'email'],
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
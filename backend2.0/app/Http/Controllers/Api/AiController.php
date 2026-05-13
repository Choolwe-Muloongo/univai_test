<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Support\Branding\UnivAiBranding;
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
            'model' => $data['model'] ?? null,
            'prompt_length' => mb_strlen($prompt),
            'context_length' => mb_strlen($context),
            'approved_materials_length' => mb_strlen($approvedMaterials),
            'brand_context_length' => mb_strlen($brandContext),
            'audience' => $data['audience'] ?? null,
            'user_id' => is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null,
        ]);

        $systemInstruction = $this->systemInstructionFor($mode, $tier, $policy);
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
                return response()->json([
                    'error' => 'AI_API_KEY is not configured for apifree.',
                ], 500);
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

            $response = Http::timeout(30)
                ->withHeaders(['Authorization' => "Bearer {$apiKey}"])
                ->post("{$baseUrl}/v1/chat/completions", $payload);

            $json = $response->json();

            if (!$response->successful() || isset($json['error'])) {
                return response()->json([
                    'error' => 'Apifree request failed.',
                    'details' => $json,
                ], 502);
            }

            $text = $json['choices'][0]['message']['content'] ?? '';
            return response()->json(['text' => $text]);
        }

        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            return response()->json([
                'error' => 'GEMINI_API_KEY is not configured.',
            ], 500);
        }

        $model = $data['model'] ?? env('AI_MODEL', 'gemini-1.5-flash');
        $payload = [
            'systemInstruction' => [
                'parts' => [
                    ['text' => $systemInstruction],
                ],
            ],
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $prompt],
                    ],
                ],
            ],
            'generationConfig' => [
                'temperature' => (float) env('AI_TEMPERATURE', 0.5),
                'maxOutputTokens' => (int) env('AI_MAX_TOKENS', 1024),
            ],
        ];

        $response = Http::timeout(30)->post(
            "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}",
            $payload
        );

        if (!$response->successful()) {
            return response()->json([
                'error' => 'Gemini request failed.',
                'details' => $response->json(),
            ], 502);
        }

        $json = $response->json();
        $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';

        return response()->json([
            'text' => $text,
        ]);
    }

    private function systemInstructionFor(string $mode, string $tier, array $policy): string
    {
        $brand = UnivAiBranding::brand();
        $guardrails = implode(' ', config('univai.ai.brand_guardrails', []));
        $base = "You are " . UnivAiBranding::name() . "'s academic assistant for an online-first and hybrid university platform. Brand name: " . UnivAiBranding::name() . ". Legal name: " . ($brand['legal_name'] ?? UnivAiBranding::name()) . ". Tagline: " . ($brand['tagline'] ?? '') . ". Public URL: " . UnivAiBranding::publicUrl() . ". Support email: " . UnivAiBranding::supportEmail() . ". Use UnivAI branding on every public-facing output. Never invent accreditation, tuition, dates, policies, or guarantees not supplied in context. Formal programme content, admissions letters, certificates, policy documents, and public notices must be marked as human-review-required drafts. Use the provided student context to personalize responses and reference their program, progress, GPA, standing, and upcoming tasks. If context is missing, ask a clarifying question instead of guessing. Be concise, structured, accessible, and accurate. Apply this AI access tier: {$policy['label']}. {$policy['guidance']} Brand guardrails: {$guardrails}";
        $modeInstruction = match ($mode) {
            'lesson' => 'Produce structured UnivAI lesson content with outcomes, key concepts, examples, activities, accessibility notes, and a check-for-understanding question.',
            'quiz' => 'Create clear UnivAI assessment questions with answer keys and rationale. Return 3-5 questions unless asked otherwise.',
            'summary' => 'Summarize the provided material into a clear, student-friendly UnivAI explanation.',
            'tutor' => 'Act as a supportive UnivAI tutor. Ask clarifying questions when needed and give step-by-step guidance.',
            'document' => 'Create a branded UnivAI document draft with title, purpose, audience, body, next steps, review status, and support contact.',
            'video' => 'Create a branded UnivAI video package: learning objectives, narration script, scene-by-scene storyboard, on-screen text, accessibility captions, thumbnail prompt, and production notes.',
            'email' => 'Create a branded UnivAI email with subject, preview text, greeting, concise body, call to action, support contact, and compliant footer.',
            'public-notice' => 'Create a branded UnivAI public notice with headline, plain-language summary, details, dates if provided, next steps, support contact, and review-required note.',
            'admissions-letter' => 'Create a formal UnivAI admissions letter draft with reference placeholders, programme details from context only, conditions, next steps, admissions contact, and review-required note.',
            default => 'Answer as a helpful UnivAI university assistant.',
        };

        $grounding = $tier === 'programme'
            ? ' Programme student rule: ground answers in approved module materials supplied in Approved module materials or Student context. If those materials are insufficient, state that the approved module materials do not contain the answer and ask for the correct material.'
            : '';

        return $base . ' ' . $modeInstruction . $grounding;
    }

    private function resolveAccessTier(?string $role, ?string $requestedTier): string
    {
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
                'guidance' => 'Free students receive limited AI support only. Keep answers brief, introductory, and practical. Do not offer cashback, mock exams, flashcards, full study plans, or advanced weak-area coaching.',
            ],
            'paid-certificate' => [
                'label' => 'Paid Certificate AI',
                'maxPrompt' => 2500,
                'modes' => ['general', 'summary', 'tutor', 'lesson', 'document', 'email'],
                'features' => ['chat', 'tutor', 'lessonCompanion', 'notes', 'studyPlan'],
                'guidance' => 'Support certificate completion with course explanations, summaries, and focused revision. Do not provide premium-only flashcards, mock exams, or weak-area diagnostics.',
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
                'features' => ['chat', 'tutor', 'lessonCompanion', 'studyPlan', 'flashcards', 'mockExam', 'weakAreas', 'career', 'notes', 'cashback', 'docs', 'video', 'email', 'publicComms'],
                'guidance' => 'Premium students receive advanced tutor, adaptive study plan, flashcards, mock exam, and weak-area support.',
            ],
        };
    }
}

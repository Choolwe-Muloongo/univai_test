<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
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
        ]);

        $mode = $data['mode'] ?? 'general';
        $mode = match ($mode) {
            'flashcards' => 'quiz',
            'mock-exam' => 'quiz',
            'weak-areas' => 'tutor',
            default => $mode,
        };
        $allowedModes = ['general', 'lesson', 'quiz', 'summary', 'tutor'];
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
        $maxContext = (int) env('AI_MAX_CONTEXT', 8000);
        if ($context !== '' && mb_strlen($context) > $maxContext) {
            return response()->json(['error' => "Context exceeds {$maxContext} characters."], 422);
        }

        logger()->info('ai_request', [
            'mode' => $mode,
            'tier' => $tier,
            'feature' => $feature,
            'model' => $data['model'] ?? null,
            'prompt_length' => mb_strlen($prompt),
            'context_length' => mb_strlen($context),
            'approved_materials_length' => mb_strlen($approvedMaterials),
            'user_id' => is_array($sessionUser) ? ($sessionUser['id'] ?? null) : null,
        ]);

        $systemInstruction = $this->systemInstructionFor($mode, $tier, $policy);
        if ($approvedMaterials !== '') {
            $systemInstruction .= "\n\nApproved module materials:\n{$approvedMaterials}";
        }
        if ($context !== '') {
            $systemInstruction .= "\n\nStudent context:\n{$context}";
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
                'max_tokens' => 1024,
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
        $base = "You are UnivAI's academic assistant for a hybrid university. UnivAI is a real university with programs, modules, assessments, and human academic governance. Use the provided student context to personalize responses and reference their program, progress, GPA, standing, and upcoming tasks. If the student asks about progress or performance, summarize using the provided context and suggest next actions. If context is missing, ask a clarifying question instead of guessing. Be concise, structured, and accurate. Apply this AI access tier: {$policy['label']}. {$policy['guidance']}";
        $modeInstruction = match ($mode) {
            'lesson' => 'Produce concise, structured lesson content with objectives, key concepts, and a short check-for-understanding question.',
            'quiz' => 'Create short, clear assessment questions with answer keys. Return 3-5 questions.',
            'summary' => 'Summarize the provided material into a clear, student-friendly explanation.',
            'tutor' => 'Act as a supportive tutor. Ask clarifying questions when needed and give step-by-step guidance.',
            default => 'Answer as a helpful university assistant.',
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
                'modes' => ['general', 'summary', 'tutor', 'lesson'],
                'features' => ['chat', 'tutor', 'lessonCompanion', 'notes', 'studyPlan'],
                'guidance' => 'Support certificate completion with course explanations, summaries, and focused revision. Do not provide premium-only flashcards, mock exams, or weak-area diagnostics.',
            ],
            'programme' => [
                'label' => 'Programme AI',
                'maxPrompt' => 6000,
                'modes' => ['general', 'summary', 'tutor', 'lesson', 'quiz'],
                'features' => ['chat', 'tutor', 'lessonCompanion', 'studyPlan', 'flashcards', 'mockExam', 'weakAreas', 'career', 'notes', 'groundedAnswers'],
                'guidance' => 'Programme students receive answers grounded in approved module materials.',
            ],
            default => [
                'label' => 'Premium AI',
                'maxPrompt' => 6000,
                'modes' => ['general', 'summary', 'tutor', 'lesson', 'quiz'],
                'features' => ['chat', 'tutor', 'lessonCompanion', 'studyPlan', 'flashcards', 'mockExam', 'weakAreas', 'career', 'notes', 'cashback'],
                'guidance' => 'Premium students receive advanced tutor, adaptive study plan, flashcards, mock exam, and weak-area support.',
            ],
        };
    }
}

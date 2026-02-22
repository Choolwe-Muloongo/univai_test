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
        ]);

        $mode = $data['mode'] ?? 'general';
        $allowedModes = ['general', 'lesson', 'quiz', 'summary', 'tutor'];
        if (!in_array($mode, $allowedModes, true)) {
            return response()->json(['error' => 'Unsupported AI mode.'], 422);
        }

        $prompt = trim($data['prompt']);
        $maxPrompt = (int) env('AI_MAX_PROMPT', 4000);
        if (mb_strlen($prompt) > $maxPrompt) {
            return response()->json(['error' => "Prompt exceeds {$maxPrompt} characters."], 422);
        }

        $context = trim($data['context'] ?? '');
        $maxContext = (int) env('AI_MAX_CONTEXT', 8000);
        if ($context !== '' && mb_strlen($context) > $maxContext) {
            return response()->json(['error' => "Context exceeds {$maxContext} characters."], 422);
        }

        logger()->info('ai_request', [
            'mode' => $mode,
            'model' => $data['model'] ?? null,
            'prompt_length' => mb_strlen($prompt),
            'context_length' => mb_strlen($context),
            'user_id' => is_array($request->session()->get('user')) ? ($request->session()->get('user')['id'] ?? null) : null,
        ]);

        $systemInstruction = $this->systemInstructionFor($mode);
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

    private function systemInstructionFor(string $mode): string
    {
        $base = "You are UnivAI's academic assistant for a hybrid university. UnivAI is a real university with programs, modules, assessments, and human academic governance. Use the provided student context to personalize responses and reference their program, progress, GPA, standing, and upcoming tasks. If the student asks about progress or performance, summarize using the provided context and suggest next actions. If context is missing, ask a clarifying question instead of guessing. Be concise, structured, and accurate.";
        $modeInstruction = match ($mode) {
            'lesson' => 'Produce concise, structured lesson content with objectives, key concepts, and a short check-for-understanding question.',
            'quiz' => 'Create short, clear assessment questions with answer keys. Return 3-5 questions.',
            'summary' => 'Summarize the provided material into a clear, student-friendly explanation.',
            'tutor' => 'Act as a supportive tutor. Ask clarifying questions when needed and give step-by-step guidance.',
            default => 'Answer as a helpful university assistant.',
        };

        return $base . ' ' . $modeInstruction;
    }
}

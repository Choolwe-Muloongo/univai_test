<?php

namespace App\Support\ShortCourses;

use App\Models\Course;
use App\Models\ExamQuestion;
use App\Models\Lesson;
use App\Models\LearningObject;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class EmbeddedShortCourseQuestionSyncer
{
    /**
     * Extract question-like lesson cards and persist them as ExamQuestion rows.
     * This lets Practice Arena and Final Exam reuse uploaded course JSON questions
     * without forcing admins to recreate questions manually.
     */
    public static function sync(Course $course): int
    {
        $course->loadMissing(['lessons.learningObjects']);
        $createdOrUpdated = 0;

        foreach ($course->lessons as $lesson) {
            foreach (self::extractLessonQuestions($lesson) as $question) {
                ExamQuestion::updateOrCreate(
                    [
                        'course_id' => $course->id,
                        'lesson_id' => $lesson->id,
                        'source' => $question['source'],
                    ],
                    [
                        'semester' => null,
                        'question' => $question['question'],
                        'question_type' => $question['question_type'],
                        'options' => $question['options'],
                        'answer' => $question['answer'],
                        'explanation' => $question['explanation'],
                        'difficulty' => $question['difficulty'],
                        'time_seconds' => $question['time_seconds'],
                        'tags' => $question['tags'],
                    ]
                );
                $createdOrUpdated++;
            }
        }

        return $createdOrUpdated;
    }

    /** @return array<int, array<string, mixed>> */
    private static function extractLessonQuestions(Lesson $lesson): array
    {
        $cards = [];

        foreach (['content', 'quiz', 'exercise'] as $field) {
            $cards = array_merge($cards, self::cardsFromValue($lesson->{$field} ?? null, "lesson:{$field}"));
        }

        $lesson->learningObjects?->each(function (LearningObject $object) use (&$cards) {
            $cards = array_merge($cards, self::cardsFromValue($object->payload, "object:{$object->id}:payload"));
            $cards = array_merge($cards, self::cardsFromValue($object->body, "object:{$object->id}:body"));
            $cards[] = [
                'source' => "object:{$object->id}",
                'value' => [
                    'id' => $object->id,
                    'type' => $object->type,
                    'title' => $object->title,
                    'body' => $object->body,
                    'description' => $object->description,
                    'payload' => $object->payload,
                ],
            ];
        });

        return collect($cards)
            ->map(fn (array $card, int $index) => self::normaliseCardQuestion($card['value'], $card['source'] . ':' . $index, $lesson))
            ->filter()
            ->unique(fn (array $question) => $question['source'])
            ->values()
            ->all();
    }

    /** @return array<int, array{source:string,value:mixed}> */
    private static function cardsFromValue(mixed $value, string $source): array
    {
        $decoded = self::decode($value);
        if ($decoded === null || $decoded === '') {
            return [];
        }

        $cards = [];
        self::walkCards($decoded, $source, $cards);
        return $cards;
    }

    /** @param array<int, array{source:string,value:mixed}> $cards */
    private static function walkCards(mixed $value, string $source, array &$cards): void
    {
        if (!is_array($value)) {
            return;
        }

        $looksLikeCard = array_key_exists('type', $value)
            || array_key_exists('question', $value)
            || array_key_exists('correctAnswer', $value)
            || array_key_exists('expectedAnswer', $value)
            || array_key_exists('markingScheme', $value);

        if ($looksLikeCard) {
            $cards[] = ['source' => $source, 'value' => $value];
        }

        foreach (['cards', 'blocks', 'items', 'questions', 'subLessons', 'sub_lessons', 'lessons', 'sections', 'topics'] as $key) {
            if (!empty($value[$key]) && is_array($value[$key])) {
                foreach ($value[$key] as $index => $child) {
                    self::walkCards($child, $source . ':' . $key . ':' . $index, $cards);
                }
            }
        }
    }

    private static function normaliseCardQuestion(mixed $card, string $source, Lesson $lesson): ?array
    {
        if (!is_array($card)) {
            return null;
        }

        $payload = Arr::get($card, 'payload');
        if (is_array($payload)) {
            $card = array_replace_recursive($payload, $card);
        }

        $content = Arr::get($card, 'content');
        if (is_array($content)) {
            $card = array_replace_recursive($content, $card);
        }

        $type = Str::of((string) ($card['type'] ?? ''))->lower()->replace('-', '_')->toString();
        if ($type === 'accounting_studio') {
            return null;
        }

        $question = self::stringValue($card['question'] ?? $card['prompt'] ?? null);
        $options = self::options($card['options'] ?? Arr::get($card, 'data.options'));
        $answer = self::answer($card);
        $explanation = self::stringValue($card['explanation'] ?? Arr::get($card, 'data.explanation') ?? Arr::get($card, 'content.explanation'));

        if ($question === '' && self::isQuestionLikeType($type) && !empty($card['body'])) {
            $question = self::clean((string) $card['body']);
        }

        if ($question === '' || $answer === '') {
            return null;
        }

        $questionType = self::questionType($type, $options, $answer);
        $difficulty = self::stringValue($card['difficulty'] ?? Arr::get($card, 'data.difficulty') ?? Arr::get($card, 'content.difficulty')) ?: 'easy';
        $title = self::stringValue($card['title'] ?? '');
        $cardId = self::stringValue($card['id'] ?? '');
        $stableSource = 'embedded:' . $lesson->id . ':' . ($cardId ?: md5($source . '|' . $title . '|' . $question));

        return [
            'source' => $stableSource,
            'question' => Str::limit($question, 5000, '...'),
            'question_type' => $questionType,
            'options' => $options,
            'answer' => Str::limit($answer, 3000, '...'),
            'explanation' => $explanation ? Str::limit($explanation, 5000, '...') : null,
            'difficulty' => $difficulty,
            'time_seconds' => self::timeSeconds($difficulty, $questionType),
            'tags' => array_values(array_filter([
                'embedded-course-card',
                $type ?: null,
                $lesson->title ? Str::slug($lesson->title) : null,
            ])),
        ];
    }

    private static function isQuestionLikeType(string $type): bool
    {
        return in_array($type, [
            'lesson_checkpoint',
            'checkpoint',
            'mini_quiz',
            'quiz',
            'multiple_choice',
            'mcq',
            'true_false',
            'fill_blank',
            'short_answer',
            'practice_task',
            'drag_drop_match',
            'drag_drop_sort',
            'account_sorting',
            'accounting_exam_question',
        ], true);
    }

    private static function answer(array $card): string
    {
        $answer = $card['correctAnswer'] ?? $card['answer'] ?? $card['correct_answer'] ?? Arr::get($card, 'expectedAnswer') ?? Arr::get($card, 'content.expectedAnswer');
        if (is_array($answer)) {
            return self::clean(json_encode($answer, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '');
        }
        if ($answer !== null && $answer !== '') {
            return self::clean((string) $answer);
        }

        $scheme = Arr::get($card, 'markingScheme') ?? Arr::get($card, 'content.markingScheme');
        if ($scheme && (($card['type'] ?? null) === 'accounting_exam_question')) {
            return 'Use the marking scheme and expected professional reasoning.';
        }

        return '';
    }

    /** @return array<int, string> */
    private static function options(mixed $value): array
    {
        if (!is_array($value)) {
            return [];
        }
        return collect($value)
            ->map(fn ($item) => is_array($item) ? self::stringValue($item['label'] ?? $item['text'] ?? $item['value'] ?? json_encode($item)) : self::stringValue($item))
            ->filter()
            ->values()
            ->all();
    }

    private static function questionType(string $type, array $options, string $answer): string
    {
        if ($type === 'true_false' || collect($options)->map(fn ($option) => strtolower($option))->sort()->values()->all() === ['false', 'true']) {
            return 'true_false';
        }
        if (count($options) > 0) {
            return 'mcq';
        }
        if (str_contains($type, 'sort') || str_contains($type, 'drag_drop')) {
            return 'matching';
        }
        if (mb_strlen($answer) > 120) {
            return 'short_answer';
        }
        return 'fill_blank';
    }

    private static function timeSeconds(string $difficulty, string $questionType): int
    {
        if ($questionType === 'short_answer') return 180;
        return match ($difficulty) {
            'hard', 'professional' => 120,
            'medium' => 75,
            default => 60,
        };
    }

    private static function decode(mixed $value): mixed
    {
        if (is_array($value)) return $value;
        if (!is_string($value)) return $value;
        $trimmed = trim($value);
        if ($trimmed === '') return null;
        if (!str_starts_with($trimmed, '{') && !str_starts_with($trimmed, '[')) return $trimmed;
        $decoded = json_decode($trimmed, true);
        return json_last_error() === JSON_ERROR_NONE ? $decoded : $trimmed;
    }

    private static function stringValue(mixed $value): string
    {
        if (is_array($value)) return self::clean(json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '');
        if ($value === null) return '';
        return self::clean((string) $value);
    }

    private static function clean(string $value): string
    {
        return trim(preg_replace('/\s+/', ' ', strip_tags($value)) ?? '');
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LearningObject;
use App\Models\Lesson;
use App\Models\LessonDocument;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LessonDocumentsController extends Controller
{
    public function index(Request $request, string $lessonId)
    {
        $intakeId = $request->query('intakeId');
        $sessionUser = $request->session()->get('user');
        $role = is_array($sessionUser) ? ($sessionUser['role'] ?? null) : null;

        $query = LessonDocument::query()->where('lesson_id', $lessonId);
        if ($intakeId) {
            $query->where('intake_id', $intakeId);
        }
        if (in_array($role, ['student', 'premium-student', 'freemium-student'], true)) {
            $query->where('status', 'approved');
        }

        return $query->orderBy('created_at', 'desc')->get()->map(fn (LessonDocument $doc) => [
            'id' => $doc->id,
            'lessonId' => $doc->lesson_id,
            'learningObjectId' => $doc->learning_object_id,
            'intakeId' => $doc->intake_id,
            'fileName' => $doc->file_name,
            'mimeType' => $doc->mime_type,
            'extractedText' => $doc->extracted_text,
            'status' => $doc->status,
            'source' => $doc->source,
            'approvedAt' => optional($doc->approved_at)->toISOString(),
            'reviewNotes' => $doc->review_notes,
            'createdAt' => optional($doc->created_at)->toISOString(),
        ]);
    }

    public function store(Request $request, string $lessonId)
    {
        $payload = $request->validate([
            'intakeId' => ['nullable', 'string'],
            'text' => ['nullable', 'string'],
            'file' => ['nullable', 'file', 'max:10240'],
            'source' => ['nullable', 'string'],
        ]);

        $lesson = Lesson::find($lessonId);
        if (!$lesson) {
            return response()->json(['message' => 'Lesson not found'], 404);
        }

        $file = $request->file('file');
        $extractedText = trim($payload['text'] ?? '');
        $mimeType = null;
        $storagePath = null;
        $fileName = $file?->getClientOriginalName() ?? 'manual-notes.txt';
        $source = $payload['source'] ?? 'manual';

        if ($file) {
            $mimeType = $file->getClientMimeType();
            $safeName = Str::slug(pathinfo($fileName, PATHINFO_FILENAME));
            $extension = $file->getClientOriginalExtension();
            $fileName = $safeName . '-' . time() . ($extension ? ".{$extension}" : '');
            $storagePath = $file->storeAs("lesson-documents/{$lessonId}", $fileName);

            if ($extractedText === '' && str_starts_with((string) $mimeType, 'text/')) {
                $extractedText = file_get_contents($file->getRealPath());
            }

            if ($extractedText === '' && $mimeType === 'application/pdf' && class_exists(\Smalot\PdfParser\Parser::class)) {
                try {
                    $parser = new \Smalot\PdfParser\Parser();
                    $pdf = $parser->parseFile($file->getRealPath());
                    $extractedText = trim($pdf->getText());
                } catch (\Throwable $e) {
                    // Leave extractedText empty if parsing fails.
                }
            }

            if ($extractedText === '' && $mimeType && str_starts_with($mimeType, 'image/')) {
                $tesseract = env('TESSERACT_PATH');
                if ($tesseract && function_exists('shell_exec')) {
                    $command = sprintf('"%s" "%s" stdout', $tesseract, $file->getRealPath());
                    $output = shell_exec($command);
                    if (is_string($output)) {
                        $extractedText = trim($output);
                    }
                }
            }
        }

        $uploaderId = $request->session()->get('user')['id'] ?? null;
        $uploaderId = is_numeric($uploaderId) ? (int) $uploaderId : null;

        $autoApproved = $source !== 'ai';
        $document = LessonDocument::create([
            'lesson_id' => $lessonId,
            'intake_id' => $payload['intakeId'] ?? null,
            'source' => $source,
            'status' => $autoApproved ? 'approved' : 'pending',
            'uploaded_by' => $uploaderId,
            'approved_by' => $autoApproved ? $uploaderId : null,
            'approved_at' => $autoApproved ? now() : null,
            'file_name' => $fileName,
            'mime_type' => $mimeType,
            'storage_path' => $storagePath,
            'extracted_text' => $extractedText !== '' ? $extractedText : null,
        ]);

        $learningObject = LearningObject::create([
            'id' => "{$lessonId}-document-{$document->id}-v1",
            'type' => 'document',
            'title' => $fileName,
            'description' => $extractedText !== '' ? Str::limit($extractedText, 240) : null,
            'body' => $extractedText !== '' ? $extractedText : null,
            'storage_path' => $storagePath,
            'mime_type' => $mimeType,
            'access_rules' => ['roles' => ['student', 'lecturer'], 'requiresEnrollment' => true, 'intakeId' => $payload['intakeId'] ?? null],
            'version' => 1,
            'version_label' => 'uploaded',
            'review_status' => $autoApproved ? 'approved' : 'pending_review',
            'publication_status' => $autoApproved ? 'published' : 'draft',
            'created_by' => $uploaderId,
            'updated_by' => $uploaderId,
            'reviewed_by' => $autoApproved ? $uploaderId : null,
            'reviewed_at' => $autoApproved ? now() : null,
            'published_at' => $autoApproved ? now() : null,
        ]);

        $lesson->learningObjects()->attach($learningObject->id, [
            'position' => ((int) $lesson->learningObjects()->max('lesson_learning_objects.position')) + 1,
            'is_required' => false,
            'access_rules' => json_encode(['roles' => ['student'], 'requiresEnrollment' => true, 'intakeId' => $payload['intakeId'] ?? null]),
            'publication_status' => $autoApproved ? 'published' : 'draft',
        ]);
        $document->update(['learning_object_id' => $learningObject->id]);

        AuditLogger::log($request, 'lesson_document.uploaded', 'lesson_document', (string) $document->id, [
            'lessonId' => $lessonId,
            'intakeId' => $payload['intakeId'] ?? null,
            'source' => $source,
        ]);

        return response()->json([
            'id' => $document->id,
            'lessonId' => $document->lesson_id,
            'learningObjectId' => $document->learning_object_id,
            'intakeId' => $document->intake_id,
            'fileName' => $document->file_name,
            'mimeType' => $document->mime_type,
            'extractedText' => $document->extracted_text,
            'status' => $document->status,
            'source' => $document->source,
            'approvedAt' => optional($document->approved_at)->toISOString(),
            'reviewNotes' => $document->review_notes,
        ], 201);
    }

    public function review(Request $request, string $lessonId, LessonDocument $document)
    {
        if ($document->lesson_id !== $lessonId) {
            return response()->json(['message' => 'Document not found'], 404);
        }

        $payload = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'reviewNotes' => ['nullable', 'string'],
        ]);

        $sessionUser = $request->session()->get('user');
        $role = is_array($sessionUser) ? ($sessionUser['role'] ?? null) : null;
        if (!in_array($role, ['lecturer', 'admin'], true)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $approverId = null;
        if (is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])) {
            $approverId = (int) $sessionUser['id'];
        }

        $document->update([
            'status' => $payload['status'],
            'review_notes' => $payload['reviewNotes'] ?? $document->review_notes,
            'approved_by' => $payload['status'] === 'approved' ? $approverId : null,
            'approved_at' => $payload['status'] === 'approved' ? now() : null,
        ]);

        if ($document->learningObject) {
            $document->learningObject->update([
                'review_status' => $payload['status'] === 'approved' ? 'approved' : 'changes_requested',
                'publication_status' => $payload['status'] === 'approved' ? 'published' : 'draft',
                'reviewed_by' => $payload['status'] === 'approved' ? $approverId : null,
                'reviewed_at' => $payload['status'] === 'approved' ? now() : null,
                'published_at' => $payload['status'] === 'approved' ? now() : null,
            ]);
            $document->lesson?->learningObjects()->updateExistingPivot($document->learning_object_id, [
                'publication_status' => $payload['status'] === 'approved' ? 'published' : 'draft',
            ]);
        }

        AuditLogger::log($request, 'lesson_document.reviewed', 'lesson_document', (string) $document->id, [
            'status' => $payload['status'],
        ]);

        return [
            'id' => $document->id,
            'lessonId' => $document->lesson_id,
            'learningObjectId' => $document->learning_object_id,
            'intakeId' => $document->intake_id,
            'fileName' => $document->file_name,
            'mimeType' => $document->mime_type,
            'extractedText' => $document->extracted_text,
            'status' => $document->status,
            'source' => $document->source,
            'approvedAt' => optional($document->approved_at)->toISOString(),
            'reviewNotes' => $document->review_notes,
        ];
    }
}

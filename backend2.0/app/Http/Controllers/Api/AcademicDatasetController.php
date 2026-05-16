<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class AcademicDatasetController extends Controller
{
    public function export(Request $request)
    {
        abort_unless(Schema::hasTable('learning_objects'), 503, 'Learning content is not migrated yet.');

        $payload = $request->validate([
            'status' => ['nullable', 'in:approved,published'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ]);

        $status = $payload['status'] ?? 'published';
        $limit = (int) ($payload['limit'] ?? 500);

        $query = DB::table('learning_objects')->where('is_current', true);

        if (Schema::hasColumn('learning_objects', 'protected_content')) {
            $query->where('protected_content', false);
        }

        $rows = $query
            ->where(function ($inner) use ($status) {
                if ($status === 'published') {
                    $inner->where('publication_status', 'published');
                } else {
                    $inner->where('review_status', 'approved');
                }
            })
            ->orderBy('updated_at', 'desc')
            ->limit($limit)
            ->get();

        $dataset = $rows->map(function ($row) {
            $payload = $this->decodeJson($row->payload);
            $body = $this->safeText((string) ($row->body ?? ''));

            return [
                'id' => $row->id,
                'type' => $row->type,
                'title' => $this->safeText((string) $row->title),
                'description' => $this->safeText((string) ($row->description ?? '')),
                'body' => $body,
                'cards' => $payload['blocks'] ?? [],
                'reviewStatus' => $row->review_status,
                'publicationStatus' => $row->publication_status,
                'version' => $row->version,
            ];
        })->values()->all();

        $path = 'academic-datasets/univai-approved-content-' . now()->format('Ymd-His') . '.json';
        Storage::disk('local')->put($path, json_encode([
            'notice' => 'Privacy-safe academic content export. Student records, applicant records, emails, phone numbers, payments, submissions and private chats are intentionally excluded.',
            'generatedAt' => now()->toISOString(),
            'recordCount' => count($dataset),
            'records' => $dataset,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        if (Schema::hasTable('academic_dataset_exports')) {
            DB::table('academic_dataset_exports')->insert([
                'created_by' => $this->userId($request),
                'dataset_type' => 'univai_academic_content',
                'status' => 'ready',
                'filters' => json_encode(['status' => $status, 'limit' => $limit]),
                'record_count' => count($dataset),
                'file_path' => $path,
                'exported_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'status' => 'ready',
            'filePath' => $path,
            'recordCount' => count($dataset),
            'privacyNotice' => 'Only approved/published academic content is exported. Personal learner data is excluded.',
        ]);
    }

    private function decodeJson($value): array
    {
        if (is_array($value)) {
            return $value;
        }

        if (!is_string($value) || trim($value) === '') {
            return [];
        }

        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function safeText(string $value): string
    {
        $value = strip_tags($value);
        $value = preg_replace('/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i', '[email removed]', $value);
        $value = preg_replace('/(?:\+?\d[\d\s().-]{7,}\d)/', '[phone removed]', $value);
        return trim(preg_replace('/\s+/', ' ', $value));
    }

    private function userId(Request $request): ?int
    {
        $user = $request->session()->get('user');
        return is_array($user) && isset($user['id']) && is_numeric($user['id']) ? (int) $user['id'] : null;
    }
}

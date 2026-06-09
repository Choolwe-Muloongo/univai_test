<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppRating;
use App\Models\FeedbackComment;
use App\Models\FeedbackPost;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminFeedbackController extends Controller
{
    public function index(Request $request)
    {
        $query = FeedbackPost::query();

        if ($type = $request->query('type')) {
            if ($type !== 'all') {
                $query->where('type', $type);
            }
        }

        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        $posts = $query
            ->orderByDesc('upvotes_count')
            ->orderByDesc('comments_count')
            ->orderByDesc('created_at')
            ->limit(200)
            ->get();

        return response()->json([
            'items' => $posts->map(fn (FeedbackPost $post) => $this->mapPost($post)),
            'summary' => $this->summary(),
        ]);
    }

    public function update(Request $request, FeedbackPost $feedbackPost)
    {
        $payload = $request->validate([
            'status' => ['nullable', Rule::in(['open', 'under_review', 'planned', 'in_progress', 'completed', 'rejected', 'duplicate'])],
            'adminResponse' => ['nullable', 'string', 'max:8000'],
            'duplicateOf' => ['nullable', 'integer', 'exists:feedback_posts,id'],
        ]);

        $feedbackPost->fill([
            'status' => $payload['status'] ?? $feedbackPost->status,
            'admin_response' => array_key_exists('adminResponse', $payload) ? $payload['adminResponse'] : $feedbackPost->admin_response,
            'duplicate_of' => array_key_exists('duplicateOf', $payload) ? $payload['duplicateOf'] : $feedbackPost->duplicate_of,
        ])->save();

        return response()->json($this->mapPost($feedbackPost->fresh()));
    }

    public function comment(Request $request, FeedbackPost $feedbackPost)
    {
        $payload = $request->validate([
            'body' => ['required', 'string', 'min:2', 'max:5000'],
        ]);

        $sessionUser = $request->session()->get('user');
        $comment = FeedbackComment::create([
            'feedback_post_id' => $feedbackPost->id,
            'user_key' => is_array($sessionUser) ? (string) ($sessionUser['id'] ?? $sessionUser['email'] ?? 'admin') : 'admin',
            'author_name' => is_array($sessionUser) ? ($sessionUser['name'] ?? 'UnivAI Team') : 'UnivAI Team',
            'body' => trim($payload['body']),
            'is_admin_reply' => true,
        ]);

        $feedbackPost->increment('comments_count');

        return response()->json([
            'id' => $comment->id,
            'body' => $comment->body,
            'authorName' => $comment->author_name,
            'isAdminReply' => true,
            'createdAt' => $comment->created_at?->toISOString(),
        ], 201);
    }

    public function stats()
    {
        return response()->json($this->summary());
    }

    protected function mapPost(FeedbackPost $post): array
    {
        return [
            'id' => $post->id,
            'type' => $post->type,
            'title' => $post->title,
            'body' => $post->body,
            'rating' => $post->rating,
            'status' => $post->status,
            'adminResponse' => $post->admin_response,
            'duplicateOf' => $post->duplicate_of,
            'upvotesCount' => (int) $post->upvotes_count,
            'commentsCount' => (int) $post->comments_count,
            'authorName' => $post->author_name ?: 'UnivAI Student',
            'authorEmail' => $post->author_email,
            'createdAt' => $post->created_at?->toISOString(),
            'updatedAt' => $post->updated_at?->toISOString(),
        ];
    }

    protected function summary(): array
    {
        return [
            'totalPosts' => FeedbackPost::count(),
            'openBugs' => FeedbackPost::where('type', 'bug')->whereIn('status', ['open', 'under_review', 'planned', 'in_progress'])->count(),
            'plannedFeatures' => FeedbackPost::where('type', 'feature')->whereIn('status', ['planned', 'in_progress'])->count(),
            'completedRequests' => FeedbackPost::where('status', 'completed')->count(),
            'averageRating' => round((float) AppRating::avg('rating'), 1),
            'totalRatings' => AppRating::count(),
        ];
    }
}

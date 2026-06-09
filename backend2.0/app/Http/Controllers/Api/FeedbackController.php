<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppRating;
use App\Models\FeedbackComment;
use App\Models\FeedbackPost;
use App\Models\FeedbackVote;
use App\Support\Notifications\InAppNotifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class FeedbackController extends Controller
{
    public function index(Request $request)
    {
        $userKey = $this->userKey($request);
        $query = FeedbackPost::query()->withCount(['votes as live_votes_count', 'comments as live_comments_count']);

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

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($inner) use ($search) {
                $inner->where('title', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%");
            });
        }

        match ($request->query('sort', 'top')) {
            'newest' => $query->orderByDesc('created_at'),
            'most_commented' => $query->orderByDesc('comments_count')->orderByDesc('created_at'),
            'planned' => $query->orderByRaw("FIELD(status, 'planned', 'in_progress', 'under_review', 'open', 'completed', 'rejected', 'duplicate')")->orderByDesc('upvotes_count'),
            'completed' => $query->orderByRaw("FIELD(status, 'completed', 'in_progress', 'planned', 'under_review', 'open', 'rejected', 'duplicate')")->orderByDesc('updated_at'),
            default => $query->orderByDesc('upvotes_count')->orderByDesc('comments_count')->orderByDesc('created_at'),
        };

        $posts = $query->limit(100)->get();
        $votedIds = $userKey
            ? FeedbackVote::where('user_key', $userKey)->whereIn('feedback_post_id', $posts->pluck('id'))->pluck('feedback_post_id')->all()
            : [];

        return response()->json([
            'items' => $posts->map(fn (FeedbackPost $post) => $this->mapPost($post, in_array($post->id, $votedIds, true))),
            'summary' => $this->summary(),
        ]);
    }

    public function store(Request $request, InAppNotifier $notifier)
    {
        $payload = $request->validate([
            'type' => ['required', Rule::in(['feature', 'bug', 'suggestion', 'rating'])],
            'title' => ['required', 'string', 'min:3', 'max:255'],
            'body' => ['required', 'string', 'min:10', 'max:8000'],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
        ]);

        if ($payload['type'] === 'rating' && empty($payload['rating'])) {
            return response()->json(['message' => 'Rating is required when feedback type is rating.'], 422);
        }

        $sessionUser = $this->sessionUser($request);
        $post = FeedbackPost::create([
            'user_key' => $this->userKey($request),
            'author_name' => $sessionUser['name'] ?? 'UnivAI Student',
            'author_email' => $sessionUser['email'] ?? null,
            'type' => $payload['type'],
            'title' => trim($payload['title']),
            'body' => trim($payload['body']),
            'rating' => $payload['rating'] ?? null,
            'status' => 'open',
        ]);

        if ($payload['type'] === 'rating' && !empty($payload['rating'])) {
            AppRating::updateOrCreate(
                ['user_key' => $this->userKey($request)],
                [
                    'author_name' => $sessionUser['name'] ?? 'UnivAI Student',
                    'rating' => $payload['rating'],
                    'comment' => trim($payload['body']),
                ]
            );
        }

        $notifier->notifyFeedbackCreated($post);

        return response()->json($this->mapPost($post, false), 201);
    }

    public function show(Request $request, FeedbackPost $feedbackPost)
    {
        $feedbackPost->load(['comments' => fn ($query) => $query->orderBy('created_at')]);
        $hasVoted = FeedbackVote::where('feedback_post_id', $feedbackPost->id)->where('user_key', $this->userKey($request))->exists();

        return response()->json($this->mapPost($feedbackPost, $hasVoted, true));
    }

    public function vote(Request $request, FeedbackPost $feedbackPost, InAppNotifier $notifier)
    {
        $userKey = $this->userKey($request);

        DB::transaction(function () use ($feedbackPost, $userKey) {
            $vote = FeedbackVote::firstOrCreate([
                'feedback_post_id' => $feedbackPost->id,
                'user_key' => $userKey,
            ]);

            if ($vote->wasRecentlyCreated) {
                $feedbackPost->increment('upvotes_count');
            }
        });

        $fresh = $feedbackPost->fresh();
        $notifier->notifyFeedbackVoteMilestone($fresh);

        return response()->json($this->mapPost($fresh, true));
    }

    public function unvote(Request $request, FeedbackPost $feedbackPost)
    {
        $userKey = $this->userKey($request);

        DB::transaction(function () use ($feedbackPost, $userKey) {
            $deleted = FeedbackVote::where('feedback_post_id', $feedbackPost->id)->where('user_key', $userKey)->delete();
            if ($deleted) {
                $feedbackPost->decrement('upvotes_count');
            }
        });

        return response()->json($this->mapPost($feedbackPost->fresh(), false));
    }

    public function comment(Request $request, FeedbackPost $feedbackPost, InAppNotifier $notifier)
    {
        $payload = $request->validate([
            'body' => ['required', 'string', 'min:2', 'max:5000'],
        ]);

        $sessionUser = $this->sessionUser($request);
        $comment = null;

        DB::transaction(function () use ($feedbackPost, $payload, $sessionUser, &$comment, $request) {
            $comment = FeedbackComment::create([
                'feedback_post_id' => $feedbackPost->id,
                'user_key' => $this->userKey($request),
                'author_name' => $sessionUser['name'] ?? 'UnivAI Student',
                'body' => trim($payload['body']),
            ]);
            $feedbackPost->increment('comments_count');
        });

        if ($feedbackPost->user_key && $feedbackPost->user_key !== $this->userKey($request)) {
            $notifier->notify(
                $feedbackPost->user_key,
                'New comment on your feedback',
                ($sessionUser['name'] ?? 'A student') . " commented on '{$feedbackPost->title}'.",
                '/student/suggestions',
                'feedback'
            );
        }

        return response()->json($this->mapComment($comment), 201);
    }

    public function rating(Request $request, InAppNotifier $notifier)
    {
        $payload = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:5000'],
        ]);

        $sessionUser = $this->sessionUser($request);
        $rating = AppRating::updateOrCreate(
            ['user_key' => $this->userKey($request)],
            [
                'author_name' => $sessionUser['name'] ?? 'UnivAI Student',
                'rating' => $payload['rating'],
                'comment' => $payload['comment'] ?? null,
            ]
        );

        if ($payload['rating'] <= 3) {
            $notifier->notifyAdmins(
                'Low app rating submitted',
                ($sessionUser['name'] ?? 'A student') . " rated UnivAI {$payload['rating']}/5.",
                '/admin/feedback',
                'rating'
            );
        }

        return response()->json([
            'rating' => $rating->rating,
            'comment' => $rating->comment,
            'summary' => $this->summary(),
        ]);
    }

    public function ratingSummary()
    {
        return response()->json($this->summary());
    }

    protected function mapPost(FeedbackPost $post, bool $hasVoted = false, bool $includeComments = false): array
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
            'hasVoted' => $hasVoted,
            'authorName' => $post->author_name ?: 'UnivAI Student',
            'createdAt' => $post->created_at?->toISOString(),
            'updatedAt' => $post->updated_at?->toISOString(),
            'comments' => $includeComments ? $post->comments->map(fn (FeedbackComment $comment) => $this->mapComment($comment))->values() : [],
        ];
    }

    protected function mapComment(FeedbackComment $comment): array
    {
        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'authorName' => $comment->author_name ?: 'UnivAI Student',
            'isAdminReply' => (bool) $comment->is_admin_reply,
            'createdAt' => $comment->created_at?->toISOString(),
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

    protected function sessionUser(Request $request): array
    {
        $user = $request->session()->get('user');
        return is_array($user) ? $user : [];
    }

    protected function userKey(Request $request): string
    {
        $user = $this->sessionUser($request);
        return (string) ($user['id'] ?? $user['email'] ?? $request->session()->getId());
    }
}

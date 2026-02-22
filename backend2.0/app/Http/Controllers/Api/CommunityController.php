<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Discussion;
use App\Models\DiscussionComment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CommunityController extends Controller
{
    public function index()
    {
        return Discussion::query()
            ->with('comments')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Discussion $discussion) => $this->mapDiscussion($discussion));
    }

    public function show(string $id)
    {
        $discussion = Discussion::with('comments')->find($id);
        if (!$discussion) {
            return response()->json(null, 404);
        }

        return $this->mapDiscussion($discussion);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'details' => 'required|string',
            'category' => 'nullable|string|max:255',
        ]);

        $discussion = Discussion::create([
            'id' => (string) Str::uuid(),
            'title' => $data['title'],
            'author' => 'UnivAI Student',
            'avatar' => 'https://i.pravatar.cc/40?u=univai-student',
            'snippet' => $data['details'],
        ]);

        return $this->mapDiscussion($discussion->load('comments'));
    }

    public function storeComment(Request $request, string $id)
    {
        $discussion = Discussion::find($id);
        if (!$discussion) {
            return response()->json(null, 404);
        }

        $payload = $request->validate([
            'content' => ['required', 'string'],
        ]);

        $sessionUser = $request->session()->get('user');
        $author = 'UnivAI Student';
        $avatar = 'https://i.pravatar.cc/40?u=univai-student';
        if (is_array($sessionUser)) {
            $author = $sessionUser['name'] ?? $sessionUser['email'] ?? $author;
            if (!empty($sessionUser['email'])) {
                $avatar = 'https://i.pravatar.cc/40?u=' . urlencode($sessionUser['email']);
            }
        }

        $comment = DiscussionComment::create([
            'discussion_id' => $discussion->id,
            'author' => $author,
            'avatar' => $avatar,
            'content' => $payload['content'],
            'upvotes' => 0,
        ]);

        return response()->json([
            'id' => (string) $comment->id,
            'author' => $comment->author,
            'avatar' => $comment->avatar,
            'content' => $comment->content,
            'timestamp' => $comment->created_at?->diffForHumans() ?? 'just now',
            'upvotes' => $comment->upvotes,
        ]);
    }

    private function mapDiscussion(Discussion $discussion): array
    {
        return [
            'id' => $discussion->id,
            'title' => $discussion->title,
            'author' => $discussion->author,
            'avatar' => $discussion->avatar,
            'snippet' => $discussion->snippet,
            'timestamp' => $discussion->created_at?->diffForHumans() ?? 'just now',
            'comments' => $discussion->comments->map(fn (DiscussionComment $comment) => [
                'id' => (string) $comment->id,
                'author' => $comment->author,
                'avatar' => $comment->avatar,
                'content' => $comment->content,
                'timestamp' => $comment->created_at?->diffForHumans() ?? 'just now',
                'upvotes' => $comment->upvotes,
            ]),
        ];
    }
}

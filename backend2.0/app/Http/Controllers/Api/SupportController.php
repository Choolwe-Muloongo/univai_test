<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportMessage;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SupportController extends Controller
{
    public function index(Request $request)
    {
        [$userId, $email] = $this->resolveIdentity($request);

        $query = SupportTicket::query()->orderByDesc('created_at');
        if ($userId) {
            $query->where('user_id', $userId);
        } elseif ($email) {
            $query->where('email', $email);
        } else {
            return [];
        }

        return $query->get()->map(fn (SupportTicket $ticket) => $this->mapTicket($ticket));
    }

    public function store(Request $request)
    {
        [$userId, $email, $name, $role] = $this->resolveIdentity($request, true);

        $payload = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'priority' => ['nullable', 'string', 'max:50'],
        ]);

        $ticket = SupportTicket::create([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'email' => $email,
            'subject' => $payload['subject'],
            'description' => $payload['description'],
            'category' => $payload['category'] ?? null,
            'priority' => $payload['priority'] ?? 'normal',
            'status' => 'open',
        ]);

        SupportMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => $userId,
            'author' => $name ?? $email ?? 'Student',
            'role' => $role ?? 'student',
            'message' => $payload['description'],
        ]);

        return $this->mapTicket($ticket->load('messages'));
    }

    public function show(Request $request, string $id)
    {
        $ticket = SupportTicket::with('messages')->find($id);
        if (!$ticket) {
            return response()->json(null, 404);
        }

        [$userId, $email] = $this->resolveIdentity($request);
        if (($userId && $ticket->user_id !== $userId) || (!$userId && $email && $ticket->email !== $email)) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        return $this->mapTicket($ticket);
    }

    public function storeMessage(Request $request, string $id)
    {
        $ticket = SupportTicket::find($id);
        if (!$ticket) {
            return response()->json(null, 404);
        }

        [$userId, $email, $name, $role] = $this->resolveIdentity($request, true);
        if (($userId && $ticket->user_id !== $userId) || (!$userId && $email && $ticket->email !== $email)) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        $payload = $request->validate([
            'message' => ['required', 'string'],
        ]);

        $message = SupportMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => $userId,
            'author' => $name ?? $email ?? 'Student',
            'role' => $role ?? 'student',
            'message' => $payload['message'],
        ]);

        return response()->json($this->mapMessage($message), 201);
    }

    private function resolveIdentity(Request $request, bool $includeName = false): array
    {
        $sessionUser = $request->session()->get('user');
        $userId = null;
        $email = null;
        $name = null;
        $role = null;

        if (is_array($sessionUser)) {
            $email = $sessionUser['email'] ?? null;
            $name = $sessionUser['name'] ?? null;
            $role = $sessionUser['role'] ?? null;
            if (!empty($sessionUser['id']) && is_numeric($sessionUser['id'])) {
                $userId = (int) $sessionUser['id'];
            }
        }

        if (!$userId && $email) {
            $user = User::where('email', $email)->first();
            if ($user) {
                $userId = $user->id;
                $name = $name ?? $user->name;
            }
        }

        if ($includeName) {
            return [$userId, $email, $name, $role];
        }

        return [$userId, $email];
    }

    private function mapTicket(SupportTicket $ticket): array
    {
        return [
            'id' => $ticket->id,
            'subject' => $ticket->subject,
            'description' => $ticket->description,
            'category' => $ticket->category,
            'priority' => $ticket->priority,
            'status' => $ticket->status,
            'createdAt' => optional($ticket->created_at)->toISOString(),
            'messages' => $ticket->relationLoaded('messages')
                ? $ticket->messages->map(fn (SupportMessage $message) => $this->mapMessage($message))
                : [],
        ];
    }

    private function mapMessage(SupportMessage $message): array
    {
        return [
            'id' => $message->id,
            'author' => $message->author ?? 'Support',
            'role' => $message->role ?? 'support',
            'message' => $message->message,
            'createdAt' => optional($message->created_at)->toISOString(),
        ];
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PortfolioItem;
use App\Models\User;
use Illuminate\Http\Request;

class PortfolioController extends Controller
{
    public function index(Request $request)
    {
        $userId = $this->resolveUserId($request);
        if (!$userId) {
            return [];
        }

        return PortfolioItem::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (PortfolioItem $item) => $this->mapItem($item));
    }

    public function store(Request $request)
    {
        $userId = $this->resolveUserId($request);
        if (!$userId) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'link' => ['nullable', 'string', 'max:255'],
            'itemType' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $item = PortfolioItem::create([
            'user_id' => $userId,
            'title' => $payload['title'],
            'description' => $payload['description'] ?? null,
            'link' => $payload['link'] ?? null,
            'item_type' => $payload['itemType'] ?? 'project',
            'status' => $payload['status'] ?? 'draft',
        ]);

        return $this->mapItem($item);
    }

    public function update(Request $request, PortfolioItem $portfolioItem)
    {
        $userId = $this->resolveUserId($request);
        if (!$userId || $portfolioItem->user_id !== $userId) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'link' => ['nullable', 'string', 'max:255'],
            'itemType' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $portfolioItem->update([
            'title' => $payload['title'],
            'description' => $payload['description'] ?? null,
            'link' => $payload['link'] ?? null,
            'item_type' => $payload['itemType'] ?? $portfolioItem->item_type,
            'status' => $payload['status'] ?? $portfolioItem->status,
        ]);

        return $this->mapItem($portfolioItem);
    }

    public function destroy(Request $request, PortfolioItem $portfolioItem)
    {
        $userId = $this->resolveUserId($request);
        if (!$userId || $portfolioItem->user_id !== $userId) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        $portfolioItem->delete();
        return response()->noContent();
    }

    private function resolveUserId(Request $request): ?int
    {
        $sessionUser = $request->session()->get('user');
        if (is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])) {
            return (int) $sessionUser['id'];
        }

        if (is_array($sessionUser) && !empty($sessionUser['email'])) {
            $user = User::where('email', $sessionUser['email'])->first();
            return $user?->id;
        }

        return null;
    }

    private function mapItem(PortfolioItem $item): array
    {
        return [
            'id' => $item->id,
            'title' => $item->title,
            'description' => $item->description,
            'link' => $item->link,
            'itemType' => $item->item_type,
            'status' => $item->status,
            'createdAt' => optional($item->created_at)->toISOString(),
        ];
    }
}

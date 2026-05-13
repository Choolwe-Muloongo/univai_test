<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaderboardEntry;

class LeaderboardController extends Controller
{
    public function index()
    {
        return LeaderboardEntry::query()
            ->orderBy('rank')
            ->get()
            ->map(fn (LeaderboardEntry $entry) => [
                'id' => (string) $entry->id,
                'rank' => $entry->rank,
                'name' => $entry->name,
                'avatar' => $entry->avatar,
                'school' => $entry->school,
                'points' => $entry->points,
            ]);
    }
}

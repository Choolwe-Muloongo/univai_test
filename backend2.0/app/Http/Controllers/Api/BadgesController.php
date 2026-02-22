<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Badge;

class BadgesController extends Controller
{
    public function index()
    {
        return Badge::query()
            ->orderBy('title')
            ->get()
            ->map(fn (Badge $badge) => [
                'id' => $badge->id,
                'title' => $badge->title,
                'description' => $badge->description,
                'icon' => $badge->icon,
            ]);
    }
}

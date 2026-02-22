<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;

class ProgramsController extends Controller
{
    public function index()
    {
        return Program::query()
            ->orderBy('title')
            ->get()
            ->map(fn (Program $program) => [
                'id' => $program->id,
                'title' => $program->title,
                'description' => $program->description,
                'schoolId' => $program->school_id,
                'progress' => $program->progress,
                'imageId' => $program->image_id,
            ]);
    }
}

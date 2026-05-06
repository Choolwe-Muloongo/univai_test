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
                'awardType' => $program->award_type,
                'qualificationLevel' => $program->qualification_level,
                'durationSemesters' => $program->duration_semesters,
                'totalCredits' => $program->total_credits,
                'deliveryMode' => $program->delivery_mode,
            ]);
    }
}

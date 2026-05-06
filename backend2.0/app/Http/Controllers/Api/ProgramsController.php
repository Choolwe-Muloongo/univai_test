<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Support\DeliveryModes;
use Illuminate\Http\Request;

class ProgramsController extends Controller
{
    public function index()
    {
        return Program::query()
            ->orderBy('title')
            ->get()
            ->map(fn (Program $program) => $this->mapProgram($program));
    }

    public function updateDeliveryModes(Request $request, Program $program)
    {
        $payload = $request->validate([
            'supportedDeliveryModes' => ['required', 'array', 'min:1'],
            'supportedDeliveryModes.*' => ['string'],
        ]);

        $program->update([
            'supported_delivery_modes' => DeliveryModes::normalizeMany($payload['supportedDeliveryModes']),
        ]);

        return $this->mapProgram($program);
    }

    private function mapProgram(Program $program): array
    {
        return [
            'id' => $program->id,
            'title' => $program->title,
            'description' => $program->description,
            'schoolId' => $program->school_id,
            'progress' => $program->progress,
            'imageId' => $program->image_id,
            'supportedDeliveryModes' => DeliveryModes::normalizeMany($program->supported_delivery_modes),
        ];
    }
}

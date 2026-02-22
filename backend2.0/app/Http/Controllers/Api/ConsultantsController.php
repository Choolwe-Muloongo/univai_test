<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConsultantApplication;

class ConsultantsController extends Controller
{
    public function index()
    {
        return ConsultantApplication::query()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (ConsultantApplication $application) => $this->mapApplication($application));
    }

    public function show(string $id)
    {
        $application = ConsultantApplication::find($id);
        if (!$application) {
            return response()->json(null, 404);
        }

        return $this->mapApplication($application);
    }

    private function mapApplication(ConsultantApplication $application): array
    {
        return [
            'id' => $application->id,
            'name' => $application->name,
            'department' => $application->department,
            'status' => $application->status,
            'avatar' => $application->avatar,
            'documents' => $application->documents ?? [
                'cv' => '#',
                'id' => '#',
            ],
        ];
    }
}

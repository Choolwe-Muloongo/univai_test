<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Intake;
use App\Models\Program;
use App\Support\AuditLogger;
use App\Support\DeliveryModes;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class IntakesController extends Controller
{
    public function index()
    {
        return Intake::query()
            ->orderBy('start_date')
            ->get()
            ->map(fn (Intake $intake) => $this->mapIntake($intake));
    }

    public function store(Request $request)
    {
        $payload = $request->validate([
            'programId' => ['required', 'string'],
            'curriculumVersionId' => ['nullable', 'string'],
            'name' => ['required', 'string'],
            'deliveryMode' => ['required', 'string'],
            'campus' => ['nullable', 'string'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'startDate' => ['required', 'date'],
            'endDate' => ['nullable', 'date'],
            'status' => ['nullable', 'string'],
            'registrationOpensAt' => ['nullable', 'date'],
            'registrationClosesAt' => ['nullable', 'date'],
            'orientationDate' => ['nullable', 'date'],
            'classesStartDate' => ['nullable', 'date'],
            'addDropDeadline' => ['nullable', 'date'],
            'caStartsAt' => ['nullable', 'date'],
            'caEndsAt' => ['nullable', 'date'],
            'examRegistrationDeadline' => ['nullable', 'date'],
            'examStartsAt' => ['nullable', 'date'],
            'examEndsAt' => ['nullable', 'date'],
            'resultsReleaseDate' => ['nullable', 'date'],
            'progressionOpensAt' => ['nullable', 'date'],
            'calendarStatus' => ['nullable', 'string'],
        ]);

        $program = Program::find($payload['programId']);
        if (!$program) {
            return response()->json(['message' => 'Program not found'], 404);
        }

        $deliveryMode = DeliveryModes::normalize($payload['deliveryMode']);
        if (!DeliveryModes::supports($program->supported_delivery_modes, $deliveryMode)) {
            return response()->json(['message' => 'This program does not support the selected delivery mode.'], 422);
        }

        $idBase = Str::slug($payload['programId'] . '-' . $payload['name']);
        $intakeId = $idBase;
        $counter = 1;
        while (Intake::where('id', $intakeId)->exists()) {
            $counter++;
            $intakeId = "{$idBase}-{$counter}";
        }

        $intake = Intake::create([
            'id' => $intakeId,
            'program_id' => $payload['programId'],
            'curriculum_version_id' => $payload['curriculumVersionId'] ?? null,
            'name' => $payload['name'],
            'delivery_mode' => $deliveryMode,
            'campus' => $payload['campus'] ?? null,
            'capacity' => $payload['capacity'] ?? null,
            'start_date' => $payload['startDate'],
            'end_date' => $payload['endDate'] ?? null,
            'status' => $payload['status'] ?? 'open',
            'registration_opens_at' => $payload['registrationOpensAt'] ?? null,
            'registration_closes_at' => $payload['registrationClosesAt'] ?? null,
            'orientation_date' => $payload['orientationDate'] ?? null,
            'classes_start_date' => $payload['classesStartDate'] ?? null,
            'add_drop_deadline' => $payload['addDropDeadline'] ?? null,
            'ca_starts_at' => $payload['caStartsAt'] ?? null,
            'ca_ends_at' => $payload['caEndsAt'] ?? null,
            'exam_registration_deadline' => $payload['examRegistrationDeadline'] ?? null,
            'exam_starts_at' => $payload['examStartsAt'] ?? null,
            'exam_ends_at' => $payload['examEndsAt'] ?? null,
            'results_release_date' => $payload['resultsReleaseDate'] ?? null,
            'progression_opens_at' => $payload['progressionOpensAt'] ?? null,
            'calendar_status' => $payload['calendarStatus'] ?? 'draft',
        ]);

        AuditLogger::log($request, 'intake.created', 'intake', $intake->id, [
            'programId' => $intake->program_id,
            'deliveryMode' => DeliveryModes::normalize($intake->delivery_mode),
        ]);

        return response()->json($this->mapIntake($intake), 201);
    }

    public function availableForStudent(Request $request)
    {
        $user = $request->session()->get('user');
        $programId = is_array($user) ? ($user['programId'] ?? null) : null;

        $query = Intake::query()
            ->whereIn('status', ['open', 'active']);

        if ($programId) {
            $query->where('program_id', $programId);
        }

        return $query->orderBy('start_date')->get()->map(fn (Intake $intake) => $this->mapIntake($intake));
    }

    private function mapIntake(Intake $intake): array
    {
        return [
            'id' => $intake->id,
            'programId' => $intake->program_id,
            'curriculumVersionId' => $intake->curriculum_version_id,
            'name' => $intake->name,
            'deliveryMode' => DeliveryModes::normalize($intake->delivery_mode),
            'campus' => $intake->campus,
            'capacity' => $intake->capacity,
            'startDate' => optional($intake->start_date)->toDateString(),
            'endDate' => optional($intake->end_date)->toDateString(),
            'status' => $intake->status,
            'calendarStatus' => $intake->calendar_status ?? 'draft',
            'registrationOpensAt' => optional($intake->registration_opens_at)->toDateString(),
            'registrationClosesAt' => optional($intake->registration_closes_at)->toDateString(),
            'orientationDate' => optional($intake->orientation_date)->toDateString(),
            'classesStartDate' => optional($intake->classes_start_date)->toDateString(),
            'addDropDeadline' => optional($intake->add_drop_deadline)->toDateString(),
            'caStartsAt' => optional($intake->ca_starts_at)->toDateString(),
            'caEndsAt' => optional($intake->ca_ends_at)->toDateString(),
            'examRegistrationDeadline' => optional($intake->exam_registration_deadline)->toDateString(),
            'examStartsAt' => optional($intake->exam_starts_at)->toDateString(),
            'examEndsAt' => optional($intake->exam_ends_at)->toDateString(),
            'resultsReleaseDate' => optional($intake->results_release_date)->toDateString(),
            'progressionOpensAt' => optional($intake->progression_opens_at)->toDateString(),
        ];
    }
}

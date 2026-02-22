<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseLecturerAssignment;
use App\Models\Intake;
use App\Models\ProgramModule;
use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Http\Request;

class AdminAssignmentsController extends Controller
{
    public function index()
    {
        $assignments = CourseLecturerAssignment::with(['course', 'lecturer', 'intake', 'module'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (CourseLecturerAssignment $assignment) => [
                'id' => $assignment->id,
                'courseId' => $assignment->course_id,
                'courseTitle' => $assignment->course?->title,
                'moduleId' => $assignment->module_id,
                'moduleTitle' => $assignment->module?->title,
                'moduleSemester' => $assignment->module?->semester,
                'programId' => $assignment->module?->program_id,
                'lecturerId' => $assignment->lecturer_id,
                'lecturerName' => $assignment->lecturer?->name,
                'intakeId' => $assignment->intake_id,
                'intakeName' => $assignment->intake?->name,
                'role' => $assignment->role,
                'meetingProvider' => $assignment->meeting_provider,
                'meetingUrl' => $assignment->meeting_url,
            ]);

        $lecturers = User::query()
            ->where('role', 'lecturer')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]);

        $courses = Course::query()
            ->orderBy('title')
            ->get()
            ->map(fn (Course $course) => [
                'id' => $course->id,
                'title' => $course->title,
                'schoolId' => $course->school_id,
            ]);

        $modules = ProgramModule::query()
            ->orderBy('semester')
            ->orderBy('title')
            ->get()
            ->map(fn (ProgramModule $module) => [
                'id' => $module->id,
                'programId' => $module->program_id,
                'title' => $module->title,
                'semester' => $module->semester,
            ]);

        $intakes = Intake::query()
            ->orderBy('start_date')
            ->get()
            ->map(fn (Intake $intake) => [
                'id' => $intake->id,
                'programId' => $intake->program_id,
                'name' => $intake->name,
                'deliveryMode' => $intake->delivery_mode,
                'campus' => $intake->campus,
                'capacity' => $intake->capacity,
                'startDate' => optional($intake->start_date)->toDateString(),
                'status' => $intake->status,
            ]);

        return response()->json([
            'assignments' => $assignments,
            'lecturers' => $lecturers,
            'courses' => $courses,
            'modules' => $modules,
            'intakes' => $intakes,
        ]);
    }

    public function store(Request $request)
    {
        $payload = $request->validate([
            'courseId' => ['required', 'string'],
            'moduleId' => ['nullable', 'string'],
            'lecturerId' => ['required', 'string'],
            'intakeId' => ['nullable', 'string'],
            'role' => ['nullable', 'string'],
        ]);

        $assignedBy = $request->session()->get('user')['id'] ?? null;
        $assignedBy = is_numeric($assignedBy) ? (int) $assignedBy : null;

        $assignment = CourseLecturerAssignment::create([
            'course_id' => $payload['courseId'],
            'module_id' => $payload['moduleId'] ?? null,
            'lecturer_id' => $payload['lecturerId'],
            'intake_id' => $payload['intakeId'] ?? null,
            'role' => $payload['role'] ?? 'lead',
            'assigned_by' => $assignedBy,
        ]);

        $assignment->load(['course', 'lecturer', 'intake', 'module']);

        AuditLogger::log($request, 'assignment.created', 'course_lecturer_assignment', (string) $assignment->id, [
            'courseId' => $assignment->course_id,
            'lecturerId' => $assignment->lecturer_id,
            'intakeId' => $assignment->intake_id,
        ]);

        return response()->json([
            'id' => $assignment->id,
            'courseId' => $assignment->course_id,
            'courseTitle' => $assignment->course?->title,
            'moduleId' => $assignment->module_id,
            'moduleTitle' => $assignment->module?->title,
            'moduleSemester' => $assignment->module?->semester,
            'programId' => $assignment->module?->program_id,
            'lecturerId' => $assignment->lecturer_id,
            'lecturerName' => $assignment->lecturer?->name,
            'intakeId' => $assignment->intake_id,
            'intakeName' => $assignment->intake?->name,
            'role' => $assignment->role,
            'meetingProvider' => $assignment->meeting_provider,
            'meetingUrl' => $assignment->meeting_url,
        ], 201);
    }
}

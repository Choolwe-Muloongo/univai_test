<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseLecturerAssignment;
use App\Support\AuditLogger;
use Illuminate\Http\Request;

class LecturerAssignmentsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->session()->get('user');
        $lecturerId = $user['id'] ?? null;

        if (!$lecturerId) {
            return response()->json([]);
        }

        return CourseLecturerAssignment::with(['course', 'intake', 'module'])
            ->where('lecturer_id', $lecturerId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (CourseLecturerAssignment $assignment) => [
                'id' => $assignment->id,
                'courseId' => $assignment->course_id,
                'courseTitle' => $assignment->course?->title,
                'courseDescription' => $assignment->course?->description,
                'moduleId' => $assignment->module_id,
                'moduleTitle' => $assignment->module?->title,
                'moduleSemester' => $assignment->module?->semester,
                'programId' => $assignment->module?->program_id,
                'intakeId' => $assignment->intake_id,
                'intakeName' => $assignment->intake?->name,
                'deliveryMode' => $assignment->intake?->delivery_mode,
                'campus' => $assignment->intake?->campus,
                'role' => $assignment->role,
                'meetingProvider' => $assignment->meeting_provider,
                'meetingUrl' => $assignment->meeting_url,
                'meetingSchedule' => $assignment->meeting_schedule,
                'meetingNotes' => $assignment->meeting_notes,
            ]);
    }

    public function updateMeeting(Request $request, CourseLecturerAssignment $assignment)
    {
        $user = $request->session()->get('user');
        $lecturerId = $user['id'] ?? null;

        if (!$lecturerId || (string) $assignment->lecturer_id !== (string) $lecturerId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payload = $request->validate([
            'meetingProvider' => ['nullable', 'string'],
            'meetingUrl' => ['nullable', 'string'],
            'meetingSchedule' => ['nullable', 'array'],
            'meetingNotes' => ['nullable', 'string'],
        ]);

        $assignment->update([
            'meeting_provider' => $payload['meetingProvider'] ?? $assignment->meeting_provider,
            'meeting_url' => $payload['meetingUrl'] ?? $assignment->meeting_url,
            'meeting_schedule' => array_key_exists('meetingSchedule', $payload)
                ? $payload['meetingSchedule']
                : $assignment->meeting_schedule,
            'meeting_notes' => $payload['meetingNotes'] ?? $assignment->meeting_notes,
        ]);

        $assignment->load(['course', 'intake', 'module']);

        AuditLogger::log($request, 'assignment.meeting_updated', 'course_lecturer_assignment', (string) $assignment->id, [
            'meetingProvider' => $assignment->meeting_provider,
        ]);

        return [
            'id' => $assignment->id,
            'courseId' => $assignment->course_id,
            'courseTitle' => $assignment->course?->title,
            'courseDescription' => $assignment->course?->description,
            'moduleId' => $assignment->module_id,
            'moduleTitle' => $assignment->module?->title,
            'moduleSemester' => $assignment->module?->semester,
            'programId' => $assignment->module?->program_id,
            'intakeId' => $assignment->intake_id,
            'intakeName' => $assignment->intake?->name,
            'deliveryMode' => $assignment->intake?->delivery_mode,
            'campus' => $assignment->intake?->campus,
            'role' => $assignment->role,
            'meetingProvider' => $assignment->meeting_provider,
            'meetingUrl' => $assignment->meeting_url,
            'meetingSchedule' => $assignment->meeting_schedule,
            'meetingNotes' => $assignment->meeting_notes,
        ];
    }
}

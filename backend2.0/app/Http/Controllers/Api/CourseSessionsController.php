<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\CourseLecturerAssignment;
use App\Models\CourseSession;
use App\Models\Enrollment;
use App\Support\AuditLogger;
use Illuminate\Http\Request;

class CourseSessionsController extends Controller
{
    public function lecturerIndex(Request $request, string $courseId)
    {
        $intakeId = $request->query('intakeId');
        $user = $request->session()->get('user');
        $lecturerId = is_array($user) ? ($user['id'] ?? null) : null;

        if (!$intakeId || !$lecturerId) {
            return [];
        }

        $authorized = CourseLecturerAssignment::query()
            ->where('course_id', $courseId)
            ->where('intake_id', $intakeId)
            ->where('lecturer_id', $lecturerId)
            ->exists();

        if (!$authorized) {
            return response()->json([], 403);
        }

        return CourseSession::query()
            ->where('course_id', $courseId)
            ->where('intake_id', $intakeId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (CourseSession $session) => $this->mapSession($session));
    }

    public function lecturerStore(Request $request, string $courseId)
    {
        $payload = $request->validate([
            'intakeId' => ['required', 'string'],
            'title' => ['required', 'string'],
            'sessionType' => ['nullable', 'string'],
            'dayOfWeek' => ['nullable', 'string'],
            'startTime' => ['nullable', 'string'],
            'endTime' => ['nullable', 'string'],
            'location' => ['nullable', 'string'],
            'meetingUrl' => ['nullable', 'string'],
        ]);

        $user = $request->session()->get('user');
        $lecturerId = is_array($user) ? ($user['id'] ?? null) : null;

        if (!$lecturerId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $authorized = CourseLecturerAssignment::query()
            ->where('course_id', $courseId)
            ->where('intake_id', $payload['intakeId'])
            ->where('lecturer_id', $lecturerId)
            ->exists();

        if (!$authorized) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $session = CourseSession::create([
            'course_id' => $courseId,
            'intake_id' => $payload['intakeId'],
            'title' => $payload['title'],
            'session_type' => $payload['sessionType'] ?? 'lecture',
            'day_of_week' => $payload['dayOfWeek'] ?? null,
            'start_time' => $payload['startTime'] ?? null,
            'end_time' => $payload['endTime'] ?? null,
            'location' => $payload['location'] ?? null,
            'meeting_url' => $payload['meetingUrl'] ?? null,
            'created_by' => is_numeric($lecturerId) ? (int) $lecturerId : null,
        ]);

        AuditLogger::log($request, 'session.created', 'course_session', (string) $session->id, [
            'courseId' => $courseId,
            'intakeId' => $payload['intakeId'],
        ]);

        return response()->json($this->mapSession($session), 201);
    }

    public function roster(Request $request, CourseSession $session)
    {
        $user = $request->session()->get('user');
        $lecturerId = is_array($user) ? ($user['id'] ?? null) : null;

        if (!$lecturerId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $authorized = CourseLecturerAssignment::query()
            ->where('course_id', $session->course_id)
            ->where('intake_id', $session->intake_id)
            ->where('lecturer_id', $lecturerId)
            ->exists();

        if (!$authorized) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return Enrollment::with('user')
            ->where('intake_id', $session->intake_id)
            ->get()
            ->map(fn (Enrollment $enrollment) => [
                'id' => $enrollment->user_id,
                'name' => $enrollment->user?->name,
                'email' => $enrollment->user?->email,
            ]);
    }

    public function markAttendance(Request $request, CourseSession $session)
    {
        $payload = $request->validate([
            'records' => ['required', 'array'],
            'records.*.studentId' => ['required'],
            'records.*.status' => ['required', 'string'],
        ]);

        $user = $request->session()->get('user');
        $lecturerId = is_array($user) ? ($user['id'] ?? null) : null;

        if (!$lecturerId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $authorized = CourseLecturerAssignment::query()
            ->where('course_id', $session->course_id)
            ->where('intake_id', $session->intake_id)
            ->where('lecturer_id', $lecturerId)
            ->exists();

        if (!$authorized) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        foreach ($payload['records'] as $record) {
            AttendanceRecord::updateOrCreate(
                [
                    'session_id' => $session->id,
                    'student_id' => $record['studentId'],
                ],
                [
                    'status' => $record['status'],
                    'recorded_by' => is_numeric($lecturerId) ? (int) $lecturerId : null,
                    'recorded_at' => now(),
                ]
            );
        }

        AuditLogger::log($request, 'attendance.marked', 'course_session', (string) $session->id, [
            'count' => count($payload['records']),
        ]);

        return response()->json(['status' => 'ok']);
    }

    public function studentTimetable(Request $request)
    {
        $user = $request->session()->get('user');
        $studentId = is_array($user) ? ($user['id'] ?? null) : null;
        $intakeId = is_array($user) ? ($user['intakeId'] ?? null) : null;

        if (!$intakeId) {
            return [];
        }

        $sessions = CourseSession::with('course')
            ->where('intake_id', $intakeId)
            ->orderBy('created_at', 'desc')
            ->get();

        $attendance = [];
        if ($studentId && is_numeric($studentId)) {
            $attendance = AttendanceRecord::query()
                ->where('student_id', $studentId)
                ->whereIn('session_id', $sessions->pluck('id'))
                ->get()
                ->keyBy('session_id');
        }

        return $sessions->map(function (CourseSession $session) use ($attendance) {
            $record = $attendance[$session->id] ?? null;
            return [
                'id' => $session->id,
                'courseId' => $session->course_id,
                'courseTitle' => $session->course?->title,
                'title' => $session->title,
                'sessionType' => $session->session_type,
                'dayOfWeek' => $session->day_of_week,
                'startTime' => $session->start_time?->format('H:i'),
                'endTime' => $session->end_time?->format('H:i'),
                'location' => $session->location,
                'meetingUrl' => $session->meeting_url,
                'status' => $record?->status,
            ];
        });
    }

    private function mapSession(CourseSession $session): array
    {
        return [
            'id' => $session->id,
            'courseId' => $session->course_id,
            'intakeId' => $session->intake_id,
            'title' => $session->title,
            'sessionType' => $session->session_type,
            'dayOfWeek' => $session->day_of_week,
            'startTime' => $session->start_time?->format('H:i'),
            'endTime' => $session->end_time?->format('H:i'),
            'location' => $session->location,
            'meetingUrl' => $session->meeting_url,
        ];
    }
}

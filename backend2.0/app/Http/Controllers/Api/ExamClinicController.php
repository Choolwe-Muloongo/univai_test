<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExamAttendanceRecord;
use App\Models\ExamBooking;
use App\Models\ExamCentre;
use App\Models\ExamIncident;
use App\Models\ExamInvigilator;
use App\Models\ExamResultsSyncLog;
use App\Models\ExamRoom;
use App\Models\ExamSession;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ExamClinicController extends Controller
{
    public function adminOverview()
    {
        return response()->json([
            'centres' => ExamCentre::query()->withCount(['rooms', 'sessions'])->latest()->get()->map(fn (ExamCentre $centre) => $this->centrePayload($centre)),
            'rooms' => ExamRoom::query()->with('centre')->latest()->get()->map(fn (ExamRoom $room) => $this->roomPayload($room)),
            'invigilators' => ExamInvigilator::query()->latest()->get()->map(fn (ExamInvigilator $invigilator) => $this->invigilatorPayload($invigilator)),
            'sessions' => ExamSession::query()->with(['centre', 'room', 'invigilator'])->withCount(['bookings', 'incidents'])->orderBy('starts_at')->get()->map(fn (ExamSession $session) => $this->sessionPayload($session)),
            'bookings' => ExamBooking::query()->with(['session.centre', 'attendance'])->latest()->limit(100)->get()->map(fn (ExamBooking $booking) => $this->bookingPayload($booking)),
            'incidents' => ExamIncident::query()->with(['session', 'booking'])->latest()->limit(100)->get()->map(fn (ExamIncident $incident) => $this->incidentPayload($incident)),
            'resultsSync' => ExamResultsSyncLog::query()->with('session')->latest()->limit(20)->get()->map(fn (ExamResultsSyncLog $log) => $this->syncPayload($log)),
        ]);
    }

    public function storeCentre(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string'],
            'code' => ['nullable', 'string', 'unique:exam_centres,code'],
            'location' => ['required', 'string'],
            'timezone' => ['nullable', 'string'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'approvalStatus' => ['nullable', 'string'],
            'approvalNotes' => ['nullable', 'string'],
        ]);

        $centre = ExamCentre::create([
            'name' => $payload['name'],
            'code' => $payload['code'] ?? Str::upper(Str::slug($payload['name'], '-')),
            'location' => $payload['location'],
            'timezone' => $payload['timezone'] ?? 'UTC',
            'capacity' => $payload['capacity'] ?? 1,
            'approval_status' => $payload['approvalStatus'] ?? 'pending',
            'approval_notes' => $payload['approvalNotes'] ?? null,
        ]);

        return response()->json($this->centrePayload($centre), 201);
    }

    public function updateCentreApproval(Request $request, ExamCentre $centre)
    {
        $payload = $request->validate([
            'approvalStatus' => ['required', Rule::in(['pending', 'approved', 'rejected', 'suspended'])],
            'approvalNotes' => ['nullable', 'string'],
        ]);
        $user = $request->session()->get('user');

        $centre->update([
            'approval_status' => $payload['approvalStatus'],
            'approval_notes' => $payload['approvalNotes'] ?? $centre->approval_notes,
            'approved_at' => $payload['approvalStatus'] === 'approved' ? now() : null,
            'approved_by' => $payload['approvalStatus'] === 'approved' ? (string) ($user['id'] ?? 'admin') : null,
        ]);

        return response()->json($this->centrePayload($centre));
    }

    public function storeRoom(Request $request)
    {
        $payload = $request->validate([
            'centreId' => ['required', 'exists:exam_centres,id'],
            'name' => ['required', 'string'],
            'code' => ['nullable', 'string'],
            'capacity' => ['required', 'integer', 'min:1'],
            'accessibilityNotes' => ['nullable', 'string'],
            'equipment' => ['nullable', 'array'],
            'status' => ['nullable', 'string'],
        ]);

        $room = ExamRoom::create([
            'exam_centre_id' => $payload['centreId'],
            'name' => $payload['name'],
            'code' => $payload['code'] ?? null,
            'capacity' => $payload['capacity'],
            'accessibility_notes' => $payload['accessibilityNotes'] ?? null,
            'equipment' => $payload['equipment'] ?? [],
            'status' => $payload['status'] ?? 'active',
        ]);

        return response()->json($this->roomPayload($room->load('centre')), 201);
    }

    public function storeInvigilator(Request $request)
    {
        $payload = $request->validate([
            'userId' => ['nullable', 'string'],
            'name' => ['required', 'string'],
            'email' => ['required', 'email'],
            'phone' => ['nullable', 'string'],
            'certifications' => ['nullable', 'array'],
            'status' => ['nullable', 'string'],
        ]);

        $invigilator = ExamInvigilator::create([
            'user_id' => $payload['userId'] ?? null,
            'name' => $payload['name'],
            'email' => $payload['email'],
            'phone' => $payload['phone'] ?? null,
            'certifications' => $payload['certifications'] ?? [],
            'status' => $payload['status'] ?? 'active',
        ]);

        return response()->json($this->invigilatorPayload($invigilator), 201);
    }

    public function storeSession(Request $request)
    {
        $payload = $request->validate([
            'centreId' => ['required', 'exists:exam_centres,id'],
            'roomId' => ['nullable', 'exists:exam_rooms,id'],
            'invigilatorId' => ['nullable', 'exists:exam_invigilators,id'],
            'examId' => ['required', 'string'],
            'title' => ['required', 'string'],
            'programId' => ['nullable', 'string'],
            'moduleId' => ['nullable', 'string'],
            'courseId' => ['nullable', 'string'],
            'deliveryMode' => ['required', Rule::in(['physical', 'hybrid'])],
            'startsAt' => ['required', 'date'],
            'endsAt' => ['required', 'date', 'after:startsAt'],
            'capacity' => ['required', 'integer', 'min:1'],
            'status' => ['nullable', 'string'],
            'rules' => ['nullable', 'array'],
        ]);

        $session = ExamSession::create([
            'exam_centre_id' => $payload['centreId'],
            'exam_room_id' => $payload['roomId'] ?? null,
            'exam_invigilator_id' => $payload['invigilatorId'] ?? null,
            'exam_id' => $payload['examId'],
            'title' => $payload['title'],
            'program_id' => $payload['programId'] ?? null,
            'module_id' => $payload['moduleId'] ?? null,
            'course_id' => $payload['courseId'] ?? null,
            'delivery_mode' => $payload['deliveryMode'],
            'starts_at' => $payload['startsAt'],
            'ends_at' => $payload['endsAt'],
            'capacity' => $payload['capacity'],
            'status' => $payload['status'] ?? 'draft',
            'rules' => $payload['rules'] ?? [],
        ]);

        return response()->json($this->sessionPayload($session->load(['centre', 'room', 'invigilator'])->loadCount(['bookings', 'incidents'])), 201);
    }

    public function updateSession(Request $request, ExamSession $session)
    {
        $payload = $request->validate([
            'status' => ['nullable', Rule::in(['draft', 'approved', 'open', 'closed', 'cancelled'])],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'invigilatorId' => ['nullable', 'exists:exam_invigilators,id'],
        ]);

        $session->update([
            'status' => $payload['status'] ?? $session->status,
            'capacity' => $payload['capacity'] ?? $session->capacity,
            'exam_invigilator_id' => $payload['invigilatorId'] ?? $session->exam_invigilator_id,
        ]);

        return response()->json($this->sessionPayload($session->load(['centre', 'room', 'invigilator'])->loadCount(['bookings', 'incidents'])));
    }

    public function studentSessions(Request $request)
    {
        $user = $request->session()->get('user');
        $programId = is_array($user) ? ($user['programId'] ?? null) : null;

        $query = ExamSession::query()
            ->with(['centre', 'room', 'invigilator'])
            ->withCount(['bookings', 'incidents'])
            ->whereIn('status', ['approved', 'open'])
            ->whereIn('delivery_mode', ['physical', 'hybrid'])
            ->whereHas('centre', fn ($centre) => $centre->where('approval_status', 'approved'))
            ->where('starts_at', '>=', now()->subDay());

        if ($programId) {
            $query->where(fn ($scope) => $scope->whereNull('program_id')->orWhere('program_id', $programId));
        }

        return response()->json($query->orderBy('starts_at')->get()->map(fn (ExamSession $session) => $this->sessionPayload($session)));
    }

    public function studentBookings(Request $request)
    {
        $userId = (string) (($request->session()->get('user')['id'] ?? 'guest'));

        return response()->json(ExamBooking::query()
            ->with(['session.centre', 'session.room', 'attendance'])
            ->where('student_id', $userId)
            ->latest()
            ->get()
            ->map(fn (ExamBooking $booking) => $this->bookingPayload($booking)));
    }

    public function bookSession(Request $request)
    {
        $payload = $request->validate([
            'sessionId' => ['required', 'exists:exam_sessions,id'],
            'accommodations' => ['nullable', 'string'],
        ]);
        $user = $request->session()->get('user');
        $userId = (string) ($user['id'] ?? 'guest');
        $session = ExamSession::query()->with('centre')->withCount('bookings')->findOrFail($payload['sessionId']);

        if (!in_array($session->status, ['approved', 'open'], true) || $session->centre?->approval_status !== 'approved') {
            return response()->json(['message' => 'This session is not approved for booking.'], 422);
        }
        if ($session->bookings_count >= $session->capacity) {
            return response()->json(['message' => 'This session is at capacity.'], 422);
        }

        $booking = ExamBooking::firstOrCreate(
            ['exam_session_id' => $session->id, 'student_id' => $userId],
            [
                'student_name' => $user['name'] ?? null,
                'student_email' => $user['email'] ?? null,
                'status' => 'confirmed',
                'accommodations' => $payload['accommodations'] ?? null,
                'booked_at' => now(),
            ]
        );
        ExamAttendanceRecord::firstOrCreate(['exam_booking_id' => $booking->id], ['status' => 'scheduled']);

        return response()->json($this->bookingPayload($booking->load(['session.centre', 'session.room', 'attendance'])), 201);
    }

    public function cancelBooking(Request $request, ExamBooking $booking)
    {
        $userId = (string) (($request->session()->get('user')['id'] ?? 'guest'));
        abort_unless((string) $booking->student_id === $userId, 403);
        $booking->update(['status' => 'cancelled']);

        return response()->json($this->bookingPayload($booking->load(['session.centre', 'session.room', 'attendance'])));
    }

    public function markAttendance(Request $request, ExamBooking $booking)
    {
        $payload = $request->validate([
            'status' => ['required', Rule::in(['scheduled', 'checked_in', 'present', 'absent', 'late', 'excused', 'completed'])],
            'notes' => ['nullable', 'string'],
        ]);
        $user = $request->session()->get('user');

        $attendance = ExamAttendanceRecord::updateOrCreate(
            ['exam_booking_id' => $booking->id],
            [
                'status' => $payload['status'],
                'checked_in_at' => in_array($payload['status'], ['checked_in', 'present', 'late', 'completed'], true) ? now() : null,
                'verified_by' => (string) ($user['id'] ?? 'admin'),
                'notes' => $payload['notes'] ?? null,
            ]
        );

        return response()->json($this->bookingPayload($booking->load(['session.centre', 'session.room', 'attendance'])));
    }

    public function storeIncident(Request $request, ExamSession $session)
    {
        $payload = $request->validate([
            'bookingId' => ['nullable', 'exists:exam_bookings,id'],
            'severity' => ['required', Rule::in(['low', 'medium', 'high', 'critical'])],
            'category' => ['required', 'string'],
            'description' => ['required', 'string'],
            'status' => ['nullable', 'string'],
            'actions' => ['nullable', 'array'],
        ]);
        $user = $request->session()->get('user');

        $incident = ExamIncident::create([
            'exam_session_id' => $session->id,
            'exam_booking_id' => $payload['bookingId'] ?? null,
            'severity' => $payload['severity'],
            'category' => $payload['category'],
            'description' => $payload['description'],
            'status' => $payload['status'] ?? 'open',
            'reported_by' => (string) ($user['id'] ?? 'admin'),
            'actions' => $payload['actions'] ?? [],
        ]);

        return response()->json($this->incidentPayload($incident->load(['session', 'booking'])), 201);
    }

    public function syncResults(Request $request)
    {
        $payload = $request->validate([
            'sessionId' => ['nullable', 'exists:exam_sessions,id'],
            'recordsSynced' => ['nullable', 'integer', 'min:0'],
            'message' => ['nullable', 'string'],
        ]);
        $user = $request->session()->get('user');

        $log = ExamResultsSyncLog::create([
            'exam_session_id' => $payload['sessionId'] ?? null,
            'status' => 'synced',
            'records_synced' => $payload['recordsSynced'] ?? 0,
            'message' => $payload['message'] ?? 'Manual results sync completed.',
            'synced_at' => now(),
            'triggered_by' => (string) ($user['id'] ?? 'admin'),
        ]);

        return response()->json($this->syncPayload($log->load('session')), 201);
    }

    private function centrePayload(ExamCentre $centre): array
    {
        return [
            'id' => $centre->id,
            'name' => $centre->name,
            'code' => $centre->code,
            'location' => $centre->location,
            'timezone' => $centre->timezone,
            'capacity' => $centre->capacity,
            'approvalStatus' => $centre->approval_status,
            'approvalNotes' => $centre->approval_notes,
            'approvedAt' => optional($centre->approved_at)->toISOString(),
            'roomsCount' => $centre->rooms_count ?? null,
            'sessionsCount' => $centre->sessions_count ?? null,
        ];
    }

    private function roomPayload(ExamRoom $room): array
    {
        return ['id' => $room->id, 'centreId' => $room->exam_centre_id, 'centreName' => $room->centre?->name, 'name' => $room->name, 'code' => $room->code, 'capacity' => $room->capacity, 'accessibilityNotes' => $room->accessibility_notes, 'equipment' => $room->equipment ?? [], 'status' => $room->status];
    }

    private function invigilatorPayload(ExamInvigilator $invigilator): array
    {
        return ['id' => $invigilator->id, 'userId' => $invigilator->user_id, 'name' => $invigilator->name, 'email' => $invigilator->email, 'phone' => $invigilator->phone, 'certifications' => $invigilator->certifications ?? [], 'status' => $invigilator->status];
    }

    private function sessionPayload(ExamSession $session): array
    {
        return ['id' => $session->id, 'centreId' => $session->exam_centre_id, 'centreName' => $session->centre?->name, 'roomId' => $session->exam_room_id, 'roomName' => $session->room?->name, 'invigilatorId' => $session->exam_invigilator_id, 'invigilatorName' => $session->invigilator?->name, 'examId' => $session->exam_id, 'title' => $session->title, 'programId' => $session->program_id, 'moduleId' => $session->module_id, 'courseId' => $session->course_id, 'deliveryMode' => $session->delivery_mode, 'startsAt' => optional($session->starts_at)->toISOString(), 'endsAt' => optional($session->ends_at)->toISOString(), 'capacity' => $session->capacity, 'bookingsCount' => $session->bookings_count ?? $session->bookings()->count(), 'incidentsCount' => $session->incidents_count ?? null, 'status' => $session->status, 'rules' => $session->rules ?? []];
    }

    private function bookingPayload(ExamBooking $booking): array
    {
        return ['id' => $booking->id, 'sessionId' => $booking->exam_session_id, 'studentId' => $booking->student_id, 'studentName' => $booking->student_name, 'studentEmail' => $booking->student_email, 'status' => $booking->status, 'accommodations' => $booking->accommodations, 'bookedAt' => optional($booking->booked_at)->toISOString(), 'session' => $booking->session ? $this->sessionPayload($booking->session) : null, 'attendance' => $booking->attendance ? ['id' => $booking->attendance->id, 'status' => $booking->attendance->status, 'checkedInAt' => optional($booking->attendance->checked_in_at)->toISOString(), 'checkedOutAt' => optional($booking->attendance->checked_out_at)->toISOString(), 'notes' => $booking->attendance->notes] : null];
    }

    private function incidentPayload(ExamIncident $incident): array
    {
        return ['id' => $incident->id, 'sessionId' => $incident->exam_session_id, 'bookingId' => $incident->exam_booking_id, 'severity' => $incident->severity, 'category' => $incident->category, 'description' => $incident->description, 'status' => $incident->status, 'reportedBy' => $incident->reported_by, 'actions' => $incident->actions ?? [], 'createdAt' => optional($incident->created_at)->toISOString(), 'sessionTitle' => $incident->session?->title];
    }

    private function syncPayload(ExamResultsSyncLog $log): array
    {
        return ['id' => $log->id, 'sessionId' => $log->exam_session_id, 'sessionTitle' => $log->session?->title, 'status' => $log->status, 'recordsSynced' => $log->records_synced, 'message' => $log->message, 'syncedAt' => optional($log->synced_at)->toISOString(), 'triggeredBy' => $log->triggered_by];
    }
}

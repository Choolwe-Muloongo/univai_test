<?php

namespace App\Support\Academics;

use App\Models\CourseSession;
use App\Models\Enrollment;
use App\Models\Intake;
use App\Models\User;
use App\Support\DeliveryModes;
use App\Support\Finance\FormalFinancialClearance;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

class StudentAcademicGate
{
    public function __construct(private readonly FormalFinancialClearance $clearance)
    {
    }

    public function forStudent(User $student, ?string $intakeId = null): array
    {
        $enrollment = Enrollment::query()
            ->with('intake.program')
            ->when($intakeId, fn ($query) => $query->where('intake_id', $intakeId))
            ->where('user_id', $student->id)
            ->latest('created_at')
            ->first();

        if (!$enrollment) {
            return $this->emptyGate('admissions_pending', 'No programme enrollment exists yet. Finish admissions first.');
        }

        $intake = $enrollment->intake;
        if (!$intake) {
            return $this->emptyGate('enrollment_pending', 'Your enrollment has no intake assigned yet.');
        }

        $today = now()->startOfDay();
        $calendar = $this->calendarFor($intake);
        $finance = $this->clearance->forStudentIntake($student->id, $intake->id);
        $deliveryMode = DeliveryModes::normalize($enrollment->delivery_mode ?: $intake->delivery_mode);
        $modulesSelected = count($enrollment->selected_modules ?? []) > 0;
        $enrollmentActive = $enrollment->status === 'active' && !empty($enrollment->confirmed_at);
        $registrationCleared = (bool) data_get($finance, 'registrationClearance.cleared');
        $examCleared = (bool) data_get($finance, 'examClearance.cleared');
        $resultsCleared = (bool) data_get($finance, 'resultsClearance.cleared');
        $progressionCleared = (bool) data_get($finance, 'progressionClearance.cleared');

        $stage = $this->stage($today, $calendar, $enrollmentActive, $registrationCleared, $modulesSelected);
        $locks = [];
        $reasons = [];

        $canViewDashboard = $enrollmentActive;
        $canRegisterModules = $registrationCleared && $this->between($today, $calendar['registrationOpensAt'], $calendar['registrationClosesAt']);
        $canViewCalendar = $enrollmentActive || $registrationCleared;
        $canViewTimetable = $enrollmentActive && $modulesSelected;
        $canViewModules = $enrollmentActive && $modulesSelected;
        $canOpenLessons = $canViewModules && $this->onOrAfter($today, $calendar['classesStartDate']) && $this->beforeOrOn($today, $calendar['examEndsAt'] ?? $calendar['endDate']);
        $canJoinLiveClass = $canOpenLessons && in_array($deliveryMode, [DeliveryModes::ONLINE, DeliveryModes::HYBRID], true);
        $canUsePhysicalVenue = $canOpenLessons && in_array($deliveryMode, [DeliveryModes::PHYSICAL, DeliveryModes::HYBRID], true);
        $canSubmitAssignment = $canOpenLessons && $this->between($today, $calendar['caStartsAt'], $calendar['caEndsAt']);
        $canWriteTest = $canSubmitAssignment;
        $canWriteExam = $enrollmentActive && $modulesSelected && $examCleared && $this->between($today, $calendar['examStartsAt'], $calendar['examEndsAt']);
        $canViewResults = $enrollmentActive && $resultsCleared && $this->onOrAfter($today, $calendar['resultsReleaseDate']);
        $canProgress = $enrollmentActive && $progressionCleared && $this->onOrAfter($today, $calendar['progressionOpensAt']);

        $this->lockIf(!$enrollmentActive, 'dashboard', 'Enrollment is not fully confirmed yet.', $locks, $reasons);
        $this->lockIf(!$registrationCleared, 'moduleRegistration', data_get($finance, 'registrationClearance.message') ?: 'Minimum registration deposit must be cleared before module registration.', $locks, $reasons);
        $this->lockIf($registrationCleared && !$this->between($today, $calendar['registrationOpensAt'], $calendar['registrationClosesAt']), 'moduleRegistration', 'Module registration is outside the active registration window.', $locks, $reasons);
        $this->lockIf(!$modulesSelected, 'modules', 'Select and confirm semester modules first.', $locks, $reasons);
        $this->lockIf($modulesSelected && !$this->onOrAfter($today, $calendar['classesStartDate']), 'lessons', 'Classes have not started yet.', $locks, $reasons);
        $this->lockIf($canViewModules && !$this->between($today, $calendar['caStartsAt'], $calendar['caEndsAt']), 'assignments', 'Continuous assessment window is not currently open.', $locks, $reasons);
        $this->lockIf(!$examCleared, 'exams', data_get($finance, 'examClearance.message') ?: 'Exam financial clearance is not complete.', $locks, $reasons);
        $this->lockIf($examCleared && !$this->between($today, $calendar['examStartsAt'], $calendar['examEndsAt']), 'exams', 'Exam period is not currently open.', $locks, $reasons);
        $this->lockIf(!$this->onOrAfter($today, $calendar['resultsReleaseDate']), 'results', 'Results have not been released yet.', $locks, $reasons);
        $this->lockIf($this->onOrAfter($today, $calendar['resultsReleaseDate']) && !$resultsCleared, 'results', data_get($finance, 'resultsClearance.message') ?: 'Results are held until financial clearance is complete.', $locks, $reasons);
        $this->lockIf(!$this->onOrAfter($today, $calendar['progressionOpensAt']), 'progression', 'Progression is not open yet.', $locks, $reasons);
        $this->lockIf($this->onOrAfter($today, $calendar['progressionOpensAt']) && !$progressionCleared, 'progression', data_get($finance, 'progressionClearance.message') ?: 'Progression clearance is incomplete.', $locks, $reasons);

        return [
            'academicStatus' => $stage,
            'today' => $today->toDateString(),
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'programId' => $student->program_id,
            ],
            'enrollment' => [
                'status' => $enrollment->status,
                'standing' => $enrollment->standing,
                'confirmedAt' => optional($enrollment->confirmed_at)->toISOString(),
                'selectedModules' => $enrollment->selected_modules ?? [],
                'modulesSelected' => $modulesSelected,
            ],
            'intake' => [
                'id' => $intake->id,
                'name' => $intake->name,
                'programId' => $intake->program_id,
                'programTitle' => $intake->program?->title,
                'deliveryMode' => $deliveryMode,
                'campus' => $intake->campus,
                'calendarStatus' => $intake->calendar_status ?? 'draft',
            ],
            'calendar' => $this->mapCalendar($calendar),
            'deliveryRules' => $this->deliveryRules($deliveryMode),
            'permissions' => [
                'canViewDashboard' => $canViewDashboard,
                'canRegisterModules' => $canRegisterModules,
                'canViewCalendar' => $canViewCalendar,
                'canViewTimetable' => $canViewTimetable,
                'canViewModules' => $canViewModules,
                'canOpenLessons' => $canOpenLessons,
                'canJoinLiveClass' => $canJoinLiveClass,
                'canUsePhysicalVenue' => $canUsePhysicalVenue,
                'canSubmitAssignment' => $canSubmitAssignment,
                'canWriteTest' => $canWriteTest,
                'canWriteExam' => $canWriteExam,
                'canViewResults' => $canViewResults,
                'canProgress' => $canProgress,
            ],
            'locks' => $locks,
            'reasons' => $reasons,
            'finance' => $finance,
            'nextEvents' => $this->nextEvents($today, $calendar, $deliveryMode, $intake->id),
        ];
    }

    private function calendarFor(Intake $intake): array
    {
        $start = $intake->start_date ? $intake->start_date->copy()->startOfDay() : now()->startOfDay()->addDays(14);
        $end = $intake->end_date ? $intake->end_date->copy()->startOfDay() : $start->copy()->addMonths(4);
        $examStarts = $intake->exam_starts_at ? $intake->exam_starts_at->copy()->startOfDay() : $end->copy()->subWeeks(2);

        return [
            'registrationOpensAt' => $intake->registration_opens_at?->copy()->startOfDay() ?? $start->copy()->subWeeks(4),
            'registrationClosesAt' => $intake->registration_closes_at?->copy()->startOfDay() ?? $start->copy()->subDay(),
            'orientationDate' => $intake->orientation_date?->copy()->startOfDay() ?? $start->copy()->subDays(3),
            'classesStartDate' => $intake->classes_start_date?->copy()->startOfDay() ?? $start,
            'addDropDeadline' => $intake->add_drop_deadline?->copy()->startOfDay() ?? $start->copy()->addWeeks(2),
            'caStartsAt' => $intake->ca_starts_at?->copy()->startOfDay() ?? $start,
            'caEndsAt' => $intake->ca_ends_at?->copy()->startOfDay() ?? $examStarts->copy()->subDay(),
            'examRegistrationDeadline' => $intake->exam_registration_deadline?->copy()->startOfDay() ?? $examStarts->copy()->subWeek(),
            'examStartsAt' => $examStarts,
            'examEndsAt' => $intake->exam_ends_at?->copy()->startOfDay() ?? $end,
            'resultsReleaseDate' => $intake->results_release_date?->copy()->startOfDay() ?? $end->copy()->addWeeks(2),
            'progressionOpensAt' => $intake->progression_opens_at?->copy()->startOfDay() ?? $end->copy()->addWeeks(3),
            'endDate' => $end,
        ];
    }

    private function stage(CarbonInterface $today, array $calendar, bool $active, bool $registrationCleared, bool $modulesSelected): string
    {
        if (!$active) return 'enrollment_pending';
        if (!$registrationCleared) return 'finance_registration_hold';
        if (!$modulesSelected) return 'module_registration_required';
        if ($this->between($today, $calendar['registrationOpensAt'], $calendar['registrationClosesAt'])) return 'registration_open';
        if ($this->before($today, $calendar['classesStartDate'])) return 'registered_waiting_for_classes';
        if ($this->between($today, $calendar['classesStartDate'], $calendar['caEndsAt'])) return 'active_semester';
        if ($this->between($today, $calendar['examStartsAt'], $calendar['examEndsAt'])) return 'exam_period';
        if ($this->between($today, $calendar['resultsReleaseDate'], $calendar['progressionOpensAt'])) return 'results_period';
        if ($this->onOrAfter($today, $calendar['progressionOpensAt'])) return 'progression_period';
        return 'academic_hold_or_break';
    }

    private function nextEvents(CarbonInterface $today, array $calendar, string $deliveryMode, string $intakeId): array
    {
        $events = [];
        foreach ([
            'Registration opens' => $calendar['registrationOpensAt'],
            'Registration closes' => $calendar['registrationClosesAt'],
            'Orientation' => $calendar['orientationDate'],
            'Classes start' => $calendar['classesStartDate'],
            'Add/drop deadline' => $calendar['addDropDeadline'],
            'Exam registration deadline' => $calendar['examRegistrationDeadline'],
            'Exam period starts' => $calendar['examStartsAt'],
            'Results release' => $calendar['resultsReleaseDate'],
            'Progression opens' => $calendar['progressionOpensAt'],
        ] as $label => $date) {
            if ($date && $this->onOrAfter($date, $today)) {
                $events[] = ['title' => $label, 'date' => $date->toDateString(), 'type' => 'calendar'];
            }
        }

        $sessions = CourseSession::with('course')
            ->where('intake_id', $intakeId)
            ->whereIn('delivery_mode', [$deliveryMode, DeliveryModes::HYBRID])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn (CourseSession $session) => [
                'title' => $session->title,
                'courseTitle' => $session->course?->title,
                'dayOfWeek' => $session->day_of_week,
                'startTime' => $session->start_time?->format('H:i'),
                'endTime' => $session->end_time?->format('H:i'),
                'deliveryMode' => DeliveryModes::normalize($session->delivery_mode),
                'location' => $session->location,
                'meetingUrl' => $session->meeting_url,
                'type' => 'class_session',
            ])
            ->all();

        return array_slice(array_merge($events, $sessions), 0, 8);
    }

    private function deliveryRules(string $deliveryMode): array
    {
        return match ($deliveryMode) {
            DeliveryModes::ONLINE => [
                'label' => 'Online',
                'requiresMeetingLink' => true,
                'requiresVenue' => false,
                'attendanceMode' => 'online_activity_or_live_join',
                'description' => 'Online students use live links, recordings, online submissions, and digital attendance.',
            ],
            DeliveryModes::PHYSICAL => [
                'label' => 'Physical',
                'requiresMeetingLink' => false,
                'requiresVenue' => true,
                'attendanceMode' => 'venue_attendance',
                'description' => 'Physical students follow campus venues, room attendance, and physical assessment locations.',
            ],
            default => [
                'label' => 'Hybrid',
                'requiresMeetingLink' => true,
                'requiresVenue' => true,
                'attendanceMode' => 'online_and_venue_attendance',
                'description' => 'Hybrid students follow a scheduled mix of online and physical activities.',
            ],
        };
    }

    private function mapCalendar(array $calendar): array
    {
        return collect($calendar)->map(fn ($date) => $date?->toDateString())->all();
    }

    private function lockIf(bool $condition, string $key, string $reason, array &$locks, array &$reasons): void
    {
        if ($condition) {
            $locks[$key] = true;
            $reasons[$key] = $reason;
        }
    }

    private function between(CarbonInterface $date, ?CarbonInterface $start, ?CarbonInterface $end): bool
    {
        return (!$start || $date->greaterThanOrEqualTo($start)) && (!$end || $date->lessThanOrEqualTo($end));
    }

    private function before(CarbonInterface $date, ?CarbonInterface $target): bool
    {
        return $target ? $date->lessThan($target) : false;
    }

    private function onOrAfter(CarbonInterface $date, ?CarbonInterface $target): bool
    {
        return $target ? $date->greaterThanOrEqualTo($target) : true;
    }

    private function beforeOrOn(CarbonInterface $date, ?CarbonInterface $target): bool
    {
        return $target ? $date->lessThanOrEqualTo($target) : true;
    }

    private function emptyGate(string $status, string $message): array
    {
        return [
            'academicStatus' => $status,
            'message' => $message,
            'permissions' => [
                'canViewDashboard' => false,
                'canRegisterModules' => false,
                'canViewCalendar' => false,
                'canViewTimetable' => false,
                'canViewModules' => false,
                'canOpenLessons' => false,
                'canJoinLiveClass' => false,
                'canUsePhysicalVenue' => false,
                'canSubmitAssignment' => false,
                'canWriteTest' => false,
                'canWriteExam' => false,
                'canViewResults' => false,
                'canProgress' => false,
            ],
            'locks' => ['dashboard' => true],
            'reasons' => ['dashboard' => $message],
            'calendar' => [],
            'deliveryRules' => [],
            'nextEvents' => [],
        ];
    }
}

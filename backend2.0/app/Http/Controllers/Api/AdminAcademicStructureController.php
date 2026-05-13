<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\CourseUnit;
use App\Models\Department;
use App\Models\LearningModeRule;
use App\Models\PartnerInstitution;
use App\Models\PracticalSession;
use App\Models\ProgrammeCourse;
use App\Models\Semester;
use App\Models\Venue;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminAcademicStructureController extends Controller
{
    public function index()
    {
        return [
            'departments' => Department::query()
                ->with('school')
                ->orderBy('name')
                ->get()
                ->map(fn (Department $department) => $this->mapDepartment($department)),
            'academicYears' => AcademicYear::query()
                ->orderByDesc('start_date')
                ->orderBy('name')
                ->get()
                ->map(fn (AcademicYear $year) => $this->mapAcademicYear($year)),
            'semesters' => Semester::query()
                ->with('academicYear')
                ->orderByDesc('academic_year_id')
                ->orderBy('number')
                ->get()
                ->map(fn (Semester $semester) => $this->mapSemester($semester)),
            'programmeCourses' => ProgrammeCourse::query()
                ->with(['program', 'department', 'course', 'module', 'academicYear', 'semester'])
                ->latest()
                ->get()
                ->map(fn (ProgrammeCourse $course) => $this->mapProgrammeCourse($course)),
            'courseUnits' => CourseUnit::query()
                ->with(['programmeCourse.program', 'semester'])
                ->orderBy('programme_course_id')
                ->orderBy('unit_number')
                ->get()
                ->map(fn (CourseUnit $unit) => $this->mapCourseUnit($unit)),
            'learningModeRules' => LearningModeRule::query()
                ->with(['program', 'course'])
                ->latest()
                ->get()
                ->map(fn (LearningModeRule $rule) => $this->mapLearningModeRule($rule)),
            'venues' => Venue::query()
                ->orderBy('name')
                ->get()
                ->map(fn (Venue $venue) => $this->mapVenue($venue)),
            'partnerInstitutions' => PartnerInstitution::query()
                ->orderBy('name')
                ->get()
                ->map(fn (PartnerInstitution $partner) => $this->mapPartnerInstitution($partner)),
            'practicalSessions' => PracticalSession::query()
                ->with(['programmeCourse.program', 'venue', 'partnerInstitution', 'supervisor'])
                ->orderByDesc('starts_at')
                ->get()
                ->map(fn (PracticalSession $session) => $this->mapPracticalSession($session)),
        ];
    }

    public function storeDepartment(Request $request)
    {
        $payload = $request->validate([
            'schoolId' => ['required', 'string', 'exists:schools,id'],
            'name' => ['required', 'string', 'min:2'],
            'description' => ['nullable', 'string'],
            'headOfDepartmentId' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $department = Department::create([
            'school_id' => $payload['schoolId'],
            'name' => $payload['name'],
            'description' => $payload['description'] ?? null,
            'head_of_department_id' => $payload['headOfDepartmentId'] ?? null,
        ]);

        return $this->mapDepartment($department->fresh('school'));
    }

    public function storeAcademicYear(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'min:2'],
            'startDate' => ['nullable', 'date'],
            'endDate' => ['nullable', 'date', 'after_or_equal:startDate'],
            'status' => ['nullable', 'string'],
        ]);

        $year = AcademicYear::create([
            'name' => $payload['name'],
            'start_date' => $payload['startDate'] ?? null,
            'end_date' => $payload['endDate'] ?? null,
            'status' => $payload['status'] ?? 'draft',
        ]);

        return $this->mapAcademicYear($year);
    }

    public function storeSemester(Request $request)
    {
        $payload = $request->validate([
            'academicYearId' => ['required', 'integer', 'exists:academic_years,id'],
            'name' => ['required', 'string', 'min:2'],
            'number' => ['required', 'integer', 'min:1'],
            'startDate' => ['nullable', 'date'],
            'endDate' => ['nullable', 'date', 'after_or_equal:startDate'],
            'status' => ['nullable', 'string'],
        ]);

        $semester = Semester::create([
            'academic_year_id' => $payload['academicYearId'],
            'name' => $payload['name'],
            'number' => $payload['number'],
            'start_date' => $payload['startDate'] ?? null,
            'end_date' => $payload['endDate'] ?? null,
            'status' => $payload['status'] ?? 'planned',
        ]);

        return $this->mapSemester($semester->fresh('academicYear'));
    }

    public function storeProgrammeCourse(Request $request)
    {
        $payload = $request->validate([
            'programId' => ['required', 'string', 'exists:programs,id'],
            'departmentId' => ['nullable', 'integer', 'exists:departments,id'],
            'courseId' => ['nullable', 'string', 'exists:short_courses,id'],
            'moduleId' => ['nullable', 'string', 'exists:program_modules,id'],
            'academicYearId' => ['nullable', 'integer', 'exists:academic_years,id'],
            'semesterId' => ['nullable', 'integer', 'exists:semesters,id'],
            'yearLevel' => ['nullable', 'integer', 'min:1'],
            'semesterNumber' => ['nullable', 'integer', 'min:1'],
            'durationType' => ['nullable', Rule::in(['one_semester', 'full_year', 'multi_semester', 'short_intensive', 'practical_block', 'project', 'research'])],
            'deliveryMode' => ['nullable', Rule::in(['online', 'hybrid', 'physical'])],
            'isCore' => ['nullable', 'boolean'],
            'credits' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'string'],
        ]);

        $course = ProgrammeCourse::create([
            'program_id' => $payload['programId'],
            'department_id' => $payload['departmentId'] ?? null,
            'course_id' => $payload['courseId'] ?? null,
            'module_id' => $payload['moduleId'] ?? null,
            'academic_year_id' => $payload['academicYearId'] ?? null,
            'semester_id' => $payload['semesterId'] ?? null,
            'year_level' => $payload['yearLevel'] ?? 1,
            'semester_number' => $payload['semesterNumber'] ?? null,
            'duration_type' => $payload['durationType'] ?? 'one_semester',
            'delivery_mode' => $payload['deliveryMode'] ?? 'online',
            'is_core' => $payload['isCore'] ?? true,
            'credits' => $payload['credits'] ?? 0,
            'status' => $payload['status'] ?? 'draft',
        ]);

        return $this->mapProgrammeCourse($course->fresh(['program', 'department', 'course', 'module', 'academicYear', 'semester']));
    }

    public function storeCourseUnit(Request $request)
    {
        $payload = $request->validate([
            'programmeCourseId' => ['required', 'integer', 'exists:programme_courses,id'],
            'semesterId' => ['nullable', 'integer', 'exists:semesters,id'],
            'title' => ['required', 'string', 'min:2'],
            'description' => ['nullable', 'string'],
            'unitNumber' => ['nullable', 'integer', 'min:1'],
            'estimatedHours' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'string'],
        ]);

        $unit = CourseUnit::create([
            'programme_course_id' => $payload['programmeCourseId'],
            'semester_id' => $payload['semesterId'] ?? null,
            'title' => $payload['title'],
            'description' => $payload['description'] ?? null,
            'unit_number' => $payload['unitNumber'] ?? 1,
            'estimated_hours' => $payload['estimatedHours'] ?? null,
            'status' => $payload['status'] ?? 'draft',
        ]);

        return $this->mapCourseUnit($unit->fresh(['programmeCourse.program', 'semester']));
    }

    public function storeLearningModeRule(Request $request)
    {
        $payload = $request->validate([
            'programId' => ['nullable', 'string', 'exists:programs,id'],
            'courseId' => ['nullable', 'string', 'exists:short_courses,id'],
            'mode' => ['required', Rule::in(['online', 'hybrid', 'physical'])],
            'rules' => ['nullable', 'array'],
        ]);

        $rule = LearningModeRule::create([
            'program_id' => $payload['programId'] ?? null,
            'course_id' => $payload['courseId'] ?? null,
            'mode' => $payload['mode'],
            'rules' => $payload['rules'] ?? [],
        ]);

        return $this->mapLearningModeRule($rule->fresh(['program', 'course']));
    }

    public function storeVenue(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'min:2'],
            'type' => ['nullable', 'string'],
            'location' => ['nullable', 'string'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'string'],
        ]);

        $venue = Venue::create([
            'name' => $payload['name'],
            'type' => $payload['type'] ?? null,
            'location' => $payload['location'] ?? null,
            'capacity' => $payload['capacity'] ?? null,
            'status' => $payload['status'] ?? 'active',
        ]);

        return $this->mapVenue($venue);
    }

    public function storePartnerInstitution(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'min:2'],
            'type' => ['nullable', 'string'],
            'location' => ['nullable', 'string'],
            'contactPerson' => ['nullable', 'string'],
            'contactEmail' => ['nullable', 'email'],
            'status' => ['nullable', 'string'],
        ]);

        $partner = PartnerInstitution::create([
            'name' => $payload['name'],
            'type' => $payload['type'] ?? null,
            'location' => $payload['location'] ?? null,
            'contact_person' => $payload['contactPerson'] ?? null,
            'contact_email' => $payload['contactEmail'] ?? null,
            'status' => $payload['status'] ?? 'active',
        ]);

        return $this->mapPartnerInstitution($partner);
    }

    public function storePracticalSession(Request $request)
    {
        $payload = $request->validate([
            'courseOfferingId' => ['nullable', 'integer'],
            'programmeCourseId' => ['nullable', 'integer', 'exists:programme_courses,id'],
            'deliveryGroupId' => ['nullable', 'integer'],
            'title' => ['required', 'string', 'min:2'],
            'description' => ['nullable', 'string'],
            'venueId' => ['nullable', 'integer', 'exists:venues,id'],
            'partnerInstitutionId' => ['nullable', 'integer', 'exists:partner_institutions,id'],
            'startsAt' => ['nullable', 'date'],
            'endsAt' => ['nullable', 'date', 'after_or_equal:startsAt'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'supervisorId' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['nullable', 'string'],
        ]);

        $session = PracticalSession::create([
            'course_offering_id' => $payload['courseOfferingId'] ?? null,
            'programme_course_id' => $payload['programmeCourseId'] ?? null,
            'delivery_group_id' => $payload['deliveryGroupId'] ?? null,
            'title' => $payload['title'],
            'description' => $payload['description'] ?? null,
            'venue_id' => $payload['venueId'] ?? null,
            'partner_institution_id' => $payload['partnerInstitutionId'] ?? null,
            'starts_at' => $payload['startsAt'] ?? null,
            'ends_at' => $payload['endsAt'] ?? null,
            'capacity' => $payload['capacity'] ?? null,
            'supervisor_id' => $payload['supervisorId'] ?? null,
            'status' => $payload['status'] ?? 'planned',
        ]);

        return $this->mapPracticalSession($session->fresh(['programmeCourse.program', 'venue', 'partnerInstitution', 'supervisor']));
    }

    private function mapDepartment(Department $department): array
    {
        return [
            'id' => $department->id,
            'schoolId' => $department->school_id,
            'schoolName' => $department->school?->name,
            'name' => $department->name,
            'description' => $department->description,
            'headOfDepartmentId' => $department->head_of_department_id,
        ];
    }

    private function mapAcademicYear(AcademicYear $year): array
    {
        return [
            'id' => $year->id,
            'name' => $year->name,
            'startDate' => $year->start_date?->toDateString(),
            'endDate' => $year->end_date?->toDateString(),
            'status' => $year->status,
        ];
    }

    private function mapSemester(Semester $semester): array
    {
        return [
            'id' => $semester->id,
            'academicYearId' => $semester->academic_year_id,
            'academicYearName' => $semester->academicYear?->name,
            'name' => $semester->name,
            'number' => $semester->number,
            'startDate' => $semester->start_date?->toDateString(),
            'endDate' => $semester->end_date?->toDateString(),
            'status' => $semester->status,
        ];
    }

    private function mapProgrammeCourse(ProgrammeCourse $course): array
    {
        return [
            'id' => $course->id,
            'programId' => $course->program_id,
            'programTitle' => $course->program?->title,
            'departmentId' => $course->department_id,
            'departmentName' => $course->department?->name,
            'courseId' => $course->course_id,
            'courseTitle' => $course->course?->title,
            'moduleId' => $course->module_id,
            'moduleTitle' => $course->module?->title,
            'academicYearId' => $course->academic_year_id,
            'academicYearName' => $course->academicYear?->name,
            'semesterId' => $course->semester_id,
            'semesterName' => $course->semester?->name,
            'yearLevel' => $course->year_level,
            'semesterNumber' => $course->semester_number,
            'durationType' => $course->duration_type,
            'deliveryMode' => $course->delivery_mode,
            'isCore' => (bool) $course->is_core,
            'credits' => $course->credits,
            'status' => $course->status,
        ];
    }

    private function mapCourseUnit(CourseUnit $unit): array
    {
        return [
            'id' => $unit->id,
            'programmeCourseId' => $unit->programme_course_id,
            'programmeCourseTitle' => $unit->programmeCourse?->program?->title,
            'semesterId' => $unit->semester_id,
            'semesterName' => $unit->semester?->name,
            'title' => $unit->title,
            'description' => $unit->description,
            'unitNumber' => $unit->unit_number,
            'estimatedHours' => $unit->estimated_hours,
            'status' => $unit->status,
        ];
    }

    private function mapLearningModeRule(LearningModeRule $rule): array
    {
        return [
            'id' => $rule->id,
            'programId' => $rule->program_id,
            'programTitle' => $rule->program?->title,
            'courseId' => $rule->course_id,
            'courseTitle' => $rule->course?->title,
            'mode' => $rule->mode,
            'rules' => $rule->rules ?? [],
        ];
    }

    private function mapVenue(Venue $venue): array
    {
        return [
            'id' => $venue->id,
            'name' => $venue->name,
            'type' => $venue->type,
            'location' => $venue->location,
            'capacity' => $venue->capacity,
            'status' => $venue->status,
        ];
    }

    private function mapPartnerInstitution(PartnerInstitution $partner): array
    {
        return [
            'id' => $partner->id,
            'name' => $partner->name,
            'type' => $partner->type,
            'location' => $partner->location,
            'contactPerson' => $partner->contact_person,
            'contactEmail' => $partner->contact_email,
            'status' => $partner->status,
        ];
    }

    private function mapPracticalSession(PracticalSession $session): array
    {
        return [
            'id' => $session->id,
            'courseOfferingId' => $session->course_offering_id,
            'programmeCourseId' => $session->programme_course_id,
            'programmeCourseTitle' => $session->programmeCourse?->program?->title,
            'deliveryGroupId' => $session->delivery_group_id,
            'title' => $session->title,
            'description' => $session->description,
            'venueId' => $session->venue_id,
            'venueName' => $session->venue?->name,
            'partnerInstitutionId' => $session->partner_institution_id,
            'partnerInstitutionName' => $session->partnerInstitution?->name,
            'startsAt' => $session->starts_at?->toISOString(),
            'endsAt' => $session->ends_at?->toISOString(),
            'capacity' => $session->capacity,
            'supervisorId' => $session->supervisor_id,
            'supervisorName' => $session->supervisor?->name,
            'status' => $session->status,
        ];
    }
}

# UnivAI QA Checklist (Pre-Launch)

## Authentication
- Login with: admin, lecturer, employer, premium student, freemium student.
- Logout returns to `/login` and clears session.
- Unauthorized users cannot access `/admin/*`, `/lecturer/*`, `/student/*` APIs.

## Admissions
- Register a new applicant with valid fields.
- Submit admissions application, confirm status = submitted.
- Upload documents (national ID, certificate, certified results).
- Pay admissions fee and confirm status update.
- Admin opens `/admin/admissions`, reviews, sends offer with intake.
- Applicant sees offer letter, accepts offer, enrolls.

## Enrollment
- Applicant becomes `enrolled` after offer acceptance.
- Enrollment confirmation creates invoice.
- Student dashboard loads without 500 errors.

## Student Experience
- Dashboard shows program, next actions, deadlines.
- My Program shows correct delivery mode (online/physical/hybrid).
- Modules list + module detail page open lessons.
- Lesson start + focus page render without errors.
- AI Tutor responds and doesn’t error on invalid input.

## Lecturer Experience
- Lecturer dashboard loads metrics and courses.
- Lecturer courses show module + semester.
- Assignments page creates assignment with module + intake.
- Lecturer can create exam questions.
- Lecturer can record grades for module.
- Lecturer can upload and approve lesson documents.

## Admin Experience
- Admin dashboard loads metrics.
- Admin can toggle admissions open/closed.
- Admin can assign lecturers to modules + intakes.
- Admin can approve admissions and send offer.

## Employer Experience
- Employer dashboard loads.
- Employer can post jobs and research.

## API Health
- GET `/api/health` returns `{ status: "ok" }`.
- Rate limits trigger after repeated login/AI calls.

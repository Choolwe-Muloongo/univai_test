"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Building2, CalendarDays, GraduationCap, Layers, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createDepartment, createIntake, createProgram, createSchool, getPrograms, getSchools } from "@/lib/api";
import type { Program, School } from "@/lib/api/types";
import { deliveryModes } from "@/lib/delivery-modes";

const blankSchool = { name: "", description: "" };
const blankDepartment = { schoolId: "", name: "", description: "" };
const blankProgram = {
  schoolId: "",
  title: "",
  description: "",
  awardType: "diploma",
  qualificationLevel: "diploma",
  durationSemesters: "4",
  totalCredits: "120",
  applicationFee: "100",
  tuitionFee: "650",
  registrationFee: "0",
  minimumRegistrationDeposit: "250",
  examClearanceValue: "80",
};
const blankIntake = {
  programId: "",
  curriculumVersionId: "",
  name: "",
  deliveryMode: "hybrid",
  campus: "",
  capacity: "50",
  startDate: "",
  endDate: "",
  status: "open",
  registrationOpensAt: "",
  registrationClosesAt: "",
  orientationDate: "",
  classesStartDate: "",
  addDropDeadline: "",
  caStartsAt: "",
  caEndsAt: "",
  examRegistrationDeadline: "",
  examStartsAt: "",
  examEndsAt: "",
  resultsReleaseDate: "",
  progressionOpensAt: "",
  calendarStatus: "published",
};

function schoolLabel(school: School) {
  return school.name ?? (school as any).title ?? String(school.id);
}

export default function FormalProgramsAdminPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [schoolForm, setSchoolForm] = useState(blankSchool);
  const [departmentForm, setDepartmentForm] = useState(blankDepartment);
  const [programForm, setProgramForm] = useState(blankProgram);
  const [intakeForm, setIntakeForm] = useState(blankIntake);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  async function reload() {
    const [schoolData, programData] = await Promise.all([
      getSchools().catch(() => []),
      getPrograms().catch(() => []),
    ]);
    setSchools(schoolData);
    setPrograms(programData);
  }

  useEffect(() => {
    reload();
  }, []);

  async function saveSchool(event: FormEvent) {
    event.preventDefault();
    setSaving("school");
    setMessage(null);
    try {
      await createSchool({ ...schoolForm });
      setSchoolForm(blankSchool);
      setMessage("School created successfully.");
      await reload();
    } finally {
      setSaving(null);
    }
  }

  async function saveDepartment(event: FormEvent) {
    event.preventDefault();
    setSaving("department");
    setMessage(null);
    try {
      await createDepartment({ ...departmentForm });
      setDepartmentForm({ ...blankDepartment, schoolId: departmentForm.schoolId });
      setMessage("Department created successfully.");
      await reload();
    } finally {
      setSaving(null);
    }
  }

  async function saveProgram(event: FormEvent) {
    event.preventDefault();
    setSaving("program");
    setMessage(null);
    try {
      await createProgram({
        schoolId: programForm.schoolId,
        title: programForm.title,
        description: programForm.description,
        awardType: programForm.awardType,
        qualificationLevel: programForm.qualificationLevel,
        durationSemesters: Number(programForm.durationSemesters || 0),
        totalCredits: Number(programForm.totalCredits || 0),
        supportedDeliveryModes: ["software_only", "hybrid", "physical"],
        applicationFee: Number(programForm.applicationFee || 0),
        tuitionFee: Number(programForm.tuitionFee || 0),
        registrationFee: Number(programForm.registrationFee || 0),
        minimumRegistrationDepositType: "fixed",
        minimumRegistrationDeposit: Number(programForm.minimumRegistrationDeposit || 0),
        allowPartialRegistration: true,
        examClearanceType: "percentage",
        examClearanceValue: Number(programForm.examClearanceValue || 0),
        fullClearanceRequiredForResults: true,
        fullClearanceRequiredForProgression: true,
        graduationClearanceRequired: true,
      } as any);
      setProgramForm({ ...blankProgram, schoolId: programForm.schoolId });
      setMessage("Programme created successfully.");
      await reload();
    } finally {
      setSaving(null);
    }
  }

  async function saveIntake(event: FormEvent) {
    event.preventDefault();
    setSaving("intake");
    setMessage(null);
    try {
      await createIntake({
        ...intakeForm,
        curriculumVersionId: intakeForm.curriculumVersionId || null,
        campus: intakeForm.campus || null,
        capacity: Number(intakeForm.capacity || 0),
        endDate: intakeForm.endDate || null,
      } as any);
      setIntakeForm({ ...blankIntake, programId: intakeForm.programId, deliveryMode: intakeForm.deliveryMode });
      setMessage("Intake and academic calendar created successfully.");
      await reload();
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Formal programme control center</p>
        <h1 className="text-3xl font-bold tracking-tight">Schools, Departments, Programmes & Intakes</h1>
        <p className="mt-2 max-w-4xl text-muted-foreground">
          Build the formal academic structure from one place: create the school, department, programme pricing, intake, academic calendar, and then move into curriculum/content builders.
        </p>
      </div>

      {message ? <Card className="border-emerald-300 bg-emerald-50/70"><CardContent className="p-4 text-sm text-emerald-900">{message}</CardContent></Card> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><Building2 className="mb-2 h-5 w-5 text-primary" /><CardTitle>1. School</CardTitle><CardDescription>Create the academic school/faculty.</CardDescription></CardHeader></Card>
        <Card><CardHeader><Layers className="mb-2 h-5 w-5 text-primary" /><CardTitle>2. Department</CardTitle><CardDescription>Add departments under schools.</CardDescription></CardHeader></Card>
        <Card><CardHeader><GraduationCap className="mb-2 h-5 w-5 text-primary" /><CardTitle>3. Programme</CardTitle><CardDescription>Set award, fees, delivery modes, and clearance rules.</CardDescription></CardHeader></Card>
        <Card><CardHeader><CalendarDays className="mb-2 h-5 w-5 text-primary" /><CardTitle>4. Intake calendar</CardTitle><CardDescription>Control registration, classes, exams, results, and progression.</CardDescription></CardHeader></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Create School</CardTitle><CardDescription>Example: School of ICT, School of Business, School of Education.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={saveSchool} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={schoolForm.name} onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={schoolForm.description} onChange={(e) => setSchoolForm({ ...schoolForm, description: e.target.value })} /></div>
              <Button disabled={saving === "school"}>{saving === "school" ? "Saving..." : "Create school"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Create Department</CardTitle><CardDescription>Attach the department to a school.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={saveDepartment} className="space-y-4">
              <div className="space-y-2"><Label>School</Label><Select value={departmentForm.schoolId} onValueChange={(value) => setDepartmentForm({ ...departmentForm, schoolId: value })}><SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger><SelectContent>{schools.map((school) => <SelectItem key={school.id} value={String(school.id)}>{schoolLabel(school)}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Name</Label><Input value={departmentForm.name} onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={departmentForm.description} onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })} /></div>
              <Button disabled={saving === "department"}>{saving === "department" ? "Saving..." : "Create department"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Create Formal Programme</CardTitle><CardDescription>Programme rules feed admissions, fees, enrollment clearance, exams, results, and progression.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={saveProgram} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2"><Label>School</Label><Select value={programForm.schoolId} onValueChange={(value) => setProgramForm({ ...programForm, schoolId: value })}><SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger><SelectContent>{schools.map((school) => <SelectItem key={school.id} value={String(school.id)}>{schoolLabel(school)}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Programme title</Label><Input value={programForm.title} onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Award type</Label><Input value={programForm.awardType} onChange={(e) => setProgramForm({ ...programForm, awardType: e.target.value })} /></div>
            <div className="space-y-2"><Label>Qualification level</Label><Input value={programForm.qualificationLevel} onChange={(e) => setProgramForm({ ...programForm, qualificationLevel: e.target.value })} /></div>
            <div className="space-y-2"><Label>Duration semesters</Label><Input type="number" value={programForm.durationSemesters} onChange={(e) => setProgramForm({ ...programForm, durationSemesters: e.target.value })} /></div>
            <div className="space-y-2"><Label>Total credits</Label><Input type="number" value={programForm.totalCredits} onChange={(e) => setProgramForm({ ...programForm, totalCredits: e.target.value })} /></div>
            <div className="space-y-2"><Label>Application fee</Label><Input type="number" value={programForm.applicationFee} onChange={(e) => setProgramForm({ ...programForm, applicationFee: e.target.value })} /></div>
            <div className="space-y-2"><Label>Tuition fee</Label><Input type="number" value={programForm.tuitionFee} onChange={(e) => setProgramForm({ ...programForm, tuitionFee: e.target.value })} /></div>
            <div className="space-y-2"><Label>Minimum registration deposit</Label><Input type="number" value={programForm.minimumRegistrationDeposit} onChange={(e) => setProgramForm({ ...programForm, minimumRegistrationDeposit: e.target.value })} /></div>
            <div className="space-y-2"><Label>Exam clearance %</Label><Input type="number" value={programForm.examClearanceValue} onChange={(e) => setProgramForm({ ...programForm, examClearanceValue: e.target.value })} /></div>
            <div className="space-y-2 md:col-span-3"><Label>Description</Label><Textarea value={programForm.description} onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })} /></div>
            <div className="md:col-span-3"><Button disabled={saving === "program"}>{saving === "program" ? "Saving..." : "Create programme"}</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Create Intake & Academic Calendar</CardTitle><CardDescription>This calendar controls when students can register, attend classes, submit CA, write exams, view results, and progress.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={saveIntake} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2"><Label>Programme</Label><Select value={intakeForm.programId} onValueChange={(value) => setIntakeForm({ ...intakeForm, programId: value })}><SelectTrigger><SelectValue placeholder="Select programme" /></SelectTrigger><SelectContent>{programs.map((program) => <SelectItem key={program.id} value={String(program.id)}>{program.title}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Intake name</Label><Input value={intakeForm.name} onChange={(e) => setIntakeForm({ ...intakeForm, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Delivery mode</Label><Select value={intakeForm.deliveryMode} onValueChange={(value) => setIntakeForm({ ...intakeForm, deliveryMode: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{deliveryModes.map((mode) => <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Campus / venue base</Label><Input value={intakeForm.campus} onChange={(e) => setIntakeForm({ ...intakeForm, campus: e.target.value })} /></div>
            {[
              ['startDate', 'Semester start'], ['endDate', 'Semester end'], ['registrationOpensAt', 'Registration opens'], ['registrationClosesAt', 'Registration closes'], ['orientationDate', 'Orientation'], ['classesStartDate', 'Classes start'], ['addDropDeadline', 'Add/drop deadline'], ['caStartsAt', 'CA starts'], ['caEndsAt', 'CA ends'], ['examRegistrationDeadline', 'Exam registration deadline'], ['examStartsAt', 'Exams start'], ['examEndsAt', 'Exams end'], ['resultsReleaseDate', 'Results release'], ['progressionOpensAt', 'Progression opens'],
            ].map(([key, label]) => (
              <div key={key} className="space-y-2"><Label>{label}</Label><Input type="date" value={(intakeForm as any)[key]} onChange={(e) => setIntakeForm({ ...intakeForm, [key]: e.target.value })} required={key === 'startDate'} /></div>
            ))}
            <div className="space-y-2"><Label>Capacity</Label><Input type="number" value={intakeForm.capacity} onChange={(e) => setIntakeForm({ ...intakeForm, capacity: e.target.value })} /></div>
            <div className="md:col-span-4"><Button disabled={saving === "intake"}>{saving === "intake" ? "Saving..." : "Create intake calendar"}</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardHeader><CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" />After structure: build content</CardTitle><CardDescription>Once the programme and intake exist, use builders and curriculum tools to publish modules and lessons.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Button asChild variant="outline"><Link href="/admin/academic-structure"><BookOpen className="mr-2 h-4 w-4" />Academic Structure</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/short-courses/json-builder"><Wand2 className="mr-2 h-4 w-4" />JSON Builder</Link></Button>
          <Button asChild variant="outline"><Link href="/lecturer/builders"><GraduationCap className="mr-2 h-4 w-4" />Lecturer Builders</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}

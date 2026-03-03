'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const yearOneCourses = [
  { code: 'DEC 100', title: 'Studio', credits: 5, runs: 'Full year', assessment: 'CA 40% + Final 60%' },
  { code: 'DEC 110', title: 'Applied Mechanics', credits: 5, runs: 'Full year', assessment: 'CA 40% + Final 60%' },
  { code: 'DEC 120', title: 'Building Construction & Materials', credits: 5, runs: 'Full year', assessment: 'CA 40% + Final 60%' },
  { code: 'DEC 131', title: 'Introduction to Computer Technology', credits: 5, runs: 'Full year', assessment: 'CA 40% + Final 60%' },
  { code: 'DEC 141', title: 'Physics', credits: 5, runs: 'Full year', assessment: 'CA 40% + Final 60%' },
  { code: 'DEC 150', title: 'Surveying', credits: 5, runs: 'Full year', assessment: 'CA 40% + Final 60%' },
  { code: 'DEC 160', title: 'Technical Mathematics I', credits: 5, runs: 'Full year', assessment: 'CA 40% + Final 60%' },
  { code: 'DEC 171', title: 'Communication Skills', credits: 5, runs: 'Full year', assessment: 'CA 40% + Final 60%' },
];

const semesterOneUnits = [
  { course: 'DEC 110 Applied Mechanics', units: 'Units, vectors, FBDs, resultants, moments, equilibrium' },
  { course: 'DEC 141 Physics', units: 'Measurement, kinematics intro, heat/temperature, thermal transfer' },
  { course: 'DEC 150 Surveying', units: 'Instruments, linear measurement, chain surveying, levelling' },
  { course: 'DEC 160 Technical Mathematics I', units: 'Algebra, trigonometry, vectors, graphs/functions' },
  { course: 'DEC 120 Building Construction & Materials', units: 'Industry overview, materials, concrete basics, timber/steel' },
  { course: 'DEC 131 Intro Computer Technology', units: 'Hardware, OS basics, docs formatting, spreadsheets basics' },
  { course: 'DEC 171 Communication Skills', units: 'Study skills, writing, grammar/reports, referencing' },
  { course: 'DEC 100 Studio', units: 'Technical drawing fundamentals, scales/layouts, plans/elevations' },
];

const semesterTwoUnits = [
  { course: 'DEC 110 Applied Mechanics', units: 'Friction, centroids/CG, simple machines, fluids basics' },
  { course: 'DEC 141 Physics', units: 'Light, sound, electricity/magnetism, intro electronics' },
  { course: 'DEC 150 Surveying', units: 'Advanced levelling, contours, area/volume, GPS field application' },
  { course: 'DEC 160 Technical Mathematics I', units: 'Matrices, coordinate geometry, intro calculus, trig applications' },
];

export default function CurriculumBlueprintPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Diploma Civil Engineering Blueprint (DCE1)</h1>
        <p className="text-muted-foreground">Reference implementation for year-long registration with semester-split teaching and final sessional exams.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Year 1 Courses (Register all 8)</CardTitle>
          <CardDescription>Total planned credit load: 40 credits</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Runs</TableHead>
                <TableHead>Assessment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {yearOneCourses.map((course) => (
                <TableRow key={course.code}>
                  <TableCell className="font-medium">{course.code}</TableCell>
                  <TableCell>{course.title}</TableCell>
                  <TableCell>{course.credits}</TableCell>
                  <TableCell>{course.runs}</TableCell>
                  <TableCell>{course.assessment}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Semester 1 Plan (Unit Set A + Test 1)</CardTitle>
            <CardDescription>Each course banks 20% by end of S1 (CA 10% + Test 1 10%).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {semesterOneUnits.map((item) => (
              <div key={item.course} className="rounded-lg border p-3">
                <p className="font-medium">{item.course}</p>
                <p className="text-sm text-muted-foreground">{item.units}</p>
              </div>
            ))}
            <Badge variant="outline">Semester 1 status shown to student: In Progress (20% earned)</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Semester 2 Plan (Unit Set B + Test 2 + Final)</CardTitle>
            <CardDescription>End-of-year weighting: S1 CA 20% + S2 CA 20% + Final exam 60%.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {semesterTwoUnits.map((item) => (
              <div key={item.course} className="rounded-lg border p-3">
                <p className="font-medium">{item.course}</p>
                <p className="text-sm text-muted-foreground">{item.units}</p>
              </div>
            ))}
            <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              Final exam model: one final paper per course (8 papers total), all written in the end-of-S2 exam period.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Failure & Progression Rules (Policy-driven)</CardTitle>
          <CardDescription>Typical outcomes to configure in policy + progression settings.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-3 text-sm">Fail 1 course: carry + conditional progression (if allowed).</div>
          <div className="rounded-lg border p-3 text-sm">Fail 2 courses: continue only if max-carry policy allows.</div>
          <div className="rounded-lg border p-3 text-sm">Fail 3+ courses: repeat year or exclusion (institution rule).</div>
          <div className="rounded-lg border p-3 text-sm">Missed tests: make-up windows or policy-based reweighting.</div>
        </CardContent>
      </Card>
    </div>
  );
}

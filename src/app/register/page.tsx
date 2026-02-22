'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Logo } from '@/components/icons/logo';
import { type Course, type School } from '@/lib/api/types';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, BookOpen, GraduationCap, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { subjectCatalogByCountry } from '@/lib/subject-catalog';
import { getAdmissionsSettings, getCourses, getSchools, registerAccount, submitApplication, uploadAdmissionDocument } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [schoolId, setSchoolId] = useState('');
  const [programId, setProgramId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('Zambia');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectPoints, setSubjectPoints] = useState<Record<string, string>>({});
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [coursesForSchool, setCoursesForSchool] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [admissionsOpen, setAdmissionsOpen] = useState(true);
  const [admissionsMessage, setAdmissionsMessage] = useState('');

  const subjects = subjectCatalogByCountry[country] ?? [];
  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(subjectSearch.toLowerCase())
  );
  const requiredSubjects = new Set(['English Language', 'Mathematics']);
  const hasEnglish = Number(subjectPoints['english-language'] || 0) > 0;
  const hasMath = Number(subjectPoints['mathematics'] || 0) > 0;
  const totalPoints = Object.values(subjectPoints).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const subjectCount = Object.values(subjectPoints).filter((value) => Number(value) > 0).length;

  const completedFields = [fullName, email, password, schoolId, programId].filter(Boolean).length + (subjectCount > 0 ? 1 : 0);
  const completion = Math.round((completedFields / 6) * 100);

  useEffect(() => {
    if (schoolId) {
      const schoolCourses = allCourses.filter(course => course.schoolId === schoolId);
      setCoursesForSchool(schoolCourses);
      setProgramId('');
    } else {
      setCoursesForSchool([]);
    }
  }, [schoolId, allCourses]);

  useEffect(() => {
    const loadCatalog = async () => {
      const [schools, courses, settings] = await Promise.all([
        getSchools(),
        getCourses(),
        getAdmissionsSettings(),
      ]);
      setAllSchools(schools);
      setAllCourses(courses);
      setAdmissionsOpen(settings.isOpen);
      setAdmissionsMessage(settings.message ?? '');
    };
    loadCatalog();
  }, []);

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (timezone.toLowerCase().includes('lusaka')) {
      setCountry('Zambia');
    }
  }, []);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const deliveryMode = (formData.get('deliveryMode') as string) || 'hybrid';
    const learningStyle = (formData.get('learningStyle') as string) || 'traditional';
    const studyPace = (formData.get('studyPace') as string) || 'standard';
    
    try {
      if (!admissionsOpen) {
        setError(admissionsMessage || 'Admissions are currently closed. Please check back later.');
        return;
      }
      if (password.length < 6) {
        setError('The password is too weak. It must be at least 6 characters long.');
        return;
      }

      await registerAccount({
        name: fullName,
        email,
        password,
      });

      await submitApplication({
        fullName,
        email,
        programId,
        schoolId,
        deliveryMode,
        learningStyle,
        studyPace,
        country,
        subjectPoints,
      });

      const nationalIdFile = formData.get('nationalId') as File | null;
      const certificateFile = formData.get('certificate') as File | null;
      const resultsFile = formData.get('certifiedResults') as File | null;

      const uploads: Promise<unknown>[] = [];
      if (nationalIdFile && nationalIdFile.size > 0) {
        uploads.push(uploadAdmissionDocument('national_id', nationalIdFile));
      }
      if (certificateFile && certificateFile.size > 0) {
        uploads.push(uploadAdmissionDocument('certificate', certificateFile));
      }
      if (resultsFile && resultsFile.size > 0) {
        uploads.push(uploadAdmissionDocument('certified_results', resultsFile));
      }

      if (uploads.length > 0) {
        await Promise.all(uploads);
      }

      alert(`Application submitted for ${email}!`);
      router.push('/admissions/status');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error?.message || 'An unexpected error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 py-8">
      <div className='absolute left-4 top-4 md:left-8 md:top-8'>
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Logo className="size-8" />
          <span>UnivAI</span>
        </Link>
      </div>
      <div className="w-full max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Application Quest
                </CardTitle>
                <CardDescription>Complete the steps to unlock your student portal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                    <span>Progress</span>
                    <span>{completion}%</span>
                  </div>
                  <Progress value={completion} />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between rounded-lg border p-2">
                    <span>Identity and contact</span>
                    <Badge variant="outline">Step 1</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-2">
                    <span>Academic history and points</span>
                    <Badge variant="outline">Step 2</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-2">
                    <span>Program + learning mode</span>
                    <Badge variant="outline">Step 3</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tip: Save and continue anytime. Your progress is remembered on this device.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  UnivAI is a University, not just an app
                </CardTitle>
                <CardDescription>
                  UnivAI delivers real higher education with academic governance, assessments, and graduation requirements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  You enroll in a real program, follow a structured academic calendar, and complete verified assessments.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Programs, schools, credits, modules, and graduation standards</li>
                  <li>Human academic oversight and formal appeals</li>
                  <li>AI assistance for learning - not for final decisions</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Hybrid Learning by Design
                </CardTitle>
                <CardDescription>
                  Choose the mode that matches your lifestyle while keeping the same degree standards.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ul className="list-disc space-y-2 pl-5">
                  <li>In-person: campus lectures, labs, and supervised exams</li>
                  <li>Online: remote lectures, AI support, and proctored exams</li>
                  <li>Hybrid: combine both while keeping the same credential</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Admissions / Enrollment / Student Status
                </CardTitle>
                <CardDescription>Clear steps so students stay aligned.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>Create account and submit documents</li>
                  <li>University reviews eligibility and issues an offer</li>
                  <li>Student accepts offer, pays tuition, registers modules</li>
                  <li>Enrollment confirmed - you become an official student</li>
                </ol>
              </CardContent>
            </Card>

          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Student Enrollment</CardTitle>
              <CardDescription>Start your application and choose your learning mode.</CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Registration Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {!admissionsOpen && !error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Admissions Closed</AlertTitle>
                    <AlertDescription>
                      {admissionsMessage || 'Admissions are currently closed. Please check back later.'}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">Account Details</h3>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Choose a password (min. 6 characters)"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground">Academic History</h3>
                    <Badge variant="outline">{country} Subjects</Badge>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_160px]">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select name="country" value={country} onValueChange={setCountry}>
                        <SelectTrigger id="country">
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Zambia">Zambia</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        We auto-load subject lists based on your region. More countries coming soon.
                      </p>
                    </div>
                    <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                      <div className="font-semibold text-foreground">AI Pre-check</div>
                      <div className="mt-2 space-y-1">
                        <div>English: {hasEnglish ? 'Provided' : 'Missing'}</div>
                        <div>Math: {hasMath ? 'Provided' : 'Missing'}</div>
                        <div>Subjects entered: {subjectCount}</div>
                        <div>Total points: {totalPoints}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject-search">Search Subjects</Label>
                    <Input
                      id="subject-search"
                      placeholder="Type a subject name..."
                      value={subjectSearch}
                      onChange={(event) => setSubjectSearch(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Subject Points</Label>
                    <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
                      {filteredSubjects.length === 0 && (
                        <p className="text-sm text-muted-foreground">No subjects match your search.</p>
                      )}
                      {filteredSubjects.map((subject) => (
                        <div key={subject.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{subject.name}</p>
                            {subject.group && (
                              <p className="text-xs text-muted-foreground">{subject.group}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {requiredSubjects.has(subject.name) && (
                              <Badge variant="secondary">Required</Badge>
                            )}
                            <Input
                              type="number"
                              min="0"
                              placeholder="Points"
                              className="w-24"
                              value={subjectPoints[subject.id] ?? ''}
                              onChange={(event) =>
                                setSubjectPoints((prev) => ({ ...prev, [subject.id]: event.target.value }))
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter the official point or grade for each subject exactly as shown on your results slip.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">Academic Selection</h3>
                  <div className="space-y-2">
                    <Label>Select your School</Label>
                    <Select name="schoolId" value={schoolId} onValueChange={setSchoolId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a school to enroll in" />
                      </SelectTrigger>
                      <SelectContent>
                        {allSchools.map(school => (
                          <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Program of Choice</Label>
                    <Select name="programId" value={programId} onValueChange={setProgramId} required disabled={!schoolId}>
                      <SelectTrigger>
                        <SelectValue placeholder={schoolId ? "Select a program" : "Select a school first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {coursesForSchool.map(course => (
                          <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">Learning Mode</h3>
                  <div className="space-y-3">
                    <Label>Delivery Mode</Label>
                    <RadioGroup name="deliveryMode" defaultValue="hybrid" className="grid gap-2">
                      <label className="flex items-center gap-3 rounded-lg border p-3">
                        <RadioGroupItem value="in-person" id="delivery-in-person" />
                        <span>In-person (Campus)</span>
                      </label>
                      <label className="flex items-center gap-3 rounded-lg border p-3">
                        <RadioGroupItem value="online" id="delivery-online" />
                        <span>Online (Remote)</span>
                      </label>
                      <label className="flex items-center gap-3 rounded-lg border p-3">
                        <RadioGroupItem value="hybrid" id="delivery-hybrid" />
                        <span>Hybrid (Mix of both)</span>
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>Learning Style</Label>
                    <RadioGroup name="learningStyle" defaultValue="traditional" className="grid gap-2">
                      <label className="flex items-center gap-3 rounded-lg border p-3">
                        <RadioGroupItem value="traditional" id="style-traditional" />
                        <span>Traditional (Fixed timetable)</span>
                      </label>
                      <label className="flex items-center gap-3 rounded-lg border p-3">
                        <RadioGroupItem value="personalized" id="style-personalized" />
                        <span>Personalized (AI-guided pacing)</span>
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Study Pace</Label>
                    <Select name="studyPace" defaultValue="standard">
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a pace" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Semester</SelectItem>
                        <SelectItem value="accelerated">Accelerated</SelectItem>
                        <SelectItem value="flex">Flexible (Advisor Approval)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">Documents</h3>
                  <div className="space-y-2">
                    <Label htmlFor="national-id">National ID</Label>
                    <Input id="national-id" name="nationalId" type="file" className="flex-1" required />
                    <p className="text-xs text-muted-foreground">Upload a scan of your national ID card (PDF, JPG, or PNG).</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certificate">High School Certificate</Label>
                    <Input id="certificate" name="certificate" type="file" className="flex-1" required />
                    <p className="text-xs text-muted-foreground">Upload your certificate (PDF, JPG, or PNG).</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certified-results">Certified Results Proof</Label>
                    <Input id="certified-results" name="certifiedResults" type="file" className="flex-1" required />
                    <p className="text-xs text-muted-foreground">
                      Upload certified copies of your results or an official statement of results.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border p-3 text-sm text-muted-foreground">
                  <Checkbox id="policy" />
                  <Label htmlFor="policy">
                    I understand that admission is reviewed by UnivAI and enrollment is confirmed after offer acceptance and payment.
                  </Label>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button className="w-full" type="submit" disabled={loading || !admissionsOpen}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}




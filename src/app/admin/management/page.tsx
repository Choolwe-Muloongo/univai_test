'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2, AlertCircle } from 'lucide-react';
import { type Program, type QualificationLevel, type School } from '@/lib/api/types';
import {
  createProgram,
  createSchool,
  deleteProgram,
  deleteSchool,
  getPrograms,
  getQualificationLevels,
  getSchools,
} from '@/lib/api';

const deliveryModeLabels: Record<string, string> = {
  online: 'Online',
  hybrid: 'Hybrid',
  physical: 'Physical',
};

const formatMonths = (months?: number | null) => {
  if (!months) {
    return 'Not set';
  }
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }
  return `${months} months`;
};

const parseRequiredSubjects = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [rawName, rawPoints] = item.split(':').map((part) => part.trim());
      return {
        subjectId: rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        subjectName: rawName,
        minimumPoints: rawPoints ? Number(rawPoints) : null,
      };
    });

export default function AdminManagementPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [qualificationLevels, setQualificationLevels] = useState<QualificationLevel[]>([]);
  const [schoolName, setSchoolName] = useState('');
  const [programTitle, setProgramTitle] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [qualificationLevelId, setQualificationLevelId] = useState('');
  const [credits, setCredits] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [admissionRequirements, setAdmissionRequirements] = useState('');
  const [requiredSubjectsText, setRequiredSubjectsText] = useState('');
  const [deliveryModes, setDeliveryModes] = useState<string[]>([]);
  const [examClinicRequired, setExamClinicRequired] = useState(false);
  const [requiresAccreditationApproval, setRequiresAccreditationApproval] = useState(false);
  const [accreditationApproved, setAccreditationApproved] = useState(false);
  const [launchStatus, setLaunchStatus] = useState('draft');
  const [error, setError] = useState<string | null>(null);

  const schoolOptions = useMemo(() => schools, [schools]);
  const selectedQualificationLevel = useMemo(
    () => qualificationLevels.find((level) => level.id === qualificationLevelId),
    [qualificationLevelId, qualificationLevels]
  );

  useEffect(() => {
    const loadCatalog = async () => {
      const [schoolsData, programsData, levelsData] = await Promise.all([
        getSchools(),
        getPrograms(),
        getQualificationLevels(),
      ]);
      setSchools(schoolsData);
      setPrograms(programsData);
      setQualificationLevels(levelsData);
      if (levelsData[0]) {
        applyQualificationDefaults(levelsData[0]);
      }
    };
    loadCatalog();
  }, []);

  const applyQualificationDefaults = (level: QualificationLevel) => {
    setQualificationLevelId(level.id);
    setCredits(String(level.defaultCredits));
    setDurationMonths(String(level.durationMonths));
    setAdmissionRequirements(level.admissionRequirements ?? '');
    setDeliveryModes(level.allowedDeliveryModes);
    setExamClinicRequired(level.requiresExamClinic);
    setRequiresAccreditationApproval(level.requiresAccreditationApproval);
    setAccreditationApproved(!level.requiresAccreditationApproval);
    setLaunchStatus(level.requiresAccreditationApproval ? 'draft' : 'published');
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (schoolName.trim().length < 3) {
      setError('School name must be at least 3 characters long.');
      return;
    }
    const created = await createSchool(schoolName.trim());
    setSchools((prev) => [...prev, created]);
    setSchoolName('');
    setError(null);
  };

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programTitle || !programDescription || !selectedSchoolId || !qualificationLevelId) {
      setError('School, programme title, description, and qualification level are required.');
      return;
    }
    if (requiresAccreditationApproval && !accreditationApproved && launchStatus === 'published') {
      setError('Accreditation approval is required before publishing this qualification level.');
      return;
    }

    const created = await createProgram({
      id: programTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: programTitle,
      description: programDescription,
      schoolId: selectedSchoolId,
      qualificationLevelId,
      credits: Number(credits),
      durationMonths: Number(durationMonths),
      admissionRequirements,
      requiredSubjects: parseRequiredSubjects(requiredSubjectsText),
      deliveryModes,
      examClinicRequired,
      requiresAccreditationApproval,
      accreditationApproved,
      launchStatus,
      imageId: '1',
    });
    setPrograms((prev) => [...prev.filter((program) => program.id !== created.id), created]);
    setProgramTitle('');
    setProgramDescription('');
    setSelectedSchoolId('');
    setRequiredSubjectsText('');
    if (selectedQualificationLevel) {
      applyQualificationDefaults(selectedQualificationLevel);
    }
    setError(null);
  };

  const handleRemoveSchool = async (id: string) => {
    await deleteSchool(id);
    setSchools((prev) => prev.filter((school) => school.id !== id));
    setPrograms((prev) => prev.filter((program) => program.schoolId !== id));
  };

  const handleRemoveProgram = async (id: string) => {
    await deleteProgram(id);
    setPrograms((prev) => prev.filter((program) => program.id !== id));
  };

  const toggleDeliveryMode = (mode: string, checked: boolean) => {
    setDeliveryModes((prev) => checked ? [...new Set([...prev, mode])] : prev.filter((item) => item !== mode));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
        <p className="text-muted-foreground">
          Manage schools, qualification levels, and launch-ready programmes for the UnivAI catalog.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Manage Schools</CardTitle>
            <CardDescription>Add or remove schools from the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddSchool} className="flex gap-2">
              <Input
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="New school name"
                required
              />
              <Button type="submit">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add School
              </Button>
            </form>
            <div className="min-h-48 space-y-2 rounded-lg border p-2">
              {schools.map((school) => (
                <div key={school.id} className="flex items-center justify-between rounded-md p-2 hover:bg-muted">
                  <span>{school.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemoveSchool(school.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Programme</CardTitle>
            <CardDescription>Qualification level defaults control credits, duration, delivery, admissions, exam clinic, and accreditation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddProgram} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Select School</Label>
                  <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolOptions.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Qualification Level</Label>
                  <Select
                    value={qualificationLevelId}
                    onValueChange={(value) => {
                      const level = qualificationLevels.find((item) => item.id === value);
                      if (level) {
                        applyQualificationDefaults(level);
                      }
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a level" />
                    </SelectTrigger>
                    <SelectContent>
                      {qualificationLevels.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Programme Title</Label>
                <Input
                  value={programTitle}
                  onChange={(e) => setProgramTitle(e.target.value)}
                  placeholder="e.g., Bachelor of Arts in History"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Programme Description</Label>
                <Input
                  value={programDescription}
                  onChange={(e) => setProgramDescription(e.target.value)}
                  placeholder="A brief description of the programme"
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Credits</Label>
                  <Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} min={0} />
                </div>
                <div className="space-y-2">
                  <Label>Duration (months)</Label>
                  <Input type="number" value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} min={1} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Admission Requirements</Label>
                <Input
                  value={admissionRequirements}
                  onChange={(e) => setAdmissionRequirements(e.target.value)}
                  placeholder="Minimum academic or professional entry requirements"
                />
              </div>
              <div className="space-y-2">
                <Label>Required Subjects</Label>
                <Input
                  value={requiredSubjectsText}
                  onChange={(e) => setRequiredSubjectsText(e.target.value)}
                  placeholder="Example: Biology:4, Chemistry:4, Mathematics:3"
                />
                <p className="text-xs text-muted-foreground">
                  Optional. Separate subjects with commas. Use “Subject:minimum points” when a minimum score is needed.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Delivery Modes</Label>
                <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
                  {(selectedQualificationLevel?.allowedDeliveryModes ?? ['online', 'hybrid', 'physical']).map((mode) => (
                    <label key={mode} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={deliveryModes.includes(mode)} onCheckedChange={(checked) => toggleDeliveryMode(mode, checked === true)} />
                      {deliveryModeLabels[mode] ?? mode}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 rounded-md border p-3 text-sm md:grid-cols-2">
                <label className="flex items-center gap-2">
                  <Checkbox checked={examClinicRequired} onCheckedChange={(checked) => setExamClinicRequired(checked === true)} />
                  Exam clinic required
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox checked={requiresAccreditationApproval} onCheckedChange={(checked) => setRequiresAccreditationApproval(checked === true)} />
                  Accreditation required before launch
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox checked={accreditationApproved} onCheckedChange={(checked) => setAccreditationApproved(checked === true)} />
                  Accreditation approved
                </label>
                <div className="space-y-2">
                  <Label>Launch Status</Label>
                  <Select value={launchStatus} onValueChange={setLaunchStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_accreditation">Pending accreditation</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Programme
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing Programmes</CardTitle>
          <CardDescription>Programmes inherit controls from their qualification level unless overridden.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {schools.map((school) => (
            <div key={school.id}>
              <h3 className="mb-2 text-lg font-semibold">{school.name}</h3>
              <div className="space-y-2">
                {programs
                  .filter((program) => program.schoolId === school.id)
                  .map((program) => (
                    <div key={program.id} className="rounded-md border p-3 hover:bg-muted/40">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <p className="font-medium">{program.title}</p>
                          <p className="text-sm text-muted-foreground">{program.description}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{program.qualificationLevel?.name ?? 'Level not set'}</Badge>
                            <Badge variant="outline">{program.credits ?? '—'} credits</Badge>
                            <Badge variant="outline">{formatMonths(program.durationMonths)}</Badge>
                            <Badge variant={program.launchStatus === 'published' ? 'default' : 'outline'}>{program.launchStatus ?? 'draft'}</Badge>
                            {program.examClinicRequired && <Badge variant="outline">Exam clinic</Badge>}
                            {program.requiresAccreditationApproval && <Badge variant="outline">Accreditation gated</Badge>}
                            {(program.requiredSubjects?.length ?? 0) > 0 && <Badge variant="outline">{program.requiredSubjects?.length} required subjects</Badge>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveProgram(program.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {programs.filter((program) => program.schoolId === school.id).length === 0 && (
                  <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">No programmes in this school yet</p>
                    <p className="mt-1">Next action: use the form above to add the first qualification-controlled programme.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

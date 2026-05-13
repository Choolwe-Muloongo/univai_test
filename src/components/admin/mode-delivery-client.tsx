'use client';

import { FormEvent, useEffect, useState, type ReactNode } from 'react';

import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  createLearningModeRule,
  createPartnerInstitution,
  createPracticalSession,
  createVenue,
  getAdminAcademicStructure,
  getPrograms,
} from '@/lib/api';
import type { AdminAcademicStructureResponse, Program } from '@/lib/api/types';

const blankStructure: AdminAcademicStructureResponse = {
  departments: [],
  academicYears: [],
  semesters: [],
  programmeCourses: [],
  courseUnits: [],
  learningModeRules: [],
  venues: [],
  partnerInstitutions: [],
  practicalSessions: [],
};

export function ModeDeliveryClient() {
  const [structure, setStructure] = useState<AdminAcademicStructureResponse>(blankStructure);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [ruleForm, setRuleForm] = useState({
    programId: '',
    mode: 'online',
    content: 'Class View, official content, lecturer-supervised AI support, assessments',
  });
  const [venueForm, setVenueForm] = useState({ name: '', type: 'lab', location: '', capacity: '', status: 'active' });
  const [partnerForm, setPartnerForm] = useState({ name: '', type: 'campus', location: '', contactEmail: '', status: 'active' });
  const [sessionForm, setSessionForm] = useState({
    programmeCourseId: '',
    title: '',
    venueId: '',
    partnerInstitutionId: '',
    startsAt: '',
    endsAt: '',
    capacity: '',
    status: 'planned',
  });

  async function refresh() {
    const [structureData, programData] = await Promise.all([getAdminAcademicStructure(), getPrograms()]);
    setStructure(structureData);
    setPrograms(programData);
  }

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Mode and delivery data is unavailable.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function submit(label: string, handler: () => Promise<unknown>) {
    setSaving(label);
    setError(null);
    try {
      await handler();
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save this delivery item.');
    } finally {
      setSaving(null);
    }
  }

  function onRuleSubmit(event: FormEvent) {
    event.preventDefault();
    void submit('rule', async () => {
      await createLearningModeRule({
        programId: ruleForm.programId || null,
        mode: ruleForm.mode,
        rules: {
          standard: 'Same academic standard across online, hybrid and physical modes',
          learnerSupport: ruleForm.content.split(',').map((item) => item.trim()).filter(Boolean),
        },
      });
    });
  }

  function onVenueSubmit(event: FormEvent) {
    event.preventDefault();
    void submit('venue', async () => {
      await createVenue({
        name: venueForm.name,
        type: venueForm.type,
        location: venueForm.location,
        capacity: venueForm.capacity ? Number(venueForm.capacity) : null,
        status: venueForm.status,
      });
      setVenueForm({ ...venueForm, name: '', location: '', capacity: '' });
    });
  }

  function onPartnerSubmit(event: FormEvent) {
    event.preventDefault();
    void submit('partner', async () => {
      await createPartnerInstitution(partnerForm);
      setPartnerForm({ ...partnerForm, name: '', location: '', contactEmail: '' });
    });
  }

  function onSessionSubmit(event: FormEvent) {
    event.preventDefault();
    void submit('session', async () => {
      await createPracticalSession({
        programmeCourseId: sessionForm.programmeCourseId ? Number(sessionForm.programmeCourseId) : null,
        title: sessionForm.title,
        venueId: sessionForm.venueId ? Number(sessionForm.venueId) : null,
        partnerInstitutionId: sessionForm.partnerInstitutionId ? Number(sessionForm.partnerInstitutionId) : null,
        startsAt: sessionForm.startsAt || null,
        endsAt: sessionForm.endsAt || null,
        capacity: sessionForm.capacity ? Number(sessionForm.capacity) : null,
        status: sessionForm.status,
      });
      setSessionForm({ ...sessionForm, title: '', startsAt: '', endsAt: '', capacity: '' });
    });
  }

  if (loading) return <PageLoading message="Loading delivery operations..." />;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-normal text-primary">Mode & Delivery</p>
        <h1 className="text-3xl font-bold text-foreground">Online, hybrid and physical delivery</h1>
        <p className="max-w-3xl text-muted-foreground">
          Configure delivery support while keeping the same academic standard for every learner.
        </p>
      </section>

      {error ? <PageError message={error} /> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Mode Rules" value={structure.learningModeRules.length} />
        <SummaryCard label="Venues" value={structure.venues.length} />
        <SummaryCard label="Partners" value={structure.partnerInstitutions.length} />
        <SummaryCard label="Practical Sessions" value={structure.practicalSessions.length} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Learning Mode Rule</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onRuleSubmit}>
              <Field label="Programme">
                <Select value={ruleForm.programId} onValueChange={(programId) => setRuleForm((form) => ({ ...form, programId }))}>
                  <SelectTrigger><SelectValue placeholder="All programmes" /></SelectTrigger>
                  <SelectContent>{programs.map((program) => <SelectItem key={program.id} value={program.id}>{program.title}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Mode">
                <Select value={ruleForm.mode} onValueChange={(mode) => setRuleForm((form) => ({ ...form, mode }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="physical">Physical</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Learner support">
                <Input value={ruleForm.content} onChange={(event) => setRuleForm((form) => ({ ...form, content: event.target.value }))} />
              </Field>
              <Button disabled={saving === 'rule'}>{saving === 'rule' ? 'Saving...' : 'Create rule'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Venue</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={onVenueSubmit}>
              <Field label="Name"><Input required value={venueForm.name} onChange={(event) => setVenueForm((form) => ({ ...form, name: event.target.value }))} /></Field>
              <Field label="Type"><Input value={venueForm.type} onChange={(event) => setVenueForm((form) => ({ ...form, type: event.target.value }))} /></Field>
              <Field label="Location"><Input value={venueForm.location} onChange={(event) => setVenueForm((form) => ({ ...form, location: event.target.value }))} /></Field>
              <Field label="Capacity"><Input type="number" min={0} value={venueForm.capacity} onChange={(event) => setVenueForm((form) => ({ ...form, capacity: event.target.value }))} /></Field>
              <Button className="sm:col-span-2" disabled={saving === 'venue'}>{saving === 'venue' ? 'Saving...' : 'Create venue'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Partner Institution</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={onPartnerSubmit}>
              <Field label="Name"><Input required value={partnerForm.name} onChange={(event) => setPartnerForm((form) => ({ ...form, name: event.target.value }))} /></Field>
              <Field label="Type"><Input value={partnerForm.type} onChange={(event) => setPartnerForm((form) => ({ ...form, type: event.target.value }))} /></Field>
              <Field label="Location"><Input value={partnerForm.location} onChange={(event) => setPartnerForm((form) => ({ ...form, location: event.target.value }))} /></Field>
              <Field label="Contact email"><Input type="email" value={partnerForm.contactEmail} onChange={(event) => setPartnerForm((form) => ({ ...form, contactEmail: event.target.value }))} /></Field>
              <Button className="sm:col-span-2" disabled={saving === 'partner'}>{saving === 'partner' ? 'Saving...' : 'Create partner'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Practical Session</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSessionSubmit}>
              <Field label="Programme course">
                <Select value={sessionForm.programmeCourseId} onValueChange={(programmeCourseId) => setSessionForm((form) => ({ ...form, programmeCourseId }))}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{structure.programmeCourses.map((course) => <SelectItem key={course.id} value={String(course.id)}>{course.programTitle || course.courseTitle || `Course ${course.id}`}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Title"><Input required value={sessionForm.title} onChange={(event) => setSessionForm((form) => ({ ...form, title: event.target.value }))} /></Field>
              <Field label="Venue">
                <Select value={sessionForm.venueId} onValueChange={(venueId) => setSessionForm((form) => ({ ...form, venueId }))}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{structure.venues.map((venue) => <SelectItem key={venue.id} value={String(venue.id)}>{venue.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Partner">
                <Select value={sessionForm.partnerInstitutionId} onValueChange={(partnerInstitutionId) => setSessionForm((form) => ({ ...form, partnerInstitutionId }))}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{structure.partnerInstitutions.map((partner) => <SelectItem key={partner.id} value={String(partner.id)}>{partner.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Starts"><Input type="datetime-local" value={sessionForm.startsAt} onChange={(event) => setSessionForm((form) => ({ ...form, startsAt: event.target.value }))} /></Field>
              <Field label="Ends"><Input type="datetime-local" value={sessionForm.endsAt} onChange={(event) => setSessionForm((form) => ({ ...form, endsAt: event.target.value }))} /></Field>
              <Field label="Capacity"><Input type="number" min={0} value={sessionForm.capacity} onChange={(event) => setSessionForm((form) => ({ ...form, capacity: event.target.value }))} /></Field>
              <Button className="sm:col-span-2" disabled={saving === 'session'}>{saving === 'session' ? 'Saving...' : 'Create session'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ListCard title="Mode Rules" items={structure.learningModeRules.map((rule) => `${rule.programTitle || 'All programmes'} - ${rule.mode}`)} />
        <ListCard title="Practical Sessions" items={structure.practicalSessions.map((session) => `${session.title} - ${session.venueName || session.partnerInstitutionName || 'online support'}`)} />
        <ListCard title="Venues" items={structure.venues.map((venue) => `${venue.name} - ${venue.type || 'venue'} - ${venue.status}`)} />
        <ListCard title="Partner Institutions" items={structure.partnerInstitutions.map((partner) => `${partner.name} - ${partner.location || 'location pending'}`)} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.length ? items.slice(0, 8).map((item) => (
          <div key={item} className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">{item}</div>
        )) : <p className="text-sm text-muted-foreground">No records yet.</p>}
      </CardContent>
    </Card>
  );
}

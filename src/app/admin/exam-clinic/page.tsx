'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  createExamCentre,
  createExamClinicSession,
  createExamIncident,
  createExamInvigilator,
  createExamRoom,
  getExamClinicOverview,
  markExamAttendance,
  syncExamResults,
  updateExamCentreApproval,
  updateExamClinicSession,
} from '@/lib/api';
import type { ExamClinicOverview } from '@/lib/api/types';

const emptyOverview: ExamClinicOverview = {
  centres: [],
  rooms: [],
  invigilators: [],
  sessions: [],
  bookings: [],
  incidents: [],
  resultsSync: [],
};

export default function AdminExamClinicPage() {
  const [data, setData] = useState<ExamClinicOverview>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [centreName, setCentreName] = useState('');
  const [centreCode, setCentreCode] = useState('');
  const [centreLocation, setCentreLocation] = useState('');
  const [centreCapacity, setCentreCapacity] = useState('80');
  const [roomCentreId, setRoomCentreId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomCapacity, setRoomCapacity] = useState('30');
  const [invigilatorName, setInvigilatorName] = useState('');
  const [invigilatorEmail, setInvigilatorEmail] = useState('');
  const [sessionCentreId, setSessionCentreId] = useState('');
  const [sessionRoomId, setSessionRoomId] = useState('');
  const [sessionInvigilatorId, setSessionInvigilatorId] = useState('');
  const [examId, setExamId] = useState('semester-1');
  const [sessionTitle, setSessionTitle] = useState('Semester 1 Exam Clinic');
  const [deliveryMode, setDeliveryMode] = useState('physical');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [sessionCapacity, setSessionCapacity] = useState('25');
  const [incidentSessionId, setIncidentSessionId] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState('medium');
  const [incidentCategory, setIncidentCategory] = useState('identity_verification');
  const [incidentDescription, setIncidentDescription] = useState('');

  const approvedCentres = useMemo(() => data.centres.filter((centre) => centre.approvalStatus === 'approved'), [data.centres]);

  const load = async () => {
    setLoading(true);
    try {
      setData(await getExamClinicOverview());
    } catch (error) {
      console.error(error);
      setMessage('Unable to load exam clinic data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const refreshAfter = async (action: Promise<unknown>, success: string) => {
    try {
      await action;
      setMessage(success);
      await load();
    } catch (error) {
      console.error(error);
      setMessage('Action failed. Check the form and try again.');
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading exam clinic...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exam Clinic</h1>
          <p className="text-muted-foreground">Manage exam centres, rooms, invigilators, sessions, bookings, incidents, and results sync.</p>
        </div>
        <Button variant="outline" onClick={() => refreshAfter(syncExamResults({ recordsSynced: data.bookings.length }), 'Results sync queued successfully.')}>
          Sync Results
        </Button>
      </div>

      {message ? <Card className="border-primary/30"><CardContent className="p-4 text-sm">{message}</CardContent></Card> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle>{data.centres.length}</CardTitle><CardDescription>Centres</CardDescription></CardHeader></Card>
        <Card><CardHeader><CardTitle>{data.sessions.length}</CardTitle><CardDescription>Sessions</CardDescription></CardHeader></Card>
        <Card><CardHeader><CardTitle>{data.bookings.length}</CardTitle><CardDescription>Bookings</CardDescription></CardHeader></Card>
        <Card><CardHeader><CardTitle>{data.incidents.filter((incident) => incident.status === 'open').length}</CardTitle><CardDescription>Open incidents</CardDescription></CardHeader></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Create Centre</CardTitle><CardDescription>Register physical or hybrid exam clinics for approval.</CardDescription></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Name</Label><Input value={centreName} onChange={(e) => setCentreName(e.target.value)} placeholder="Lusaka Exam Centre" /></div>
            <div className="space-y-2"><Label>Code</Label><Input value={centreCode} onChange={(e) => setCentreCode(e.target.value)} placeholder="LUS-01" /></div>
            <div className="space-y-2"><Label>Location</Label><Input value={centreLocation} onChange={(e) => setCentreLocation(e.target.value)} placeholder="Lusaka campus" /></div>
            <div className="space-y-2"><Label>Capacity</Label><Input type="number" value={centreCapacity} onChange={(e) => setCentreCapacity(e.target.value)} /></div>
            <Button onClick={() => refreshAfter(createExamCentre({ name: centreName, code: centreCode || undefined, location: centreLocation, capacity: Number(centreCapacity) || 1 }), 'Centre created for approval.')}>Create Centre</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Add Room & Invigilator</CardTitle><CardDescription>Build capacity and invigilation pools.</CardDescription></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Centre</Label><Select value={roomCentreId} onValueChange={setRoomCentreId}><SelectTrigger><SelectValue placeholder="Select centre" /></SelectTrigger><SelectContent>{data.centres.map((centre) => <SelectItem key={centre.id} value={String(centre.id)}>{centre.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Room</Label><Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Room A" /></div>
            <div className="space-y-2"><Label>Room Capacity</Label><Input type="number" value={roomCapacity} onChange={(e) => setRoomCapacity(e.target.value)} /></div>
            <Button className="self-end" onClick={() => refreshAfter(createExamRoom({ centreId: Number(roomCentreId), name: roomName, capacity: Number(roomCapacity) || 1 }), 'Room added.')}>Add Room</Button>
            <div className="space-y-2"><Label>Invigilator Name</Label><Input value={invigilatorName} onChange={(e) => setInvigilatorName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Invigilator Email</Label><Input type="email" value={invigilatorEmail} onChange={(e) => setInvigilatorEmail(e.target.value)} /></div>
            <Button onClick={() => refreshAfter(createExamInvigilator({ name: invigilatorName, email: invigilatorEmail }), 'Invigilator added.')}>Add Invigilator</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Publish Exam Session</CardTitle><CardDescription>Only approved centre sessions are bookable by hybrid and physical students.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2"><Label>Approved Centre</Label><Select value={sessionCentreId} onValueChange={setSessionCentreId}><SelectTrigger><SelectValue placeholder="Select centre" /></SelectTrigger><SelectContent>{approvedCentres.map((centre) => <SelectItem key={centre.id} value={String(centre.id)}>{centre.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Room</Label><Select value={sessionRoomId} onValueChange={setSessionRoomId}><SelectTrigger><SelectValue placeholder="Optional room" /></SelectTrigger><SelectContent>{data.rooms.filter((room) => !sessionCentreId || room.centreId === Number(sessionCentreId)).map((room) => <SelectItem key={room.id} value={String(room.id)}>{room.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Invigilator</Label><Select value={sessionInvigilatorId} onValueChange={setSessionInvigilatorId}><SelectTrigger><SelectValue placeholder="Optional invigilator" /></SelectTrigger><SelectContent>{data.invigilators.map((invigilator) => <SelectItem key={invigilator.id} value={String(invigilator.id)}>{invigilator.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Exam ID</Label><Input value={examId} onChange={(e) => setExamId(e.target.value)} /></div>
          <div className="space-y-2"><Label>Title</Label><Input value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} /></div>
          <div className="space-y-2"><Label>Mode</Label><Select value={deliveryMode} onValueChange={setDeliveryMode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="physical">Physical</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Starts At</Label><Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></div>
          <div className="space-y-2"><Label>Ends At</Label><Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} /></div>
          <div className="space-y-2"><Label>Capacity</Label><Input type="number" value={sessionCapacity} onChange={(e) => setSessionCapacity(e.target.value)} /></div>
          <Button onClick={() => refreshAfter(createExamClinicSession({ centreId: Number(sessionCentreId), roomId: sessionRoomId ? Number(sessionRoomId) : null, invigilatorId: sessionInvigilatorId ? Number(sessionInvigilatorId) : null, examId, title: sessionTitle, deliveryMode, startsAt, endsAt, capacity: Number(sessionCapacity) || 1, status: 'open' }), 'Exam session published.')}>Publish Session</Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Centres & Approvals</CardTitle><CardDescription>Approve centres before sessions become bookable.</CardDescription></CardHeader>
          <CardContent className="space-y-3">{data.centres.map((centre) => <div key={centre.id} className="rounded-lg border p-4"><div className="flex items-center justify-between gap-2"><div><p className="font-semibold">{centre.name}</p><p className="text-sm text-muted-foreground">{centre.location} · Capacity {centre.capacity}</p></div><Badge>{centre.approvalStatus}</Badge></div><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => refreshAfter(updateExamCentreApproval(centre.id, { approvalStatus: 'approved' }), 'Centre approved.')}>Approve</Button><Button size="sm" variant="outline" onClick={() => refreshAfter(updateExamCentreApproval(centre.id, { approvalStatus: 'suspended' }), 'Centre suspended.')}>Suspend</Button></div></div>)}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sessions & Capacity</CardTitle><CardDescription>Control booking capacity and session approvals.</CardDescription></CardHeader>
          <CardContent className="space-y-3">{data.sessions.map((session) => <div key={session.id} className="rounded-lg border p-4"><div className="flex items-center justify-between gap-2"><div><p className="font-semibold">{session.title}</p><p className="text-sm text-muted-foreground">{session.centreName} · {new Date(session.startsAt).toLocaleString()} · {session.bookingsCount}/{session.capacity} booked</p></div><Badge variant="secondary">{session.status}</Badge></div><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => refreshAfter(updateExamClinicSession(session.id, { status: 'open' }), 'Session opened.')}>Open</Button><Button size="sm" variant="outline" onClick={() => refreshAfter(updateExamClinicSession(session.id, { status: 'closed' }), 'Session closed.')}>Close</Button></div></div>)}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Bookings & Attendance</CardTitle><CardDescription>Confirm arrival, absence, and completion.</CardDescription></CardHeader>
          <CardContent className="space-y-3">{data.bookings.length === 0 ? <p className="text-sm text-muted-foreground">No bookings yet.</p> : data.bookings.map((booking) => <div key={booking.id} className="rounded-lg border p-4"><p className="font-semibold">{booking.studentName ?? booking.studentEmail ?? booking.studentId}</p><p className="text-sm text-muted-foreground">{booking.session?.title} · Attendance {booking.attendance?.status ?? 'scheduled'}</p><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => refreshAfter(markExamAttendance(booking.id, { status: 'present' }), 'Attendance marked present.')}>Present</Button><Button size="sm" variant="outline" onClick={() => refreshAfter(markExamAttendance(booking.id, { status: 'absent' }), 'Attendance marked absent.')}>Absent</Button></div></div>)}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Incidents</CardTitle><CardDescription>Log and review identity, conduct, technical, or safety incidents.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2"><Select value={incidentSessionId} onValueChange={setIncidentSessionId}><SelectTrigger><SelectValue placeholder="Session" /></SelectTrigger><SelectContent>{data.sessions.map((session) => <SelectItem key={session.id} value={String(session.id)}>{session.title}</SelectItem>)}</SelectContent></Select><Select value={incidentSeverity} onValueChange={setIncidentSeverity}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select><Input value={incidentCategory} onChange={(e) => setIncidentCategory(e.target.value)} placeholder="Category" className="md:col-span-2" /><Textarea value={incidentDescription} onChange={(e) => setIncidentDescription(e.target.value)} placeholder="Incident notes" className="md:col-span-2" /><Button onClick={() => refreshAfter(createExamIncident(Number(incidentSessionId), { severity: incidentSeverity, category: incidentCategory, description: incidentDescription }), 'Incident logged.')}>Log Incident</Button></div>
            {data.incidents.map((incident) => <div key={incident.id} className="rounded-lg border p-3"><div className="flex items-center justify-between"><p className="font-medium">{incident.category}</p><Badge variant="outline">{incident.severity}</Badge></div><p className="text-sm text-muted-foreground">{incident.sessionTitle} · {incident.status}</p><p className="mt-2 text-sm">{incident.description}</p></div>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

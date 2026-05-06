'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { bookExamClinicSession, cancelExamBooking, getStudentExamBookings, getStudentExamClinicSessions } from '@/lib/api';
import type { ExamBooking, ExamClinicSession } from '@/lib/api/types';

export default function ExamBookingsPage() {
  const [sessions, setSessions] = useState<ExamClinicSession[]>([]);
  const [bookings, setBookings] = useState<ExamBooking[]>([]);
  const [accommodations, setAccommodations] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const bookedSessionIds = useMemo(() => new Set(bookings.filter((booking) => booking.status !== 'cancelled').map((booking) => booking.sessionId)), [bookings]);

  const load = async () => {
    setLoading(true);
    try {
      const [availableSessions, myBookings] = await Promise.all([getStudentExamClinicSessions(), getStudentExamBookings()]);
      setSessions(availableSessions);
      setBookings(myBookings);
    } catch (error) {
      console.error(error);
      setMessage('Unable to load exam bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const book = async (sessionId: number) => {
    try {
      await bookExamClinicSession(sessionId, accommodations[sessionId]);
      setMessage('Exam session booked successfully.');
      await load();
    } catch (error) {
      console.error(error);
      setMessage('Unable to book this session. It may be full or no longer approved.');
    }
  };

  const cancel = async (bookingId: number) => {
    try {
      await cancelExamBooking(bookingId);
      setMessage('Booking cancelled.');
      await load();
    } catch (error) {
      console.error(error);
      setMessage('Unable to cancel this booking.');
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading exam bookings...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exam Bookings</h1>
        <p className="text-muted-foreground">Book approved hybrid or physical exam clinic sessions and track your attendance status.</p>
      </div>

      {message ? <Card className="border-primary/30"><CardContent className="p-4 text-sm">{message}</CardContent></Card> : null}

      <Card>
        <CardHeader>
          <CardTitle>Available Exam Sessions</CardTitle>
          <CardDescription>Capacity is reserved immediately after booking.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No approved exam clinic sessions are currently open for your programme.
            </div>
          ) : (
            sessions.map((session) => {
              const seatsLeft = Math.max(session.capacity - session.bookingsCount, 0);
              const alreadyBooked = bookedSessionIds.has(session.id);
              return (
                <div key={session.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{session.title}</p>
                        <Badge variant="secondary">{session.deliveryMode}</Badge>
                        <Badge variant={seatsLeft > 0 ? 'outline' : 'destructive'}>{seatsLeft} seats left</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {session.centreName} {session.roomName ? `· ${session.roomName}` : ''} · {new Date(session.startsAt).toLocaleString()} - {new Date(session.endsAt).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Invigilator: {session.invigilatorName ?? 'To be assigned'}</p>
                    </div>
                    <div className="min-w-64 space-y-2">
                      <Textarea
                        value={accommodations[session.id] ?? ''}
                        onChange={(event) => setAccommodations((prev) => ({ ...prev, [session.id]: event.target.value }))}
                        placeholder="Accessibility or accommodation notes (optional)"
                      />
                      <Button className="w-full" disabled={alreadyBooked || seatsLeft === 0} onClick={() => book(session.id)}>
                        {alreadyBooked ? 'Booked' : seatsLeft === 0 ? 'Full' : 'Book Session'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
          <CardDescription>Bring your ID and arrive before the check-in window closes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookings.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">You have not booked an exam clinic session yet.</div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{booking.session?.title ?? `Session ${booking.sessionId}`}</p>
                    <Badge>{booking.status}</Badge>
                    <Badge variant="outline">Attendance: {booking.attendance?.status ?? 'scheduled'}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {booking.session?.centreName} · {booking.session?.startsAt ? new Date(booking.session.startsAt).toLocaleString() : 'Date pending'}
                  </p>
                  {booking.accommodations ? <p className="text-xs text-muted-foreground">Accommodation notes: {booking.accommodations}</p> : null}
                </div>
                {booking.status !== 'cancelled' ? <Button variant="outline" onClick={() => cancel(booking.id)}>Cancel</Button> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

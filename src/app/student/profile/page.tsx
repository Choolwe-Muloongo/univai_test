// src/app/(app)/profile/page.tsx
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BadgeCheck, Edit, GraduationCap, Percent } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BadgeCard } from '@/components/ui/badge-card';
import { type AlumniProfile, type Badge as BadgeType } from '@/lib/api/types';
import { getAlumniProfile, getBadges } from '@/lib/api';
import { useSession } from '@/components/providers/session-provider';

const roleDetails: { [key: string]: { name: string, email: string, avatar: string, school: string } } = {
  'premium-student': { name: 'Premium Student', email: 'student.premium@univai.edu', avatar: 'https://i.pravatar.cc/150?u=student-premium', school: 'School of ICT' },
  'freemium-student': { name: 'Freemium Student', email: 'student.freemium@univai.edu', avatar: 'https://i.pravatar.cc/150?u=student-freemium', school: 'Not Enrolled' },
};


export default function ProfilePage() {
  const { session } = useSession();
  const [user, setUser] = useState({ name: '', email: '', avatar: '', school: '' });
  const [earnedBadges, setEarnedBadges] = useState<BadgeType[]>([]);
  const [alumniProfile, setAlumniProfile] = useState<AlumniProfile | null>(null);

  useEffect(() => {
    const role = session?.user?.role || 'premium-student';
    setUser(
      roleDetails[role] || {
        name: session?.user?.name || 'Student',
        email: session?.user?.email || 'student@univai.edu',
        avatar: session?.user?.avatar || '',
        school: 'UnivAI',
      }
    );
    const loadBadges = async () => {
      const [badgeData, alumniData] = await Promise.allSettled([getBadges(), getAlumniProfile()]);
      if (badgeData.status === 'fulfilled') setEarnedBadges(badgeData.value);
      if (alumniData.status === 'fulfilled') setAlumniProfile(alumniData.value);
    };
    loadBadges();
  }, [session]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-32 w-32 border-4 border-primary">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-4xl">{user.name}</CardTitle>
            <CardDescription className="text-lg">{user.email}</CardDescription>
            <p className="text-muted-foreground">{user.school}</p>
          </div>
          <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold flex items-center justify-center gap-2 mb-4"><BadgeCheck /> Achievements & Badges</h3>
            {earnedBadges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {earnedBadges.map((badge) => (
                        <BadgeCard key={badge.id} badge={badge} />
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground">No badges earned yet. Keep learning to unlock them!</p>
            )}
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /> Alumni status & completed programmes</CardTitle>
          <CardDescription>Alumni discounts use this state plus completion, standing, payment clearance, campaign window, programme levels, and suspension checks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Alumni state</p>
              <p className="text-lg font-semibold capitalize">{alumniProfile?.alumniState ?? 'none'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Account standing</p>
              <p className="text-lg font-semibold capitalize">{alumniProfile?.accountStanding ?? 'good'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Suspension</p>
              <p className="text-lg font-semibold">{alumniProfile?.suspendedAt ? 'Suspended' : 'Clear'}</p>
            </div>
          </div>
          <div className="space-y-2">
            {(alumniProfile?.completedProgrammes ?? []).length > 0 ? alumniProfile?.completedProgrammes.map((programme) => (
              <div key={programme.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-medium">{programme.programTitle ?? programme.programId}</p>
                  <p className="text-sm text-muted-foreground">{programme.programLevel} • completed {programme.completedAt ?? 'date unavailable'} • standing {programme.finalStanding}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{programme.paymentCleared ? 'Payment cleared' : 'Payment not cleared'}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">No completed programme history has been recorded yet.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5 text-primary" /> Alumni discount applications</CardTitle>
          <CardDescription>Automatic discounts appear here immediately; campaigns requiring finance approval remain pending until reviewed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(alumniProfile?.discountApplications ?? []).length > 0 ? alumniProfile?.discountApplications.map((application) => (
            <div key={application.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{application.campaignName}</p>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium capitalize">{application.status}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Requested ${application.requestedDiscountAmount}; approved ${application.approvedDiscountAmount}. {application.previousProgrammeLevel ?? 'Previous level'} → {application.newProgrammeLevel ?? 'new level'}.</p>
            </div>
          )) : <p className="text-sm text-muted-foreground">No alumni discount applications yet.</p>}
        </CardContent>
      </Card>

    </div>
  );
}


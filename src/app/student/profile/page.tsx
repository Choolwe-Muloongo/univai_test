// src/app/(app)/profile/page.tsx
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BadgeCheck, Edit } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BadgeCard } from '@/components/ui/badge-card';
import { type Badge as BadgeType } from '@/lib/data';
import { getBadges } from '@/lib/api';
import { useSession } from '@/components/providers/session-provider';

const roleDetails: { [key: string]: { name: string, email: string, avatar: string, school: string } } = {
  'premium-student': { name: 'Premium Student', email: 'student.premium@univai.edu', avatar: 'https://i.pravatar.cc/150?u=student-premium', school: 'School of ICT' },
  'freemium-student': { name: 'Freemium Student', email: 'student.freemium@univai.edu', avatar: 'https://i.pravatar.cc/150?u=student-freemium', school: 'Not Enrolled' },
};


export default function ProfilePage() {
  const { session } = useSession();
  const [user, setUser] = useState({ name: '', email: '', avatar: '', school: '' });
  const [earnedBadges, setEarnedBadges] = useState<BadgeType[]>([]);

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
      const badgeData = await getBadges();
      setEarnedBadges(badgeData);
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
    </div>
  );
}

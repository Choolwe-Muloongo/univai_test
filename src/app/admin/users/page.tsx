'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  UserPlus,
  UserCog,
  UserRoundCheck,
  UserRoundX,
  RotateCcw,
  KeyRound,
  MailCheck,
  ArrowRight,
} from 'lucide-react';

type UserStatus = 'Pending' | 'Active' | 'Suspended' | 'Archived';
type UserRole = 'Student' | 'Lecturer' | 'Admin' | 'Employer';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  nextRequiredAction: string;
};

const users: AdminUser[] = [
  {
    id: 'USR-1001',
    name: 'Maya Otieno',
    email: 'maya.otieno@univai.edu',
    role: 'Student',
    status: 'Pending',
    nextRequiredAction: 'Assign intake + program + funding status',
  },
  {
    id: 'USR-1002',
    name: 'Leon Kimathi',
    email: 'leon.kimathi@univai.edu',
    role: 'Lecturer',
    status: 'Active',
    nextRequiredAction: 'Assign department + modules + approval status',
  },
  {
    id: 'USR-1003',
    name: 'Amira Hassan',
    email: 'amira.hassan@univai.edu',
    role: 'Admin',
    status: 'Active',
    nextRequiredAction: 'Assign permission scope',
  },
  {
    id: 'USR-1004',
    name: 'GreatWorks HR',
    email: 'careers@greatworks.co',
    role: 'Employer',
    status: 'Suspended',
    nextRequiredAction: 'Verify organization + posting rights',
  },
  {
    id: 'USR-1005',
    name: 'Tariq Mwangi',
    email: 'tariq.mwangi@univai.edu',
    role: 'Student',
    status: 'Archived',
    nextRequiredAction: 'Confirm archival reason and retention window',
  },
];

const tabDefinitions: { label: string; value: 'all' | 'pending' | 'active' | 'suspended' | 'archived' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Archived', value: 'archived' },
];

const nextStepCards: Record<UserRole, { title: string; details: string }> = {
  Student: {
    title: 'Student next step',
    details: 'Assign intake + program + funding status',
  },
  Lecturer: {
    title: 'Lecturer next step',
    details: 'Assign department + modules + approval status',
  },
  Admin: {
    title: 'Admin next step',
    details: 'Assign permission scope',
  },
  Employer: {
    title: 'Employer next step',
    details: 'Verify organization + posting rights',
  },
};

const statusBadgeVariant: Record<UserStatus, 'secondary' | 'default' | 'destructive' | 'outline'> = {
  Pending: 'secondary',
  Active: 'default',
  Suspended: 'destructive',
  Archived: 'outline',
};

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'suspended' | 'archived'>('all');

  const filteredUsers = useMemo(() => {
    if (activeTab === 'all') return users;

    const status =
      activeTab === 'pending'
        ? 'Pending'
        : activeTab === 'active'
          ? 'Active'
          : activeTab === 'suspended'
            ? 'Suspended'
            : 'Archived';

    return users.filter((user) => user.status === status);
  }, [activeTab]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Administration</h1>
          <p className="text-muted-foreground">
            Manage users end-to-end with explicit next required actions so no onboarding or compliance workflow gets blocked.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" /> Invite user
          </Button>
          <Button variant="outline">
            <UserRoundCheck className="mr-2 h-4 w-4" /> Create manually
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User actions</CardTitle>
          <CardDescription>Core admin actions available from this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="justify-start">
            <UserCog className="mr-2 h-4 w-4" /> Assign role
          </Button>
          <Button variant="outline" className="justify-start">
            <RotateCcw className="mr-2 h-4 w-4" /> Reassign role
          </Button>
          <Button variant="outline" className="justify-start">
            <UserRoundX className="mr-2 h-4 w-4" /> Suspend / reactivate
          </Button>
          <Button variant="outline" className="justify-start">
            <KeyRound className="mr-2 h-4 w-4" /> Force password reset
          </Button>
          <Button variant="outline" className="justify-start sm:col-span-2 lg:col-span-1">
            <MailCheck className="mr-2 h-4 w-4" /> Resend invite
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role-based next steps</CardTitle>
          <CardDescription>Contextual cards define what an admin must do next for each role.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(nextStepCards).map(([role, config]) => (
            <Card key={role}>
              <CardHeader>
                <CardTitle className="text-base">{role}</CardTitle>
                <CardDescription>{config.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{config.details}</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="px-0" asChild>
                  <Link href="#users-table">
                    Update now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card id="users-table">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Every row includes a clear next required action to keep workflows moving.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-4">
            <TabsList className="flex w-full flex-wrap justify-start gap-2 bg-transparent p-0">
              {tabDefinitions.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="border">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabDefinitions.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="m-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Next required action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{user.role}</TableCell>
                            <TableCell>
                              <Badge variant={statusBadgeVariant[user.status]}>{user.status}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{user.nextRequiredAction}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No users in this status.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

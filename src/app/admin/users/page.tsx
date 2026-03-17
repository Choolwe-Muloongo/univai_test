'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type UserType = 'student' | 'lecturer' | 'employer' | 'admin';
type UserStatus = 'invited' | 'active' | 'suspended' | 'archived';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  type: UserType;
  role: string;
  status: UserStatus;
};

const roleOptions = ['Registrar', 'Admissions', 'Finance', 'Compliance', 'Super Admin'];

const userTypeNextAction: Record<UserType, string> = {
  student: 'Complete intake and program placement',
  lecturer: 'Finish assignment setup for active courses',
  employer: 'Complete organization verification',
  admin: 'No action required',
};

const initialUsers: AdminUser[] = [
  {
    id: 'USR-1021',
    name: 'Amina Kamau',
    email: 'amina.kamau@student.univai.edu',
    type: 'student',
    role: 'Admissions',
    status: 'active',
  },
  {
    id: 'USR-1022',
    name: 'Dr. Mark Feldman',
    email: 'mark.feldman@univai.edu',
    type: 'lecturer',
    role: 'Registrar',
    status: 'active',
  },
  {
    id: 'USR-1023',
    name: 'Olivia Chen',
    email: 'olivia@futureworks.ai',
    type: 'employer',
    role: 'Compliance',
    status: 'invited',
  },
  {
    id: 'USR-1024',
    name: 'Neil Barnes',
    email: 'neil.barnes@univai.edu',
    type: 'admin',
    role: 'Super Admin',
    status: 'suspended',
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteType, setInviteType] = useState<UserType>('student');
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualType, setManualType] = useState<UserType>('lecturer');

  const activeUsers = useMemo(() => users.filter((user) => user.status !== 'archived').length, [users]);

  const inviteUser = () => {
    if (!inviteEmail.trim()) return;
    setUsers((prev) => [
      {
        id: `USR-${1000 + prev.length + 1}`,
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        type: inviteType,
        role: inviteType === 'admin' ? 'Super Admin' : 'Admissions',
        status: 'invited',
      },
      ...prev,
    ]);
    setInviteEmail('');
  };

  const createManualUser = () => {
    if (!manualName.trim() || !manualEmail.trim()) return;
    setUsers((prev) => [
      {
        id: `USR-${1000 + prev.length + 1}`,
        name: manualName,
        email: manualEmail,
        type: manualType,
        role: manualType === 'admin' ? 'Super Admin' : 'Registrar',
        status: 'active',
      },
      ...prev,
    ]);
    setManualName('');
    setManualEmail('');
  };

  const updateUser = (id: string, updater: (user: AdminUser) => AdminUser) => {
    setUsers((prev) => prev.map((user) => (user.id === id ? updater(user) : user)));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Administration</h1>
        <p className="text-muted-foreground">Manage user onboarding, access, lifecycle, and required next steps.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total users</CardDescription>
            <CardTitle>{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active or invited</CardDescription>
            <CardTitle>{activeUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Archived</CardDescription>
            <CardTitle>{users.filter((user) => user.status === 'archived').length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invite user</CardTitle>
            <CardDescription>Send invitation links for account setup.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@domain.com" />
            </div>
            <div className="space-y-2">
              <Label>User type</Label>
              <Select value={inviteType} onValueChange={(value) => setInviteType(value as UserType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="lecturer">Lecturer</SelectItem>
                  <SelectItem value="employer">Employer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={inviteUser}>Send invite</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create manual user</CardTitle>
            <CardDescription>Create an active user account directly from admin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} placeholder="name@domain.com" />
            </div>
            <div className="space-y-2">
              <Label>User type</Label>
              <Select value={manualType} onValueChange={(value) => setManualType(value as UserType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="lecturer">Lecturer</SelectItem>
                  <SelectItem value="employer">Employer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={createManualUser}>Create user</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Includes role assignment/reassignment, activate/suspend, password reset, invite resend, and archive/restore.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next required action</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </TableCell>
                  <TableCell className="capitalize">{user.type}</TableCell>
                  <TableCell>
                    <Select value={user.role} onValueChange={(value) => updateUser(user.id, (current) => ({ ...current, role: value }))}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === 'active' ? 'default' : user.status === 'suspended' ? 'destructive' : 'secondary'}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{userTypeNextAction[user.type]}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateUser(user.id, (current) => ({
                            ...current,
                            status: current.status === 'active' ? 'suspended' : 'active',
                          }))
                        }
                      >
                        {user.status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                      <Button size="sm" variant="outline">Force password reset</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateUser(user.id, (current) => ({ ...current, status: 'invited' }))}
                      >
                        Resend invite
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateUser(user.id, (current) => ({
                            ...current,
                            status: current.status === 'archived' ? 'active' : 'archived',
                          }))
                        }
                      >
                        {user.status === 'archived' ? 'Restore' : 'Archive'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Mail, PauseCircle, PlayCircle, ShieldPlus, UserPlus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { createManagedUser, getAdminUsers, transitionManagedUser, updateManagedUser } from '@/lib/api';
import type { ManagedUser, RoleCapabilities } from '@/lib/api/types';

type UserStatus = 'invited' | 'pending' | 'active' | 'suspended' | 'applicant' | 'needs_information' | 'enrolled' | 'probation';

const starterUsers: ManagedUser[] = [
  {
    id: 'usr-1001',
    name: 'Aisha Bello',
    email: 'aisha.bello@univai.edu',
    role: 'student',
    status: 'active',
    unit: 'Engineering · Intake 2026-A',
    notes: 'Assigned to Computer Engineering pathway.',
  },
  {
    id: 'usr-1002',
    name: 'Dr. Samuel Owusu',
    email: 'samuel.owusu@univai.edu',
    role: 'lecturer',
    status: 'pending',
    unit: 'School of Data Science',
    notes: 'Pending HR and credential verification.',
  },
  {
    id: 'usr-1003',
    name: 'Ruth Moyo',
    email: 'ruth.moyo@partnercorp.com',
    role: 'employer',
    status: 'invited',
    unit: 'Partner: PartnerCorp',
    notes: 'Invite expires in 4 days.',
  },
  {
    id: 'usr-1004',
    name: 'Martin Dube',
    email: 'martin.dube@univai.edu',
    role: 'admin',
    status: 'suspended',
    unit: 'Platform Operations',
    notes: 'Temporary suspension due to policy review.',
  },
];

const roleSuggestions = [
  'super-admin',
  'admin',
  'normal-admin',
  'admissions-admin',
  'lecturer-admin',
  'employer-verification-admin',
  'finance-admin',
  'read-only-admin',
  'exam-officer',
  'student',
  'free-student',
  'certificate-student',
  'premium-student',
  'programme-student',
  'lecturer',
  'employer',
  'applicant',
  'lecturer-applicant',
  'employer-applicant',
];

const statusStyles: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  invited: 'outline',
  pending: 'secondary',
  applicant: 'secondary',
  needs_information: 'secondary',
  enrolled: 'default',
  probation: 'outline',
  active: 'default',
  suspended: 'destructive',
};

function nextStatus(currentStatus: string): UserStatus {
  if (currentStatus === 'invited') return 'pending';
  if (currentStatus === 'pending' || currentStatus === 'applicant' || currentStatus === 'needs_information') return 'active';
  if (currentStatus === 'active' || currentStatus === 'enrolled') return 'suspended';
  return 'active';
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>(starterUsers);
  const [roleCapabilities, setRoleCapabilities] = useState<Record<string, RoleCapabilities>>({});
  const [selectedUserId, setSelectedUserId] = useState(starterUsers[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('student');
  const [inviteUnit, setInviteUnit] = useState('');
  const [inviteNote, setInviteNote] = useState('');

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesRole = roleFilter === 'all' || user.role.toLowerCase() === roleFilter;

      const matchesSearch =
        normalizedQuery.length === 0 ||
        [user.name, user.email, user.role, user.unit, user.id].some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        );

      return matchesStatus && matchesRole && matchesSearch;
    });
  }, [users, searchQuery, statusFilter, roleFilter]);


  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const response = await getAdminUsers();
        if (response.data.length > 0) {
          setUsers(response.data);
          setSelectedUserId(response.data[0].id);
        }
        setRoleCapabilities(response.roleCapabilities);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    if (filteredUsers.length === 0) {
      return;
    }

    const selectedUserIsVisible = filteredUsers.some((user) => user.id === selectedUserId);
    if (!selectedUserIsVisible) {
      setSelectedUserId(filteredUsers[0].id);
    }
  }, [filteredUsers, selectedUserId]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? users[0],
    [selectedUserId, users]
  );

  const updateUser = (id: string, updates: Partial<ManagedUser>) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) => {
        if (user.id !== id) return user;
        return { ...user, ...updates };
      })
    );
  };

  const handleLifecycleAction = async (id: string, status: string) => {
    const updated = await transitionManagedUser(id, nextStatus(status), `Admin moved user from ${status} to ${nextStatus(status)}.`);
    updateUser(id, updated);
  };

  const handleSuspend = async (id: string) => {
    const updated = await transitionManagedUser(id, 'suspended', 'Admin suspended platform access.');
    updateUser(id, updated);
  };

  const handleReInvite = async (id: string) => {
    const updated = await transitionManagedUser(id, 'invited', 'Invitation refreshed and queued for onboarding delivery.');
    updateUser(id, { ...updated, notes: 'Invitation refreshed and queued for onboarding delivery.' });
  };

  const handleCreateInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim() || !inviteRole.trim()) {
      return;
    }

    const newUser = await createManagedUser({
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole.trim().toLowerCase(),
      state: 'invited',
      unit: inviteUnit.trim() || 'Unassigned',
      notes: inviteNote.trim() || 'Ready for onboarding email and operational assignment.',
    });

    setUsers((currentUsers) => [newUser, ...currentUsers]);
    setSelectedUserId(newUser.id);
    setInviteName('');
    setInviteEmail('');
    setInviteRole('student');
    setInviteUnit('');
    setInviteNote('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage identities, invitations, lifecycle statuses, and role assignments across university operations.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Directory</CardTitle>
            <CardDescription>
              {isLoading ? 'Loading the live backend user directory...' : 'Live backend directory for active, pending, invited, and suspended platform users. Select a row to inspect details and take actions.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <Input
                placeholder="Search by name, email, role, unit, or ID"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {roleSuggestions.map((role) => (
                    <SelectItem key={role} value={role} className="capitalize">
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Operational Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className="cursor-pointer"
                    data-state={selectedUserId === user.id ? 'selected' : undefined}
                  >
                    <TableCell>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>
                      <Badge variant={statusStyles[user.status] ?? 'outline'} className="capitalize">
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.unit}</TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      No users match the current search and filter criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create / Invite User</CardTitle>
            <CardDescription>
              Add users now and assign a role immediately. Supports core roles and future role labels.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Full name</Label>
              <Input id="invite-name" value={inviteName} onChange={(event) => setInviteName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Input
                id="invite-role"
                list="role-options"
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
              />
              <datalist id="role-options">
                {roleSuggestions.map((role) => (
                  <option key={role} value={role} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-unit">Intake / Program / Department</Label>
              <Input id="invite-unit" value={inviteUnit} onChange={(event) => setInviteUnit(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-note">Onboarding note</Label>
              <Textarea
                id="invite-note"
                value={inviteNote}
                onChange={(event) => setInviteNote(event.target.value)}
                placeholder="Add context for admissions, department heads, or HR"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleCreateInvite} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" /> Create User Invite
            </Button>
          </CardFooter>
        </Card>
      </div>

      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>User Detail</span>
              <Badge variant={statusStyles[selectedUser.status] ?? 'outline'} className="capitalize">
                {selectedUser.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              {selectedUser.name} · {selectedUser.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assigned Role</p>
                <p className="mt-2 text-base font-medium capitalize">{selectedUser.role}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operational Unit</p>
                <p className="mt-2 text-base font-medium">{selectedUser.unit}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lifecycle ID</p>
                <p className="mt-2 text-base font-medium">{selectedUser.id}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Status-specific actions</p>
              <div className="flex flex-wrap gap-3">
                {selectedUser.status === 'invited' && (
                  <>
                    <Button variant="outline" onClick={() => handleReInvite(selectedUser.id)}>
                      <Mail className="mr-2 h-4 w-4" /> Resend Invite
                    </Button>
                    <Button onClick={() => handleLifecycleAction(selectedUser.id, selectedUser.status)}>
                      <ArrowRight className="mr-2 h-4 w-4" /> Mark as Pending
                    </Button>
                  </>
                )}

                {selectedUser.status === 'pending' && (
                  <>
                    <Button onClick={() => handleLifecycleAction(selectedUser.id, selectedUser.status)}>
                      <PlayCircle className="mr-2 h-4 w-4" /> Activate Access
                    </Button>
                    <Button variant="outline" onClick={() => handleReInvite(selectedUser.id)}>
                      <Mail className="mr-2 h-4 w-4" /> Send Reminder
                    </Button>
                  </>
                )}

                {selectedUser.status === 'active' && (
                  <>
                    <Button variant="outline" onClick={() => handleSuspend(selectedUser.id)}>
                      <PauseCircle className="mr-2 h-4 w-4" /> Suspend User
                    </Button>
                    <Button onClick={async () => updateUser(selectedUser.id, await updateManagedUser(selectedUser.id, { notes: 'Security review requested by admin.' }))}>
                      <ShieldPlus className="mr-2 h-4 w-4" /> Trigger Review
                    </Button>
                  </>
                )}

                {selectedUser.status === 'suspended' && (
                  <>
                    <Button onClick={async () => updateUser(selectedUser.id, await transitionManagedUser(selectedUser.id, 'active', 'Admin reactivated platform access.'))}>
                      <PlayCircle className="mr-2 h-4 w-4" /> Reactivate User
                    </Button>
                    <Button variant="outline" onClick={() => handleReInvite(selectedUser.id)}>
                      <Mail className="mr-2 h-4 w-4" /> Send Reactivation Plan
                    </Button>
                  </>
                )}
              </div>
            </div>

            {selectedUser.capabilities && (
              <div className="rounded-lg border bg-blue-50 p-4 text-sm">
                <p className="font-semibold">Role capability source of truth</p>
                <p className="mt-1 text-muted-foreground">{selectedUser.capabilities.dashboard}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(selectedUser.capabilities)
                    .filter(([key, value]) => key.startsWith('can') && value === true)
                    .map(([key]) => <Badge key={key} variant="secondary">{key.replace(/([A-Z])/g, ' $1')}</Badge>)}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Reports: {selectedUser.capabilities.reports.join(', ')}</p>
              </div>
            )}

            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-semibold">Post-creation operational next steps</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Send onboarding email with institution policies and role-based access instructions.</li>
                <li>Assign the user to intake, program, and/or department owner queues.</li>
                <li>Notify admissions, HR, or faculty operations to complete manual checks.</li>
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Current note: {selectedUser.notes ?? 'No operational note set.'} {roleCapabilities[selectedUser.role] ? `Backend policy: ${roleCapabilities[selectedUser.role].dashboard}` : ''}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link href="/admin/dashboard">Back to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

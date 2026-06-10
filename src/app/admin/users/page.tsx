'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CreditCard, KeyRound, Loader2, NotebookPen, PauseCircle, PlayCircle, RefreshCw, Save, ShieldCheck, UserPlus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api/client';

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  accountState?: string | null;
  verificationStatus?: string | null;
  schoolId?: string | null;
  programId?: string | null;
  intakeId?: string | null;
  unit: string;
  notes?: string | null;
  entitlements?: string[] | null;
  mustChangePassword?: boolean | null;
};

type AdminNote = { id: number; note: string; adminName: string; createdAt?: string | null };
type AdminInvoice = { id: number; title: string; description?: string | null; amount: string; currency: string; paidAmount: string; status: string; type?: string | null; dueDate?: string | null; paidAt?: string | null };
type AdminPayment = { id: number; invoiceId: number; amount: string; currency: string; method?: string | null; provider?: string | null; reference?: string | null; status: string; paidAt?: string | null };

const roleSuggestions = [
  'super-admin', 'admin', 'normal-admin', 'admissions-admin', 'lecturer-admin', 'finance-admin', 'read-only-admin', 'exam-officer',
  'student', 'free-student', 'certificate-student', 'premium-student', 'programme-student', 'lecturer', 'employer', 'instructor', 'applicant',
];

const entitlementSuggestions = ['student_portal', 'short-course-access', 'course_access', 'ai_tutor', 'programme-access', 'premium-access', 'certificate-access', 'admin_portal', 'teaching', 'employer_portal', 'instructor_portal', 'instructor_ai'];

const statusStyles: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  invited: 'outline', pending: 'secondary', applicant: 'secondary', needs_information: 'secondary', enrolled: 'default', probation: 'outline', active: 'default', suspended: 'destructive', disabled: 'destructive',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('student');
  const [inviteNote, setInviteNote] = useState('');

  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('student');
  const [editSchool, setEditSchool] = useState('');
  const [editProgram, setEditProgram] = useState('');
  const [editIntake, setEditIntake] = useState('');
  const [editEntitlements, setEditEntitlements] = useState('');

  const [newNote, setNewNote] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [resetReason, setResetReason] = useState('Customer care password reset.');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [invoiceTitle, setInvoiceTitle] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceCurrency, setInvoiceCurrency] = useState('ZMW');
  const [invoiceDescription, setInvoiceDescription] = useState('');

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesRole = roleFilter === 'all' || user.role.toLowerCase() === roleFilter;
      const matchesSearch = normalizedQuery.length === 0 || [user.name, user.email, user.role, user.unit, user.id].some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery));
      return matchesStatus && matchesRole && matchesSearch;
    });
  }, [users, searchQuery, statusFilter, roleFilter]);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const response = await apiFetch<{ data: ManagedUser[] }>('/admin/users');
      setUsers(response.data);
      if (!selectedUserId && response.data[0]) setSelectedUserId(response.data[0].id);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSelectedUser(id: string) {
    if (!id) return;
    const [profile, noteResponse, paymentResponse] = await Promise.all([
      apiFetch<ManagedUser>(`/admin/users/${id}`),
      apiFetch<{ items: AdminNote[] }>(`/admin/users/${id}/notes`),
      apiFetch<{ invoices: AdminInvoice[]; payments: AdminPayment[] }>(`/admin/users/${id}/payments`),
    ]);
    setSelectedUser(profile);
    setNotes(noteResponse.items);
    setInvoices(paymentResponse.invoices);
    setPayments(paymentResponse.payments);
    setEditName(profile.name);
    setEditRole(profile.role);
    setEditSchool(profile.schoolId ?? '');
    setEditProgram(profile.programId ?? '');
    setEditIntake(profile.intakeId ?? '');
    setEditEntitlements((profile.entitlements ?? []).join(', '));
  }

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { loadSelectedUser(selectedUserId); }, [selectedUserId]);

  async function createUser() {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    const user = await apiFetch<ManagedUser>('/admin/users', {
      method: 'POST',
      body: JSON.stringify({ name: inviteName.trim(), email: inviteEmail.trim(), role: inviteRole.trim(), state: 'invited', notes: inviteNote.trim() }),
    });
    setUsers((current) => [user, ...current]);
    setSelectedUserId(user.id);
    setInviteName(''); setInviteEmail(''); setInviteRole('student'); setInviteNote('');
  }

  async function saveProfile() {
    if (!selectedUser) return;
    const updated = await apiFetch<ManagedUser>(`/admin/users/${selectedUser.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: editName, role: editRole, schoolId: editSchool || null, programId: editProgram || null, intakeId: editIntake || null }),
    });
    const entitlements = editEntitlements.split(',').map((item) => item.trim()).filter(Boolean);
    const full = await apiFetch<ManagedUser>(`/admin/users/${selectedUser.id}/entitlements`, {
      method: 'POST',
      body: JSON.stringify({ entitlements }),
    });
    setUsers((current) => current.map((user) => user.id === selectedUser.id ? { ...user, ...updated, ...full } : user));
    setSelectedUser(full);
    setMessage('User profile and access updated.');
  }

  async function resetPassword() {
    if (!selectedUser) {
      setActionError('Failed to update password: no user selected.');
      return;
    }

    const customPassword = temporaryPassword.trim();
    if (customPassword && customPassword.length < 6) {
      setActionError('Failed to update password: password must be at least 6 characters.');
      return;
    }

    setIsResettingPassword(true);
    setMessage('');
    setActionError('');

    try {
      const response = await apiFetch<{ temporaryPassword?: string; password?: string; user?: ManagedUser }>(`/admin/users/${encodeURIComponent(selectedUser.id)}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({
          temporaryPassword: customPassword || undefined,
          password: customPassword || undefined,
          newPassword: customPassword || undefined,
          forceChange: true,
          reason: resetReason.trim() || 'Customer care password reset.',
        }),
        loadingLabel: 'Updating password...',
        successMessage: 'Password updated successfully.',
      });
      const nextPassword = response.temporaryPassword || response.password || customPassword;
      setGeneratedPassword(nextPassword);
      if (response.user) {
        setSelectedUser(response.user);
        setUsers((current) => current.map((user) => user.id === response.user?.id ? { ...user, ...response.user } : user));
      }
      setTemporaryPassword('');
      setMessage('Password updated successfully. Copy the temporary password before leaving this page.');
    } catch (cause) {
      setActionError(`Failed to update password: ${cause instanceof Error ? cause.message : 'unknown error'}`);
    } finally {
      setIsResettingPassword(false);
    }
  }

  async function suspendUser() {
    if (!selectedUser) return;
    const updated = await apiFetch<ManagedUser>(`/admin/users/${selectedUser.id}/suspend`, { method: 'POST', body: JSON.stringify({ reason: 'Suspended by admin from customer care.' }) });
    setSelectedUser(updated); await loadUsers();
  }

  async function reactivateUser() {
    if (!selectedUser) return;
    const updated = await apiFetch<ManagedUser>(`/admin/users/${selectedUser.id}/reactivate`, { method: 'POST', body: JSON.stringify({ reason: 'Reactivated by admin from customer care.' }) });
    setSelectedUser(updated); await loadUsers();
  }

  async function addNote() {
    if (!selectedUser || !newNote.trim()) return;
    const note = await apiFetch<AdminNote>(`/admin/users/${selectedUser.id}/notes`, { method: 'POST', body: JSON.stringify({ note: newNote.trim() }) });
    setNotes((current) => [note, ...current]);
    setNewNote('');
  }

  async function createInvoice() {
    if (!selectedUser || !invoiceTitle.trim() || !invoiceAmount) return;
    const invoice = await apiFetch<AdminInvoice>(`/admin/users/${selectedUser.id}/invoices`, {
      method: 'POST',
      body: JSON.stringify({ title: invoiceTitle, amount: Number(invoiceAmount), currency: invoiceCurrency, description: invoiceDescription }),
    });
    setInvoices((current) => [invoice, ...current]);
    setInvoiceTitle(''); setInvoiceAmount(''); setInvoiceDescription('');
  }

  async function markPaid(invoiceId: number) {
    if (!selectedUser) return;
    const invoice = await apiFetch<AdminInvoice>(`/admin/users/${selectedUser.id}/invoices/${invoiceId}/mark-paid`, { method: 'POST', body: JSON.stringify({ method: 'manual', note: 'Marked paid by admin.' }) });
    setInvoices((current) => current.map((item) => item.id === invoiceId ? invoice : item));
    await loadSelectedUser(selectedUser.id);
  }

  async function markUnpaid(invoiceId: number) {
    if (!selectedUser) return;
    const invoice = await apiFetch<AdminInvoice>(`/admin/users/${selectedUser.id}/invoices/${invoiceId}/mark-unpaid`, { method: 'POST', body: JSON.stringify({ note: 'Marked unpaid by admin.' }) });
    setInvoices((current) => current.map((item) => item.id === invoiceId ? invoice : item));
    await loadSelectedUser(selectedUser.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management & Customer Care</h1>
          <p className="text-muted-foreground">Manage users, reset passwords, suspend/reactivate accounts, notes, invoices, and access.</p>
        </div>
        <Button variant="outline" onClick={loadUsers}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
      </div>

      {message ? <div className="rounded-xl border bg-primary/5 p-3 text-sm text-primary">{message}</div> : null}
      {actionError ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{actionError}</div> : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Directory</CardTitle>
            <CardDescription>{isLoading ? 'Loading users...' : 'Search, filter, and select a user to manage.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <Input placeholder="Search name, email, role, ID" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="invited">Invited</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem>{roleSuggestions.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Unit</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredUsers.map((user) => <TableRow key={user.id} onClick={() => setSelectedUserId(user.id)} className="cursor-pointer" data-state={selectedUserId === user.id ? 'selected' : undefined}><TableCell><p className="font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></TableCell><TableCell>{user.role}</TableCell><TableCell><Badge variant={statusStyles[user.status] ?? 'outline'}>{user.status}</Badge></TableCell><TableCell>{user.unit}</TableCell></TableRow>)}
                {filteredUsers.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">No users found.</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Create / Invite User</CardTitle><CardDescription>Add a user and assign a role.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Full name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
            <Input placeholder="Email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            <Input placeholder="Role" list="role-options" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} />
            <datalist id="role-options">{roleSuggestions.map((role) => <option key={role} value={role} />)}</datalist>
            <Textarea placeholder="Admin note" value={inviteNote} onChange={(e) => setInviteNote(e.target.value)} />
          </CardContent>
          <CardFooter><Button onClick={createUser} className="w-full"><UserPlus className="mr-2 h-4 w-4" /> Create User</Button></CardFooter>
        </Card>
      </div>

      {selectedUser ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Profile & Access</CardTitle><CardDescription>{selectedUser.name} · {selectedUser.email}</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2"><div><Label>Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div><div><Label>Role</Label><Input list="role-options" value={editRole} onChange={(e) => setEditRole(e.target.value)} /></div></div>
              <div className="grid gap-3 md:grid-cols-3"><div><Label>School</Label><Input value={editSchool} onChange={(e) => setEditSchool(e.target.value)} /></div><div><Label>Program</Label><Input value={editProgram} onChange={(e) => setEditProgram(e.target.value)} /></div><div><Label>Intake</Label><Input value={editIntake} onChange={(e) => setEditIntake(e.target.value)} /></div></div>
              <div><Label>Entitlements, comma-separated</Label><Textarea value={editEntitlements} onChange={(e) => setEditEntitlements(e.target.value)} /><p className="mt-1 text-xs text-muted-foreground">Common: {entitlementSuggestions.join(', ')}</p></div>
              <div className="flex flex-wrap gap-2"><Button onClick={saveProfile}><Save className="mr-2 h-4 w-4" /> Save profile/access</Button>{selectedUser.status === 'suspended' ? <Button onClick={reactivateUser}><PlayCircle className="mr-2 h-4 w-4" /> Reactivate</Button> : <Button variant="outline" onClick={suspendUser}><PauseCircle className="mr-2 h-4 w-4" /> Suspend</Button>}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Password Reset</CardTitle><CardDescription>Generate or set a temporary password for customer care.</CardDescription></CardHeader>
            <CardContent className="space-y-3"><Input placeholder="Optional custom temporary password" value={temporaryPassword} onChange={(e) => setTemporaryPassword(e.target.value)} minLength={6} /><Textarea value={resetReason} onChange={(e) => setResetReason(e.target.value)} /><Button onClick={resetPassword} disabled={isResettingPassword}><KeyRound className="mr-2 h-4 w-4" /> {isResettingPassword ? 'Updating password...' : 'Reset password'}</Button>{generatedPassword ? <div className="rounded-lg border p-3 text-sm"><p className="font-semibold">Temporary password</p><code>{generatedPassword}</code></div> : null}</CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Admin Notes</CardTitle><CardDescription>Customer care history for this user.</CardDescription></CardHeader>
            <CardContent className="space-y-3"><Textarea placeholder="Example: Student called about login issue..." value={newNote} onChange={(e) => setNewNote(e.target.value)} /><Button onClick={addNote}><NotebookPen className="mr-2 h-4 w-4" /> Add note</Button><div className="space-y-2">{notes.map((note) => <div key={note.id} className="rounded-lg border p-3 text-sm"><p>{note.note}</p><p className="mt-1 text-xs text-muted-foreground">{note.adminName} · {note.createdAt ? new Date(note.createdAt).toLocaleString() : ''}</p></div>)}</div></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payments & Invoices</CardTitle><CardDescription>Create invoice, mark paid/unpaid manually, and view payment records.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-4"><Input placeholder="Invoice title" value={invoiceTitle} onChange={(e) => setInvoiceTitle(e.target.value)} /><Input placeholder="Amount" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} /><Input placeholder="Currency" value={invoiceCurrency} onChange={(e) => setInvoiceCurrency(e.target.value)} /><Button onClick={createInvoice}><CreditCard className="mr-2 h-4 w-4" /> Create</Button></div>
              <Textarea placeholder="Description" value={invoiceDescription} onChange={(e) => setInvoiceDescription(e.target.value)} />
              <div className="space-y-2">{invoices.map((invoice) => <div key={invoice.id} className="rounded-lg border p-3 text-sm"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold">{invoice.title}</p><p className="text-muted-foreground">{invoice.currency} {invoice.amount} · {invoice.status}</p></div><div className="flex gap-2">{invoice.status === 'paid' ? <Button size="sm" variant="outline" onClick={() => markUnpaid(invoice.id)}>Mark unpaid</Button> : <Button size="sm" onClick={() => markPaid(invoice.id)}>Mark paid</Button>}</div></div></div>)}</div>
              <div><p className="mb-2 text-sm font-semibold">Payment records</p>{payments.map((payment) => <p key={payment.id} className="text-xs text-muted-foreground">#{payment.id} Invoice {payment.invoiceId}: {payment.currency} {payment.amount} · {payment.status} · {payment.reference}</p>)}</div>
            </CardContent>
          </Card>
        </div>
      ) : isLoading ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div> : null}

      <Button variant="outline" asChild><Link href="/admin/dashboard"><ShieldCheck className="mr-2 h-4 w-4" /> Back to Dashboard</Link></Button>
    </div>
  );
}

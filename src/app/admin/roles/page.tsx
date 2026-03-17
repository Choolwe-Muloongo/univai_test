'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type RoleName = 'Registrar' | 'Admissions' | 'Finance' | 'Compliance' | 'Super Admin';

type ActionPermission = {
  key: string;
  label: string;
  roles: RoleName[];
};

type RoleAuditEntry = {
  id: string;
  role: RoleName;
  action: string;
  actor: string;
  timestamp: string;
};

const roleBundles: { role: RoleName; description: string; bundle: string[] }[] = [
  {
    role: 'Registrar',
    description: 'Program and academic operations control.',
    bundle: ['Manage intakes', 'Assign lecturers', 'Override placements'],
  },
  {
    role: 'Admissions',
    description: 'Applicant onboarding and enrollment governance.',
    bundle: ['Review applicants', 'Issue offers', 'Manage onboarding'],
  },
  {
    role: 'Finance',
    description: 'Payments and financial compliance actions.',
    bundle: ['Approve fee plans', 'Issue invoices', 'Reconcile payments'],
  },
  {
    role: 'Compliance',
    description: 'Policy enforcement and risk controls.',
    bundle: ['Audit access', 'Manage policy exceptions', 'Verify employer docs'],
  },
  {
    role: 'Super Admin',
    description: 'Full platform authority across all modules.',
    bundle: ['Global access', 'Emergency overrides', 'Role governance'],
  },
];

const initialPermissions: ActionPermission[] = [
  { key: 'invite_users', label: 'Invite users', roles: ['Admissions', 'Registrar', 'Super Admin'] },
  { key: 'reset_password', label: 'Force password reset', roles: ['Compliance', 'Super Admin'] },
  { key: 'assign_roles', label: 'Assign/reassign roles', roles: ['Registrar', 'Super Admin'] },
  { key: 'suspend_account', label: 'Suspend/restore account', roles: ['Compliance', 'Super Admin'] },
  { key: 'approve_intake', label: 'Approve intake placement', roles: ['Admissions', 'Registrar', 'Super Admin'] },
  { key: 'verify_employer', label: 'Verify employer organization', roles: ['Compliance', 'Admissions', 'Super Admin'] },
  { key: 'manage_billing', label: 'Manage billing and invoices', roles: ['Finance', 'Super Admin'] },
];

const roleAuditHistory: RoleAuditEntry[] = [
  {
    id: 'AUD-3391',
    role: 'Registrar',
    action: 'Added action permission: Approve intake placement',
    actor: 'Cynthia Oduor',
    timestamp: '2026-02-24 09:13 UTC',
  },
  {
    id: 'AUD-3392',
    role: 'Compliance',
    action: 'Removed action permission: Manage billing and invoices',
    actor: 'Gavin Wills',
    timestamp: '2026-02-24 10:22 UTC',
  },
  {
    id: 'AUD-3393',
    role: 'Super Admin',
    action: 'Granted role to user: Neil Barnes',
    actor: 'System Root',
    timestamp: '2026-02-24 10:49 UTC',
  },
];

export default function AdminRolesPage() {
  const [permissions, setPermissions] = useState<ActionPermission[]>(initialPermissions);

  const togglePermission = (permissionKey: string, role: RoleName) => {
    setPermissions((prev) =>
      prev.map((permission) => {
        if (permission.key !== permissionKey) return permission;

        const hasRole = permission.roles.includes(role);
        return {
          ...permission,
          roles: hasRole ? permission.roles.filter((existing) => existing !== role) : [...permission.roles, role],
        };
      })
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Role Administration</h1>
        <p className="text-muted-foreground">Configure role bundles, action-level permissions, and track role audit history.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roleBundles.map((bundle) => (
          <Card key={bundle.role}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {bundle.role} <Badge variant="secondary">Bundle</Badge>
              </CardTitle>
              <CardDescription>{bundle.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {bundle.bundle.map((item) => (
                <p key={item} className="rounded-md border px-3 py-2 text-muted-foreground">
                  {item}
                </p>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Action-level permissions</CardTitle>
          <CardDescription>Enable or revoke explicit actions for each permission bundle.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                {roleBundles.map((role) => (
                  <TableHead key={role.role}>{role.role}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.key}>
                  <TableCell className="font-medium">{permission.label}</TableCell>
                  {roleBundles.map((role) => (
                    <TableCell key={`${permission.key}-${role.role}`}>
                      <Checkbox
                        checked={permission.roles.includes(role.role)}
                        onCheckedChange={() => togglePermission(permission.key, role.role)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="outline">Save permission changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role audit history</CardTitle>
          <CardDescription>Latest role and permission governance events.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Audit ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roleAuditHistory.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.id}</TableCell>
                  <TableCell>{entry.role}</TableCell>
                  <TableCell>{entry.action}</TableCell>
                  <TableCell>{entry.actor}</TableCell>
                  <TableCell>{entry.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

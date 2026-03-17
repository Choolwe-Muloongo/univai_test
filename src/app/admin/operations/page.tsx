import { getSession } from '@/lib/api';
import { getAdminOperationsQueue } from '@/lib/admin-operations';
import { OperationsClient } from './operations-client';

export default async function AdminOperationsPage() {
  const [session, items] = await Promise.all([getSession(), getAdminOperationsQueue()]);
  const currentAdmin = session.user?.name ?? session.user?.email ?? 'Current Admin';

  return <OperationsClient items={items} currentAdmin={currentAdmin} />;
}

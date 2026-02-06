import { AppShell } from '@/components/layout/app-shell';

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="employer">{children}</AppShell>;
}

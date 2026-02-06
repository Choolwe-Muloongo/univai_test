import { AppShell } from '@/components/layout/app-shell';

export default function LecturerLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="lecturer">{children}</AppShell>;
}

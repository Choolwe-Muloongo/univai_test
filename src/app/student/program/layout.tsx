import { ProgramNav } from '@/components/program/program-nav';

export default function ProgramLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <ProgramNav />
      {children}
    </div>
  );
}

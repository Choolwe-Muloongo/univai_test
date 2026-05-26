import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getRoleIntentOptions, type RoleKey } from '@/lib/auth-routing';

type RoleIntentSwitcherProps = {
  currentRole?: RoleKey;
  compact?: boolean;
};

export function RoleIntentSwitcher({ currentRole, compact = false }: RoleIntentSwitcherProps) {
  const roleOptions = getRoleIntentOptions();

  return (
    <div className="w-full space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div>
        <p className="text-sm font-semibold text-foreground">Signing in as someone else?</p>
        <p className="text-xs text-muted-foreground">
          Choose the portal that matches your account.
        </p>
      </div>

      <div className={compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
        {roleOptions.map((option) => {
          const isActive = option.key === currentRole;

          return (
            <Link
              key={option.key}
              href={option.loginPath}
              className={`rounded-lg border p-2 text-left transition hover:border-emerald-500/70 hover:bg-white ${
                isActive ? 'border-emerald-600 bg-white text-emerald-800 shadow-sm' : 'border-slate-200 text-slate-700'
              }`}
            >
              <p className="text-sm font-medium">{option.label}</p>
              {!compact && <p className="text-xs text-muted-foreground">{option.description}</p>}
            </Link>
          );
        })}
      </div>

      <div className="rounded-lg bg-white p-2 text-xs text-muted-foreground">
        Not sure where to begin?
        <Button asChild variant="link" className="h-auto px-1 py-0 text-xs text-emerald-700">
          <Link href="/start">Get guided help</Link>
        </Button>
      </div>
    </div>
  );
}

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
    <div className="w-full space-y-3 rounded-lg border border-dashed p-3">
      <div>
        <p className="text-sm font-semibold text-foreground">Role & intent gateway</p>
        <p className="text-xs text-muted-foreground">
          Choose your portal based on what you want to do.
        </p>
      </div>

      <div className={compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
        {roleOptions.map((option) => {
          const isActive = option.key === currentRole;

          return (
            <Link
              key={option.key}
              href={option.loginPath}
              className={`rounded-md border p-2 text-left transition hover:border-primary/60 hover:bg-muted ${
                isActive ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <p className="text-sm font-medium text-foreground">{option.label}</p>
              {!compact && <p className="text-xs text-muted-foreground">{option.description}</p>}
            </Link>
          );
        })}
      </div>

      <div className="rounded-md bg-muted/70 p-2 text-xs text-muted-foreground">
        Not sure where to begin?
        <Button asChild variant="link" className="h-auto px-1 py-0 text-xs">
          <Link href="/start">I don’t know where to start</Link>
        </Button>
      </div>
    </div>
  );
}

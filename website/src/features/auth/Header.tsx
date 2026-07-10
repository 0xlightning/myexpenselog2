import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { ThemeToggle } from '../../components/ThemeToggle';
import { logOut } from '../../lib/auth';
import { useAppSelector } from '../../app/hooks';
import type { RootState } from '../../app/store';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/income', label: 'Income' },
  { to: '/expenditure', label: 'Expenditure' },
  { to: '/investments', label: 'Investments' },
];

export function Header(): JSX.Element {
  const user = useAppSelector((s: RootState) => s.auth.user);
  const navigate = useNavigate();

  async function onSignOut(): Promise<void> {
    await logOut();
    navigate('/login', { replace: true });
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="container flex h-14 flex-wrap items-center justify-between gap-2">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-sm font-semibold">myexpense-log</span>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'text-sm',
                  isActive
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground md:inline">
            {user?.email ?? ''}
          </span>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}

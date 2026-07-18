
import * as React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, TrendingDown, Wallet, LogOut } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { useAppSelector } from '../app/hooks';
import { logOut } from '../lib/auth';

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/income', label: 'Income', icon: TrendingUp },
  { to: '/expenditure', label: 'Expenditure', icon: TrendingDown },
  { to: '/investments', label: 'Investments', icon: Wallet },
];

export function AppShell({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const navigate = useNavigate();
  const auth = useAppSelector((s) => s.auth);
  const user = auth.user;

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch {
      // ignore
    }
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card px-4">
        <BrandMark size="default" />
        <button
          type="button"
          onClick={() => setMobileNavOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-accent"
          aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-card">
        <div className="lg:flex-1 lg:overflow-y-auto">
          <div className="flex h-16 items-center px-6">
            <BrandMark size="default" />
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border p-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold">
              {user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.email || 'Signed in'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Nav Drawer */}
      {mobileNavOpen ? (
        <nav className="lg:hidden fixed inset-x-0 top-16 z-30 bottom-0 flex flex-col gap-2 border-r border-border bg-card p-4">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} mobile onClick={() => setMobileNavOpen(false)} />
          ))}
          <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </nav>
      ) : null}

      {/* Main Content */}
      <main className={cn('min-h-screen', 'lg:pl-64')}>{children}</main>
    </>
  );
}

function NavItem({ to, label, icon: Icon, end, mobile, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
          'transition-all duration-200',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )
      }
    >
      <Icon className="h-5 w-5" />
      {label}
    </NavLink>
  );
}

import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { ThemeToggle } from '../../components/ThemeToggle';
import { BrandMark } from '../../components/BrandMark';
import { logOut } from '../../lib/auth';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/', label: 'Overview', end: true },
  { to: '/income', label: 'Income' },
  { to: '/expenditure', label: 'Expenditure' },
  { to: '/investments', label: 'Investments' },
];

function NavItem({ to, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'font-mono text-[10px] uppercase tracking-[0.22em] transition-colors',
          isActive ? 'text-ink' : 'text-muted-foreground hover:text-ink',
        )
      }
    >
      {label}
    </NavLink>
  );
}

export function Header() {
  const navigate = useNavigate();

  async function onSignOut() {
    try {
      await logOut();
    } catch (err) {
      // Friendly error already thrown by logOut; navigate anyway.
    }
    navigate('/login', { replace: true });
  }

  return (
    <header className="border-b border-ink/15 bg-background">
      <div className="container flex h-16 items-center justify-between gap-6">
        <BrandMark />
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ledger" size="sm" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </div>
      <nav className="container flex items-center gap-5 overflow-x-auto pb-3 md:hidden">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
    </header>
  );
}

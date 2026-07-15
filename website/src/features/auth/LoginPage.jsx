import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { BrandMark } from '../../components/BrandMark';
import { signIn, signUp } from '../../lib/auth';
import { useAppSelector } from '../../app/hooks';

export function LoginPage() {
  const [mode, setMode] = React.useState('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [localError, setLocalError] = React.useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAppSelector((s) => s.auth);

  const from = (location.state && location.state.from && location.state.from.pathname) || '/';

  React.useEffect(() => {
    if (auth.status === 'authenticated') {
      navigate(from, { replace: true });
    }
  }, [auth.status, from, navigate]);

  const toggleMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setLocalError(null);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row items-center justify-center gap-10 bg-background p-6">
      {/* Left column: Brand panel */}
      <div className="flex flex-col items-center gap-4 lg:w-1/2 max-w-md order-2 lg:order-1">
        <BrandMark size="lg" />
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground text-center">
          a personal ledger
        </p>
        <div className="text-center max-w-sm text-sm text-muted-foreground">
          Track income, expenditure and investments in one place. Your data, your privacy.
        </div>
      </div>

      {/* Right column: Form card */}
      <div className="w-full max-w-md order-1 lg:order-2">
        <div className="surface-card p-6">
          <h2 className="font-display text-xl tracking-tight text-foreground mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create your ledger'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === 'signin' ? 'Sign in to continue' : 'Start tracking your finances'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
              >
                email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
              >
                password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {localError ? (
              <p className="border-t border-destructive/40 pt-3 font-mono text-xs text-destructive" role="alert">
                {localError}
              </p>
            ) : null}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={toggleMode}
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-primary"
              >
                {mode === 'signin' ? '→ create account' : '→ sign in'}
              </button>
              <Button type="submit" variant="default" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            data scoped to your account
          </p>
        </div>
      </div>
    </div>
  );
}
import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { signIn, signUp } from '../../lib/auth';
import { useAppSelector } from '../../app/hooks';
import type { RootState } from '../../app/store';

type Mode = 'signin' | 'signup';

export function LoginPage(): JSX.Element {
  const [mode, setMode] = React.useState<Mode>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAppSelector((s: RootState) => s.auth);

  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/';

  React.useEffect(() => {
    if (auth.status === 'authenticated') {
      navigate(from, { replace: true });
    }
  }, [auth.status, from, navigate]);

  async function onSubmit(e: React.FormEvent): Promise<void> {
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>myexpense-log</CardTitle>
          <CardDescription>
            {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
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
              <p className="text-sm text-destructive" role="alert">
                {localError}
              </p>
            ) : null}
            <Button type="submit" disabled={submitting}>
              {submitting
                ? 'Working…'
                : mode === 'signin'
                  ? 'Sign in'
                  : 'Create account'}
            </Button>
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => {
                setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
                setLocalError(null);
              }}
            >
              {mode === 'signin'
                ? 'No account? Create one'
                : 'Already have an account? Sign in'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

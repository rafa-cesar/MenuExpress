import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePageTitle } from '../hooks/usePageTitle';

/**
 * /login → redireciona para /admin/login
 * Ponto de entrada público da landing page.
 */
export function LoginPage() {
  usePageTitle('Entrar — MenuExpress');
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: '/admin/login', replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
        <p className="text-sm text-slate-500">Redirecionando...</p>
      </div>
    </div>
  );
}

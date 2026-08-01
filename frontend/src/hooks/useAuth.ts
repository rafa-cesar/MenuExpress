import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function resolve(nextSession: Session | null) {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession?.user) {
        setEmpresaId(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('empresas')
        .select('id')
        .eq('user_id', nextSession.user.id)
        .maybeSingle();
      if (!active) return;
      setEmpresaId(data?.id ?? null);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setLoading(true);
      void resolve(nextSession);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { session, empresaId, isAdmin: Boolean(empresaId), loading };
}

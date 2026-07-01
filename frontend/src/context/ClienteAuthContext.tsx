import { createContext, ReactNode, useContext, useEffect, useState, useMemo } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { clienteService } from '../services/clienteService';
import type { ClientePerfil } from '../types/domain';

interface ClienteAuthContextValue {
  user: User | null;
  session: Session | null;
  perfil: ClientePerfil | null;
  loading: boolean;
  loginComGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  salvarPerfil: (dados: Partial<ClientePerfil> & { empresaId: string }) => Promise<void>;
  perfilCompleto: boolean;
}

const ClienteAuthContext = createContext<ClienteAuthContextValue | undefined>(undefined);

export function ClienteAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<ClientePerfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setPerfil(null); setLoading(false); return; }
    setLoading(true);
    clienteService.buscarPorAuthId(user.id).then(p => {
      setPerfil(p);
      setLoading(false);
    });
  }, [user]);

  const loginComGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/checkout/auth` },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setPerfil(null);
  };

  const salvarPerfil = async (dados: Partial<ClientePerfil> & { empresaId: string }) => {
    if (!user) return;
    if (perfil) {
      const atualizado = await clienteService.atualizar(perfil.id, {
        nome: dados.nome,
        whatsapp: dados.whatsapp,
        dataNasc: dados.dataNasc,
        endereco: dados.endereco,
      });
      if (atualizado) setPerfil(atualizado);
    } else {
      const criado = await clienteService.criar({
        authId: user.id,
        empresaId: dados.empresaId,
        nome: dados.nome ?? user.user_metadata?.full_name ?? '',
        email: user.email,
        whatsapp: dados.whatsapp,
        dataNasc: dados.dataNasc,
        endereco: dados.endereco,
        fotoUrl: user.user_metadata?.avatar_url,
      });
      if (criado) setPerfil(criado);
    }
  };

  const perfilCompleto = Boolean(perfil?.nome && perfil?.whatsapp);

  const value = useMemo<ClienteAuthContextValue>(() => ({
    user, session, perfil, loading,
    loginComGoogle, logout, salvarPerfil, perfilCompleto,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, session, perfil, loading, perfilCompleto]);

  return <ClienteAuthContext.Provider value={value}>{children}</ClienteAuthContext.Provider>;
}

export function useClienteAuth() {
  const ctx = useContext(ClienteAuthContext);
  if (!ctx) throw new Error('useClienteAuth deve ser usado dentro de ClienteAuthProvider');
  return ctx;
}

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
  authError: string | null;
  loginComGoogle: () => Promise<void>;
  loginComEmail: (email: string, senha: string) => Promise<void>;
  cadastrarComEmail: (email: string, senha: string) => Promise<void>;
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
  const [authError, setAuthError] = useState<string | null>(null);

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
    setAuthError(null);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: anonKey },
      });
      const settings = await response.json() as { external?: { google?: boolean } };
      if (!settings.external?.google) {
        throw new Error('google_provider_disabled');
      }
    } catch (error) {
      setAuthError('O acesso com Google está temporariamente indisponível. Use e-mail e senha.');
      throw error;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/checkout/auth` },
    });
    if (error) {
      setAuthError('Não foi possível iniciar o acesso com Google. Tente novamente.');
      throw error;
    }
  };

  const loginComEmail = async (email: string, senha: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      setAuthError('E-mail ou senha inválidos.');
      throw error;
    }
  };

  const cadastrarComEmail = async (email: string, senha: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signUp({ email, password: senha });
    if (error) {
      setAuthError(
        error.message.toLowerCase().includes('already')
          ? 'Este e-mail já possui cadastro. Faça login.'
          : 'Não foi possível criar a conta. Verifique os dados.'
      );
      throw error;
    }
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
    user, session, perfil, loading, authError,
    loginComGoogle, loginComEmail, cadastrarComEmail, logout, salvarPerfil, perfilCompleto,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, session, perfil, loading, authError, perfilCompleto]);

  return <ClienteAuthContext.Provider value={value}>{children}</ClienteAuthContext.Provider>;
}

export function useClienteAuth() {
  const ctx = useContext(ClienteAuthContext);
  if (!ctx) throw new Error('useClienteAuth deve ser usado dentro de ClienteAuthProvider');
  return ctx;
}

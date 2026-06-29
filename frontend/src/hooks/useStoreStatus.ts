import { useMemo } from 'react';
import { useMenuStore } from '../context/MenuStoreContext';
import type { DiaSemanaKey } from '../types/domain';

const DIA_SEMANA_MAP: Record<number, DiaSemanaKey> = {
  0: 'dom',
  1: 'seg',
  2: 'ter',
  3: 'qua',
  4: 'qui',
  5: 'sex',
  6: 'sab',
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export type StoreStatusResult = {
  aberta: boolean;
  motivo: 'forcar_aberto' | 'forcar_fechado' | 'horario_aberto' | 'horario_fechado' | 'dia_inativo';
  mensagem?: string;
};

export function useStoreStatus(): StoreStatusResult {
  const { empresa } = useMenuStore();

  return useMemo((): StoreStatusResult => {
    // Guard: empresa ainda não carregada → considera fechada
    if (!empresa) {
      return { aberta: false, motivo: 'horario_fechado' };
    }

    const { status, dias, mensagemCliente } = empresa.horario;
    const mensagem = mensagemCliente || undefined;

    if (status === 'forcar_aberto') {
      return { aberta: true, motivo: 'forcar_aberto', mensagem };
    }

    if (status === 'forcar_fechado') {
      return { aberta: false, motivo: 'forcar_fechado', mensagem };
    }

    // automatico: verifica dia e hora atual
    const agora = new Date();
    const diaKey = DIA_SEMANA_MAP[agora.getDay()];
    const horarioDia = dias[diaKey];

    if (!horarioDia.ativo) {
      return { aberta: false, motivo: 'dia_inativo', mensagem };
    }

    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    const minutosAbertura = timeToMinutes(horarioDia.abertura);
    const minutosFechamento = timeToMinutes(horarioDia.fechamento);

    const dentroDaJanela = minutosAgora >= minutosAbertura && minutosAgora < minutosFechamento;

    return {
      aberta: dentroDaJanela,
      motivo: dentroDaJanela ? 'horario_aberto' : 'horario_fechado',
      mensagem,
    };
  }, [empresa]);
}

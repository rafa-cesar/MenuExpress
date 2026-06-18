import type { DiaSemana, Empresa, HorarioFuncionamento } from '../types/domain';

const weekDays: DiaSemana[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const dayLabels: Record<DiaSemana, string> = {
  segunda: 'segunda-feira',
  terca: 'terça-feira',
  quarta: 'quarta-feira',
  quinta: 'quinta-feira',
  sexta: 'sexta-feira',
  sabado: 'sábado',
  domingo: 'domingo',
};

export type StoreOpenStatus = {
  isOpen: boolean;
  reason: 'manual-open' | 'manual-closed' | 'schedule-open' | 'schedule-closed';
  todaySchedule?: HorarioFuncionamento;
  todayScheduleLabel: string;
};

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function isTimeWithinSchedule(currentMinutes: number, abertura: string, fechamento: string) {
  const openingMinutes = timeToMinutes(abertura);
  const closingMinutes = timeToMinutes(fechamento);

  if (openingMinutes === closingMinutes) {
    return true;
  }

  if (closingMinutes > openingMinutes) {
    return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
  }

  return currentMinutes >= openingMinutes || currentMinutes < closingMinutes;
}

export function formatSchedule(schedule?: HorarioFuncionamento) {
  if (!schedule || !schedule.ativo) {
    return 'Fechado hoje';
  }

  return `${dayLabels[schedule.dia]}: ${schedule.abertura} às ${schedule.fechamento}`;
}

export function getStoreOpenStatus(empresa: Empresa, now = new Date()): StoreOpenStatus {
  const today = weekDays[now.getDay()];
  const todaySchedule = empresa.horarioFuncionamento.find((schedule) => schedule.dia === today);
  const todayScheduleLabel = formatSchedule(todaySchedule);

  if (empresa.statusManual === 'aberto') {
    return { isOpen: true, reason: 'manual-open', todaySchedule, todayScheduleLabel };
  }

  if (empresa.statusManual === 'fechado') {
    return { isOpen: false, reason: 'manual-closed', todaySchedule, todayScheduleLabel };
  }

  if (!todaySchedule?.ativo) {
    return { isOpen: false, reason: 'schedule-closed', todaySchedule, todayScheduleLabel };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isOpen = isTimeWithinSchedule(currentMinutes, todaySchedule.abertura, todaySchedule.fechamento);

  return {
    isOpen,
    reason: isOpen ? 'schedule-open' : 'schedule-closed',
    todaySchedule,
    todayScheduleLabel,
  };
}

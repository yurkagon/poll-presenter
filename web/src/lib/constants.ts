import type {
  EventCategory,
  EventStatus,
  EventType,
  ParticipantMode,
  EventWeight,
} from '@shared/types';
import { BASE_POINTS, WEIGHT_MULTIPLIER } from '@shared/types';

export { BASE_POINTS, WEIGHT_MULTIPLIER };

export const CATEGORIES: {
  id: EventCategory;
  label: string;
  icon: string;
  colorVar: string;
}[] = [
  { id: 'PUNCT', label: 'Пунктуальність', icon: '🕐', colorVar: 'var(--cat-punct)' },
  { id: 'SPORT', label: 'Спорт', icon: '🏃', colorVar: 'var(--cat-sport)' },
  { id: 'CREATIVE', label: 'Творчість', icon: '🎨', colorVar: 'var(--cat-creative)' },
  { id: 'GENERAL', label: 'Загальнотабірні ігри', icon: '🎲', colorVar: 'var(--cat-general)' },
];

export const EVENT_TYPES: {
  id: EventType;
  icon: string;
  title: string;
  desc: string;
}[] = [
  {
    id: 'SCORE_ENTRY',
    icon: '🏆',
    title: 'Введення балів',
    desc: 'Подія вже відбулась — внеси бали команд, застосунок сам порахує місця.',
  },
  {
    id: 'EURO',
    icon: '🎤',
    title: 'Євро',
    desc: 'Таємне голосування глядачів + бали журі наживо → фінал балансує обидва голоси порівну.',
  },
];

export const WEIGHTS: { id: EventWeight; label: string; mult: number }[] = [
  { id: 'NORMAL', label: 'Звичайна', mult: WEIGHT_MULTIPLIER.NORMAL },
  { id: 'BIG', label: 'Велика', mult: WEIGHT_MULTIPLIER.BIG },
  { id: 'KEY', label: 'Ключова', mult: WEIGHT_MULTIPLIER.KEY },
];

export const PARTICIPANT_MODES: {
  id: ParticipantMode;
  label: string;
  desc: string;
}[] = [
  { id: 'TEAMS', label: 'Таборові команди', desc: 'Усі команди зміни змагаються як зазвичай.' },
  { id: 'ADHOC', label: 'Збірні групи', desc: 'Тимчасові групи. За замовч. не впливають на рейтинг.' },
];

export const STATUS_LABEL: Record<EventStatus, string> = {
  DRAFT: 'чернетка',
  LOBBY: 'лобі',
  OPEN: 'йде голосування',
  CLOSED: 'закрито',
  REVEALED: 'розкрито',
  COMPLETED: 'завершено',
};

/** Fallback palette when a team has no color from the backend. */
export const TEAM_PALETTE = [
  'var(--t1)',
  'var(--t2)',
  'var(--t3)',
  'var(--t4)',
  'var(--t5)',
  'var(--t6)',
  'var(--t7)',
];

export const categoryOf = (id: EventCategory) =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[3];
export const typeOf = (id: EventType) =>
  EVENT_TYPES.find((t) => t.id === id) ?? EVENT_TYPES[0];
export const weightOf = (id: EventWeight) =>
  WEIGHTS.find((w) => w.id === id) ?? WEIGHTS[0];

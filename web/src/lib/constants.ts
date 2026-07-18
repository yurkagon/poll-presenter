import type {
  EventCategory,
  EventType,
  EventWeight,
  ParticipantMode,
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
    id: 'SIMPLE_VOTE',
    icon: '🗳️',
    title: 'Просте голосування',
    desc: 'Кожен голосує за одну команду (не свою) — наживо.',
  },
  {
    id: 'EURO_VOTE',
    icon: '🎤',
    title: 'Голосування «Євро»',
    desc: 'Кожен роздає 🥇🥈🥉 трьом різним командам.',
  },
  {
    id: 'JURY',
    icon: '⚖️',
    title: 'Режим журі',
    desc: 'Ведучий додає бали командам вручну, наживо.',
  },
  {
    id: 'PLACEMENT',
    icon: '🏁',
    title: 'Місця (1–2–3…)',
    desc: 'Ведучий вносить фінальні місця — бали за таблицею.',
  },
  {
    id: 'HYBRID',
    icon: '🎭',
    title: 'Журі + глядачі',
    desc: 'Голоси глядачів і бали журі сумуються порівну.',
  },
  {
    id: 'INDIVIDUAL',
    icon: '🌟',
    title: 'Особиста відзнака',
    desc: 'Нагороджує людей; на рахунок команд не впливає.',
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
  { id: 'INDIVIDUALS', label: 'Окремі учасники', desc: 'Особисті номінації — не командний залік.' },
];

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

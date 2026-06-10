import { SessionOption, SessionQuestion } from '../../shared/types';

export const SESSION_CODE = '88309117';

const DEFAULT_OPTIONS: SessionOption[] = [
  { id: 'norm', label: 'НОРМ' },
  { id: 'strem', label: 'СТРЬОМ' },
];

export const QUESTIONS: SessionQuestion[] = [
  {
    id: 'q1',
    text: 'Використовувати АІ для підготовки проповіді/домашньої групи тощо',
    options: DEFAULT_OPTIONS,
    image: '/images/q1.webp',
  },
  {
    id: 'q2',
    text: 'Вступати в суперечки в коментарях, захищаючи віру?',
    options: DEFAULT_OPTIONS,
    image: '/images/q2.webp',
  },
  {
    id: 'q3',
    text: '"Кар\'єризм" у церкві. Бажати збільшувати свою роль у служінні?',
    options: DEFAULT_OPTIONS,
    image: '/images/q3.webp',
  },
  {
    id: 'q4',
    text: 'Одягати дорогий одяг за тисячі долларів на служіння?',
    options: DEFAULT_OPTIONS,
    image: '/images/q4.webp',
  },
  {
    id: 'q5',
    text: 'Cancel culture. Масово відписуватися чи бойкотувати бренд або блогера через один вчинок?',
    options: DEFAULT_OPTIONS,
    image: '/images/q5.webp',
  },
  {
    id: 'q6',
    text: 'Бути недоступним для членів церкви/команди у якісь дні чи години',
    options: DEFAULT_OPTIONS,
    image: '/images/q6.webp',
  },
  {
    id: 'q7',
    text: 'Пропустити свято в церкві бо "треба святкувати зі своїми родичами (не церковними)"',
    options: DEFAULT_OPTIONS,
    image: '/images/q7.webp',
  },
  {
    id: 'q8',
    text: 'Християнський Tinder. Шукати пару в дейтинг-додатках?',
    options: DEFAULT_OPTIONS,
    image: '/images/q8.webp',
  },
];

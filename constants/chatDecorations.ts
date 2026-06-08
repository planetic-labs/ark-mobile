import { COLORS } from '../constants/Config';

// Мок-декорации для элементов списка чатов.
// В будущем заменится данными с сервера (lastMessage, unreadCount, etc.)
export interface ChatDecoration {
  avatar: string;
  isWarrior: boolean;
  lastMsgAuthor: string;
  lastMsgText: string;
  time: string;
  badge: number;
  badgeColor: string;
  practice?: string;
}

export function getChatDecoration(name: string): ChatDecoration {
  const n = (name || '').toLowerCase();

  if (n.includes('инкубатор')) {
    return { avatar: 'И', isWarrior: true, lastMsgAuthor: 'Мария Л.:', lastMsgText: 'Отчёт — 4 пункта, прошу корректировку', time: '11:20', badge: 2, badgeColor: COLORS.textMuted };
  }
  if (n.includes('реанимация')) {
    return { avatar: 'Р', isWarrior: true, lastMsgAuthor: '◈ Галя Мурзина:', lastMsgText: 'Корректировка по пункту 2 отчёта…', time: '10:48', badge: 5, badgeColor: COLORS.amber };
  }
  if (n.includes('материал')) {
    return { avatar: 'М', isWarrior: false, lastMsgAuthor: '', lastMsgText: 'Новая нарезка · «Внимание как опора»', time: '09:30', badge: 1, badgeColor: COLORS.textMuted };
  }
  if (n.includes('техническ')) {
    return { avatar: 'Т', isWarrior: false, lastMsgAuthor: '', lastMsgText: 'Расписание практик · ссылки Zoom — в закрепе', time: '08:15', badge: 0, badgeColor: '', practice: 'идёт Гудение до 15:40' };
  }
  if (n.includes('общени')) {
    return { avatar: 'С', isWarrior: false, lastMsgAuthor: 'Сергей Д.:', lastMsgText: 'Благодарю за сегодняшний Сатсанг 🙏', time: 'вчера', badge: 0, badgeColor: '' };
  }

  return {
    avatar: (name || 'C')[0].toUpperCase(),
    isWarrior: false,
    lastMsgAuthor: '',
    lastMsgText: 'Открыть переписку',
    time: 'пн',
    badge: 0,
    badgeColor: '',
  };
}

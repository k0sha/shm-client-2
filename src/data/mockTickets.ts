export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type TicketType = 'service' | 'payment' | 'other';

export interface TicketMessage {
  id: string;
  authorId: number;
  authorName: string;
  isSpecialist: boolean;
  text: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  type: TicketType;
  createdAt: string;
  updatedAt: string;
  userId: number;
  userLogin: string;
  assignedTo?: string;
  messages: TicketMessage[];
  lastMessage?: string;
  unread?: boolean;
}

// Tickets belonging to the current admin user (userId = 1 as placeholder)
export const MOCK_MY_TICKETS: Ticket[] = [
  {
    id: '1',
    subject: 'Не работает VPN на iPhone',
    status: 'open',
    type: 'service',
    createdAt: '2026-04-20T10:30:00',
    updatedAt: '2026-04-20T10:30:00',
    userId: 1,
    userLogin: 'admin',
    messages: [
      {
        id: 'm1',
        authorId: 1,
        authorName: 'admin',
        isSpecialist: false,
        text: 'Здравствуйте! После последнего обновления iOS VPN перестал подключаться. Пробовал переустанавливать приложение — не помогло.',
        createdAt: '2026-04-20T10:30:00',
      },
    ],
    lastMessage: 'Здравствуйте! После последнего обновления iOS VPN перестал подключаться.',
    unread: true,
  },
  {
    id: '2',
    subject: 'Вопрос по оплате',
    status: 'in_progress',
    type: 'payment',
    createdAt: '2026-04-19T14:15:00',
    updatedAt: '2026-04-20T09:00:00',
    userId: 1,
    userLogin: 'admin',
    assignedTo: 'support_agent',
    messages: [
      {
        id: 'm2',
        authorId: 1,
        authorName: 'admin',
        isSpecialist: false,
        text: 'Здравствуйте, с баланса списали деньги дважды за одно устройство.',
        createdAt: '2026-04-19T14:15:00',
      },
      {
        id: 'm3',
        authorId: 100,
        authorName: 'support_agent',
        isSpecialist: true,
        text: 'Здравствуйте! Принял обращение в работу, проверяю историю платежей.',
        createdAt: '2026-04-20T09:00:00',
      },
    ],
    lastMessage: 'Здравствуйте! Принял обращение в работу, проверяю историю платежей.',
  },
  {
    id: '3',
    subject: 'Медленная скорость соединения',
    status: 'resolved',
    type: 'service',
    createdAt: '2026-04-15T11:00:00',
    updatedAt: '2026-04-18T16:30:00',
    userId: 1,
    userLogin: 'admin',
    assignedTo: 'support_agent',
    messages: [
      {
        id: 'm4',
        authorId: 1,
        authorName: 'admin',
        isSpecialist: false,
        text: 'Скорость VPN упала до 1 Мбит/с, раньше было 50+. Проверил на разных серверах — везде медленно.',
        createdAt: '2026-04-15T11:00:00',
      },
      {
        id: 'm5',
        authorId: 100,
        authorName: 'support_agent',
        isSpecialist: true,
        text: 'Проблема устранена — был перегружен сервер. Перевёл ваше устройство на резервный. Попробуйте сейчас.',
        createdAt: '2026-04-18T16:30:00',
      },
    ],
    lastMessage: 'Проблема устранена — был перегружен сервер.',
  },
];

// All tickets visible to specialists (includes tickets from other users)
export const MOCK_ALL_TICKETS: Ticket[] = [
  ...MOCK_MY_TICKETS,
  {
    id: '4',
    subject: 'Не могу войти в аккаунт',
    status: 'open',
    type: 'other',
    createdAt: '2026-04-21T08:00:00',
    updatedAt: '2026-04-21T08:00:00',
    userId: 100001,
    userLogin: 'user123',
    messages: [
      {
        id: 'm6',
        authorId: 100001,
        authorName: 'user123',
        isSpecialist: false,
        text: 'Забыл пароль, ссылка для сброса не приходит на почту уже 30 минут. Проверил спам — нет.',
        createdAt: '2026-04-21T08:00:00',
      },
    ],
    lastMessage: 'Забыл пароль, ссылка для сброса не приходит на почту уже 30 минут.',
    unread: true,
  },
  {
    id: '5',
    subject: 'Устройство заблокировано ошибочно',
    status: 'open',
    type: 'service',
    createdAt: '2026-04-21T07:30:00',
    updatedAt: '2026-04-21T07:30:00',
    userId: 100002,
    userLogin: 'vpn_user_77',
    messages: [
      {
        id: 'm7',
        authorId: 100002,
        authorName: 'vpn_user_77',
        isSpecialist: false,
        text: 'Мой баланс положительный (остаток 350₽), но устройство заблокировано. Пожалуйста, разблокируйте.',
        createdAt: '2026-04-21T07:30:00',
      },
    ],
    lastMessage: 'Мой баланс положительный (остаток 350₽), но устройство заблокировано.',
    unread: true,
  },
  {
    id: '6',
    subject: 'Как подключить второе устройство',
    status: 'waiting',
    type: 'other',
    createdAt: '2026-04-20T16:00:00',
    updatedAt: '2026-04-21T06:00:00',
    userId: 100003,
    userLogin: 'maria_k',
    assignedTo: 'support_agent',
    messages: [
      {
        id: 'm8',
        authorId: 100003,
        authorName: 'maria_k',
        isSpecialist: false,
        text: 'Хочу подключить VPN на второй смартфон. Как это сделать?',
        createdAt: '2026-04-20T16:00:00',
      },
      {
        id: 'm9',
        authorId: 100,
        authorName: 'support_agent',
        isSpecialist: true,
        text: 'Добрый день! Для подключения второго устройства перейдите в раздел "Устройства" и нажмите "Подключить устройство". Вам это помогло?',
        createdAt: '2026-04-21T06:00:00',
      },
    ],
    lastMessage: 'Для подключения второго устройства перейдите в раздел "Устройства"...',
  },
];

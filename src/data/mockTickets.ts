export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type TicketType = 'vpn' | 'setup' | 'payment' | 'account' | 'other';

export interface TicketAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
}

export interface TicketMessage {
  id: string;
  authorId: number;
  authorName: string;
  isSpecialist: boolean;
  text: string;
  createdAt: string;
  attachments?: TicketAttachment[];
}

export interface TicketUserService {
  user_service_id: number;
  name: string;
  status: string;
  expire: string | null;
}

export interface TicketUserInfo {
  user_id: number;
  login: string;
  login2?: string;
  fullName?: string;
  discount: number;
  balance: number;
  bonuses?: number;
  created: string;
  services: TicketUserService[];
}

export interface Ticket {
  id: string;
  number?: number;
  subject?: string;
  status: TicketStatus;
  type: TicketType;
  createdAt: string;
  updatedAt: string;
  userId: number;
  userLogin: string;
  userLogin2?: string;
  userFullName?: string;
  assignedTo?: string;
  messages: TicketMessage[];
  lastMessage?: string;
  unread?: boolean;
  userInfo?: TicketUserInfo;
}

export const MOCK_MY_TICKETS: Ticket[] = [
  {
    id: '1',
    subject: 'Не работает VPN на iPhone',
    status: 'open',
    type: 'vpn',
    createdAt: '2026-04-20T10:30:00',
    updatedAt: '2026-04-20T10:30:00',
    userId: 1,
    userLogin: '@215866391',
    userLogin2: 'andrey.koshevoy@icloud.com',
    messages: [
      {
        id: 'm1',
        authorId: 1,
        authorName: '@215866391',
        isSpecialist: false,
        text: 'Здравствуйте! После последнего обновления iOS VPN перестал подключаться. Пробовал переустанавливать приложение — не помогло.',
        createdAt: '2026-04-20T10:30:00',
      },
    ],
    lastMessage: 'Здравствуйте! После последнего обновления iOS VPN перестал подключаться.',
    unread: true,
    userInfo: {
      user_id: 1,
      login: '@215866391',
      login2: 'andrey.koshevoy@icloud.com',
      discount: 50,
      balance: 1250,
      bonuses: 320,
      created: '2025-01-28T16:07:38',
      services: [
        { user_service_id: 101, name: 'VPN iPhone', status: 'ACTIVE', expire: '2026-05-28' },
        { user_service_id: 102, name: 'VPN MacBook', status: 'ACTIVE', expire: '2026-05-28' },
      ],
    },
  },
  {
    id: '2',
    subject: 'Вопрос по оплате',
    status: 'in_progress',
    type: 'payment',
    createdAt: '2026-04-19T14:15:00',
    updatedAt: '2026-04-20T09:00:00',
    userId: 1,
    userLogin: '@215866391',
    userLogin2: 'andrey.koshevoy@icloud.com',
    assignedTo: 'Алексей Смирнов',
    messages: [
      {
        id: 'm2',
        authorId: 1,
        authorName: '@215866391',
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
    userInfo: {
      user_id: 1,
      login: '@215866391',
      login2: 'andrey.koshevoy@icloud.com',
      discount: 50,
      balance: 1250,
      bonuses: 320,
      created: '2025-01-28T16:07:38',
      services: [
        { user_service_id: 101, name: 'VPN iPhone', status: 'ACTIVE', expire: '2026-05-28' },
        { user_service_id: 102, name: 'VPN MacBook', status: 'ACTIVE', expire: '2026-05-28' },
      ],
    },
  },
  {
    id: '3',
    subject: 'Медленная скорость соединения',
    status: 'resolved',
    type: 'vpn',
    createdAt: '2026-04-15T11:00:00',
    updatedAt: '2026-04-18T16:30:00',
    userId: 1,
    userLogin: '@215866391',
    userLogin2: 'andrey.koshevoy@icloud.com',
    assignedTo: 'Алексей Смирнов',
    messages: [
      {
        id: 'm4',
        authorId: 1,
        authorName: '@215866391',
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
    userInfo: {
      user_id: 1,
      login: '@215866391',
      login2: 'andrey.koshevoy@icloud.com',
      discount: 50,
      balance: 1250,
      bonuses: 320,
      created: '2025-01-28T16:07:38',
      services: [
        { user_service_id: 101, name: 'VPN iPhone', status: 'ACTIVE', expire: '2026-05-28' },
        { user_service_id: 102, name: 'VPN MacBook', status: 'ACTIVE', expire: '2026-05-28' },
      ],
    },
  },
];

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
    userLogin: '@100001',
    userLogin2: 'user123@mail.ru',
    messages: [
      {
        id: 'm6',
        authorId: 100001,
        authorName: '@100001',
        isSpecialist: false,
        text: 'Забыл пароль, ссылка для сброса не приходит на почту уже 30 минут. Проверил спам — нет.',
        createdAt: '2026-04-21T08:00:00',
      },
    ],
    lastMessage: 'Забыл пароль, ссылка для сброса не приходит на почту уже 30 минут.',
    unread: true,
    userInfo: {
      user_id: 100001,
      login: '@100001',
      login2: 'user123@mail.ru',
      discount: 0,
      balance: 0,
      bonuses: 0,
      created: '2026-02-10T09:15:00',
      services: [
        { user_service_id: 201, name: 'VPN Android', status: 'ACTIVE', expire: '2026-05-10' },
      ],
    },
  },
  {
    id: '5',
    subject: 'Устройство заблокировано ошибочно',
    status: 'open',
    type: 'vpn',
    createdAt: '2026-04-21T07:30:00',
    updatedAt: '2026-04-21T07:30:00',
    userId: 100002,
    userLogin: '@100002',
    userLogin2: 'vpn_user_77@gmail.com',
    messages: [
      {
        id: 'm7',
        authorId: 100002,
        authorName: '@100002',
        isSpecialist: false,
        text: 'Мой баланс положительный (остаток 350₽), но устройство заблокировано. Пожалуйста, разблокируйте.',
        createdAt: '2026-04-21T07:30:00',
      },
    ],
    lastMessage: 'Мой баланс положительный (остаток 350₽), но устройство заблокировано.',
    unread: true,
    userInfo: {
      user_id: 100002,
      login: '@100002',
      login2: 'vpn_user_77@gmail.com',
      fullName: 'Иван Петров',
      discount: 10,
      balance: 350,
      bonuses: 85,
      created: '2025-11-05T14:22:00',
      services: [
        { user_service_id: 301, name: 'VPN iPhone', status: 'BLOCK', expire: '2026-04-15' },
        { user_service_id: 302, name: 'VPN iPad', status: 'ACTIVE', expire: '2026-05-05' },
      ],
    },
  },
  {
    id: '6',
    subject: 'Как подключить второе устройство',
    status: 'waiting',
    type: 'other',
    createdAt: '2026-04-20T16:00:00',
    updatedAt: '2026-04-21T06:00:00',
    userId: 100003,
    userLogin: '@100003',
    userLogin2: 'maria.k@yandex.ru',
    assignedTo: 'Алексей Смирнов',
    messages: [
      {
        id: 'm8',
        authorId: 100003,
        authorName: '@100003',
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
    userInfo: {
      user_id: 100003,
      login: '@100003',
      login2: 'maria.k@yandex.ru',
      fullName: 'Мария Козлова',
      discount: 20,
      balance: 720,
      bonuses: 140,
      created: '2025-08-17T11:45:00',
      services: [
        { user_service_id: 401, name: 'VPN Samsung', status: 'ACTIVE', expire: '2026-06-17' },
      ],
    },
  },
];

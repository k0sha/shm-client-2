import { IconUser, IconServer, IconCreditCard, IconReceipt, IconMessageCircle, IconLayoutList } from '@tabler/icons-react';
import type { ComponentType } from 'react';

export interface NavItem {
  readonly path: string;
  readonly labelKey: string;
  readonly icon: ComponentType<{ size?: number }>;
  readonly requiresRole?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', labelKey: 'nav.services', icon: IconServer },
  { path: '/profile', labelKey: 'profile.title', icon: IconUser },
  { path: '/payments', labelKey: 'nav.payments', icon: IconCreditCard },
  { path: '/withdrawals', labelKey: 'nav.withdrawals', icon: IconReceipt },
  { path: '/support', labelKey: 'nav.support', icon: IconMessageCircle, requiresRole: 'admin' },
  { path: '/tickets', labelKey: 'nav.tickets', icon: IconLayoutList, requiresRole: 'admin' },
];

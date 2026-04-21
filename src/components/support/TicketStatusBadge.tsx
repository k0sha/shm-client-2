import { Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { TicketStatus } from '../../data/mockTickets';

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'blue',
  in_progress: 'orange',
  waiting: 'yellow',
  resolved: 'green',
  closed: 'gray',
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const { t } = useTranslation();
  return (
    <Badge color={STATUS_COLORS[status]} variant="light" size="sm">
      {t(`tickets.status.${status}`)}
    </Badge>
  );
}

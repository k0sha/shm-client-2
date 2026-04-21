import { useState } from 'react';
import { Modal, Stack, TextInput, Textarea, Select, Button, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import type { Ticket, TicketType } from '../../data/mockTickets';
import { MOCK_MY_TICKETS } from '../../data/mockTickets';

interface Props {
  opened: boolean;
  onClose: () => void;
  onCreated: (ticket: Ticket) => void;
}

export function TicketCreateModal({ opened, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<TicketType | null>(null);

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim() || !type) {
      notifications.show({ color: 'red', message: t('tickets.fillRequired') });
      return;
    }

    const now = new Date().toISOString();
    const newTicket: Ticket = {
      id: String(Date.now()),
      subject: subject.trim(),
      status: 'open',
      type,
      createdAt: now,
      updatedAt: now,
      userId: 1,
      userLogin: 'admin',
      messages: [
        {
          id: `m${Date.now()}`,
          authorId: 1,
          authorName: 'admin',
          isSpecialist: false,
          text: message.trim(),
          createdAt: now,
        },
      ],
      lastMessage: message.trim(),
      unread: false,
    };

    MOCK_MY_TICKETS.unshift(newTicket);
    notifications.show({ color: 'green', message: t('tickets.ticketCreated') });
    onCreated(newTicket);
    setSubject('');
    setMessage('');
    setType(null);
    onClose();
  };

  const typeOptions = [
    { value: 'service', label: t('tickets.ticketType.service') },
    { value: 'payment', label: t('tickets.ticketType.payment') },
    { value: 'other', label: t('tickets.ticketType.other') },
  ];

  return (
    <Modal opened={opened} onClose={onClose} title={t('tickets.createTicket')}>
      <Stack gap="md">
        <Select
          label={t('tickets.ticketTypeLabel')}
          placeholder={t('tickets.selectCategory')}
          data={typeOptions}
          value={type}
          onChange={(v) => setType(v as TicketType)}
          withAsterisk
        />
        <TextInput
          label={t('tickets.subject')}
          placeholder={t('tickets.subjectPlaceholder')}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          withAsterisk
        />
        <Textarea
          label={t('tickets.message')}
          placeholder={t('tickets.messagePlaceholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          minRows={4}
          autosize
          withAsterisk
        />
        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit}>{t('tickets.send')}</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

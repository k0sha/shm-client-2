import { useState, useRef } from 'react';
import { Modal, Stack, Textarea, Select, Button, Group, ActionIcon, Pill } from '@mantine/core';
import { IconPaperclip } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import type { Ticket, TicketType, TicketAttachment } from '../../data/mockTickets';
import { MOCK_MY_TICKETS } from '../../data/mockTickets';

interface Props {
  opened: boolean;
  onClose: () => void;
  onCreated: (ticket: Ticket) => void;
}

function truncateName(name: string, max = 28): string {
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}

export function TicketCreateModal({ opened, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [type, setType] = useState<TicketType | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setMessage('');
    setType(null);
    setSelectedFiles([]);
    onClose();
  };

  const handleSubmit = () => {
    if ((!message.trim() && selectedFiles.length === 0) || !type) {
      notifications.show({ color: 'red', message: t('tickets.fillRequired') });
      return;
    }

    const attachments: TicketAttachment[] = selectedFiles.map((file) => ({
      id: `a${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      url: URL.createObjectURL(file),
    }));

    const now = new Date().toISOString();
    const newTicket: Ticket = {
      id: String(Date.now()),
      status: 'open',
      type,
      createdAt: now,
      updatedAt: now,
      userId: 1,
      userLogin: 'me',
      messages: [
        {
          id: `m${Date.now()}`,
          authorId: 1,
          authorName: 'me',
          isSpecialist: false,
          text: message.trim(),
          createdAt: now,
          ...(attachments.length > 0 && { attachments }),
        },
      ],
      lastMessage: message.trim() || undefined,
      unread: false,
    };

    MOCK_MY_TICKETS.unshift(newTicket);
    notifications.show({ color: 'green', message: t('tickets.ticketCreated') });
    onCreated(newTicket);
    setMessage('');
    setType(null);
    setSelectedFiles([]);
    onClose();
  };

  const typeOptions = [
    { value: 'vpn', label: t('tickets.ticketType.vpn') },
    { value: 'setup', label: t('tickets.ticketType.setup') },
    { value: 'payment', label: t('tickets.ticketType.payment') },
    { value: 'account', label: t('tickets.ticketType.account') },
    { value: 'other', label: t('tickets.ticketType.other') },
  ];

  return (
    <Modal opened={opened} onClose={handleClose} title={t('tickets.createTicket')}>
      <Stack gap="md">
        <Select
          label={t('tickets.ticketTypeLabel')}
          placeholder={t('tickets.selectCategory')}
          data={typeOptions}
          value={type}
          onChange={(v) => setType(v as TicketType)}
          withAsterisk
        />
        <Textarea
          label={t('tickets.message')}
          placeholder={t('tickets.messagePlaceholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          minRows={4}
          autosize
        />
        {selectedFiles.length > 0 && (
          <Pill.Group>
            {selectedFiles.map((file, i) => (
              <Pill key={i} withRemoveButton onRemove={() => removeFile(i)} size="sm">
                {truncateName(file.name)}
              </Pill>
            ))}
          </Pill.Group>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <Group justify="space-between">
          <ActionIcon variant="subtle" size="lg" onClick={() => fileInputRef.current?.click()}>
            <IconPaperclip size={18} />
          </ActionIcon>
          <Group gap="xs">
            <Button variant="light" onClick={handleClose}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit}>{t('tickets.send')}</Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}

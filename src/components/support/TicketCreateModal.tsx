import { useState, useRef } from 'react';
import { Modal, Stack, Textarea, Select, Button, Group, ActionIcon, Pill } from '@mantine/core';
import { IconPaperclip } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { supportApi } from '../../api/supportApi';
import type { Ticket, TicketType } from '../../types/tickets';
import { getFileAccept } from '../../utils/fileAccept';

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
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async () => {
    if ((!message.trim() && selectedFiles.length === 0) || !type) {
      notifications.show({ color: 'red', message: t('tickets.fillRequired') });
      return;
    }

    setLoading(true);
    try {
      const ticket = await supportApi.createTicket(type);
      if (message.trim() || selectedFiles.length > 0) {
        await supportApi.sendMessage(ticket.id, message, selectedFiles);
      }
      notifications.show({ color: 'green', message: t('tickets.ticketCreated') });
      onCreated(ticket);
      setMessage('');
      setType(null);
      setSelectedFiles([]);
      onClose();
    } catch {
      notifications.show({ color: 'red', message: t('common.error') });
    } finally {
      setLoading(false);
    }
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
          withAsterisk
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
        <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileSelect} accept={getFileAccept()} />
        <Group justify="space-between">
          <ActionIcon variant="default" size="md" onClick={() => fileInputRef.current?.click()}>
            <IconPaperclip size={16} />
          </ActionIcon>
          <Group gap="xs">
            <Button variant="light" onClick={handleClose}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} loading={loading}>{t('tickets.send')}</Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}

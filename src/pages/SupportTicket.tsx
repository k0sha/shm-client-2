import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Stack, Group, Text, ActionIcon, Textarea, Button,
  Paper, Box, Select, Badge, ScrollArea, Divider, Collapse, Table, Pill, Loader, Center,
} from '@mantine/core';
import { IconArrowLeft, IconSend, IconChevronDown, IconChevronUp, IconPaperclip, IconFile } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { useComputedColorScheme } from '@mantine/core';
import { TicketStatusBadge } from '../components/support/TicketStatusBadge';
import { supportApi } from '../api/supportApi';
import type { Ticket, TicketMessage, TicketStatus, TicketAttachment, TicketUserInfo } from '../data/mockTickets';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateName(name: string, max = 28): string {
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}

function AttachmentItem({ att, isOwn, scheme }: { att: TicketAttachment; isOwn: boolean; scheme: string }) {
  if (att.mimeType.startsWith('image/')) {
    return (
      <Box component="a" href={att.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
        <img src={att.url} alt={att.name} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6, display: 'block' }} />
      </Box>
    );
  }
  return (
    <Box
      component="a" href={att.url} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 8px', borderRadius: 6, textDecoration: 'none',
        background: isOwn ? 'rgba(255,255,255,0.15)' : scheme === 'dark' ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.06)',
      }}
    >
      <IconFile size={16} style={{ color: isOwn ? 'white' : 'inherit', flexShrink: 0 }} />
      <Stack gap={0} style={{ minWidth: 0 }}>
        <Text size="xs" fw={500} style={{ color: isOwn ? 'white' : 'inherit' }} truncate>{att.name}</Text>
        <Text size="xs" style={{ color: isOwn ? 'rgba(255,255,255,0.65)' : 'var(--mantine-color-dimmed)' }}>
          {formatFileSize(att.size)}
        </Text>
      </Stack>
    </Box>
  );
}

function resolveAuthorLabel(msg: TicketMessage, ticket: Ticket): string {
  if (msg.isSpecialist) return msg.authorName;
  const info = ticket.userInfo;
  if (info?.fullName) return info.fullName;
  const tg = ticket.userLogin.startsWith('@') ? ticket.userLogin : null;
  const email = ticket.userLogin2 && !ticket.userLogin2.startsWith('@') ? ticket.userLogin2 : null;
  if (tg && email) return `${tg} · ${email}`;
  if (tg) return tg;
  if (email) return email;
  return msg.authorName;
}

function MessageBubble({ msg, isOwn, ticket }: { msg: TicketMessage; isOwn: boolean; ticket: Ticket }) {
  const scheme = useComputedColorScheme('light');
  return (
    <Box style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
      <Box style={{ maxWidth: '72%' }}>
        {!isOwn && (
          <Text size="xs" c="dimmed" mb={2} ml={4}>
            {msg.isSpecialist ? '🛡 ' : ''}{resolveAuthorLabel(msg, ticket)}
          </Text>
        )}
        <Paper
          p="sm" radius="lg"
          style={{
            background: isOwn
              ? 'var(--mantine-color-blue-6)'
              : scheme === 'dark' ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-1)',
            borderBottomRightRadius: isOwn ? 4 : undefined,
            borderBottomLeftRadius: !isOwn ? 4 : undefined,
          }}
        >
          {msg.text ? (
            <Text size="sm" style={{ color: isOwn ? 'white' : 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {msg.text}
            </Text>
          ) : null}
          {msg.attachments && msg.attachments.length > 0 && (
            <Stack gap="xs" mt={msg.text ? 'xs' : 0}>
              {msg.attachments.map((att) => (
                <AttachmentItem key={att.id} att={att} isOwn={isOwn} scheme={scheme} />
              ))}
            </Stack>
          )}
        </Paper>
        <Text size="xs" c="dimmed" mt={2} ta={isOwn ? 'right' : 'left'} mr={isOwn ? 4 : 0} ml={isOwn ? 0 : 4}>
          {formatTime(msg.createdAt)}
        </Text>
      </Box>
    </Box>
  );
}

function UserInfoPanel({ ticket }: { ticket: Ticket }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<TicketUserInfo | null>(ticket.userInfo ?? null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  const handleToggle = async () => {
    if (!open && !info) {
      setLoadingInfo(true);
      try {
        const data = await supportApi.getUserInfo(ticket.userId);
        setInfo(data);
      } catch {
        // показываем то что есть из ticket
      } finally {
        setLoadingInfo(false);
      }
    }
    setOpen((v) => !v);
  };

  const tgLogin = ticket.userLogin.startsWith('@') ? ticket.userLogin : null;
  const emailLogin = ticket.userLogin2 && !ticket.userLogin2.startsWith('@') ? ticket.userLogin2 : null;

  const statusColors: Record<string, string> = {
    ACTIVE: 'green', BLOCK: 'red', 'NOT PAID': 'orange', PROGRESS: 'yellow', ERROR: 'red',
  };

  return (
    <Paper withBorder radius="md" p="sm">
      <Group justify="space-between" style={{ cursor: 'pointer' }} onClick={handleToggle}>
        <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
          <Text size="sm" fw={600} style={{ flexShrink: 0 }}>{t('tickets.userInfo')}</Text>
          <Text size="sm" c="dimmed" truncate>
            #{ticket.userId}
            {(info?.fullName ?? ticket.userLogin2) ? ` · ${info?.fullName ?? ''}` : ''}
            {tgLogin ? ` · ${tgLogin}` : ''}
            {emailLogin ? ` · ${emailLogin}` : ''}
          </Text>
        </Group>
        <ActionIcon variant="subtle" size="sm" style={{ flexShrink: 0 }} loading={loadingInfo}>
          {open ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        </ActionIcon>
      </Group>

      <Collapse in={open}>
        <Divider my="xs" />
        {info ? (
          <Stack gap="sm">
            <Group gap="lg" wrap="wrap">
              <Stack gap={2}>
                <Text size="xs" c="dimmed">{t('tickets.userShmId')}</Text>
                <Text size="sm" fw={500}>#{info.user_id}</Text>
              </Stack>
              {info.fullName && (
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">{t('tickets.userFullName')}</Text>
                  <Text size="sm" fw={500}>{info.fullName}</Text>
                </Stack>
              )}
              {tgLogin && (
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">{t('tickets.userTgLogin')}</Text>
                  <Text size="sm" fw={500}>{tgLogin}</Text>
                </Stack>
              )}
              {emailLogin && (
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">{t('tickets.userEmailLogin')}</Text>
                  <Text size="sm" fw={500}>{emailLogin}</Text>
                </Stack>
              )}
            </Group>
            <Divider />
            <Group gap="lg" wrap="wrap">
              <Stack gap={2}>
                <Text size="xs" c="dimmed">{t('tickets.userBalance')}</Text>
                <Text size="sm" fw={500}>{info.balance} ₽</Text>
              </Stack>
              {info.bonuses !== undefined && (
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">{t('tickets.userBonuses')}</Text>
                  <Text size="sm" fw={500}>{info.bonuses} ₽</Text>
                </Stack>
              )}
              <Stack gap={2}>
                <Text size="xs" c="dimmed">{t('tickets.userDiscount')}</Text>
                <Text size="sm" fw={500}>{info.discount}%</Text>
              </Stack>
              {info.created && (
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">{t('tickets.userCreated')}</Text>
                  <Text size="sm" fw={500}>{formatDate(info.created)}</Text>
                </Stack>
              )}
            </Group>
            {info.services.length > 0 && (
              <>
                <Text size="xs" c="dimmed" mt={2}>{t('tickets.userServices')}</Text>
                <Table fz="xs" withRowBorders={false} verticalSpacing={4}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('services.title').replace('Мои ', '')}</Table.Th>
                      <Table.Th>{t('services.status')}</Table.Th>
                      <Table.Th>{t('services.validUntil')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {info.services.map((svc) => (
                      <Table.Tr key={svc.user_service_id}>
                        <Table.Td>{svc.name}</Table.Td>
                        <Table.Td>
                          <Badge size="xs" color={statusColors[svc.status] ?? 'gray'} variant="light">
                            {t(`status.${svc.status}`, { defaultValue: svc.status })}
                          </Badge>
                        </Table.Td>
                        <Table.Td c="dimmed">{svc.expire ? formatDate(svc.expire) : '—'}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </>
            )}
          </Stack>
        ) : (
          <Text size="xs" c="dimmed">{t('common.loading')}</Text>
        )}
      </Collapse>
    </Paper>
  );
}

export default function SupportTicket() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isSpecialistView = location.pathname.startsWith('/tickets/');

  const [ticket, setTicket] = useState<Ticket | undefined>();
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ticketId) return;
    supportApi.getTicket(ticketId)
      .then(setTicket)
      .catch(() => setTicket(undefined))
      .finally(() => setLoading(false));
  }, [ticketId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [ticket?.messages.length]);

  if (loading) return <Center py="xl"><Loader /></Center>;

  const backPath = isSpecialistView ? '/tickets' : '/support';

  if (!ticket) {
    return (
      <Stack align="center" py="xl">
        <Text c="dimmed">{t('tickets.ticketNotFound')}</Text>
        <Button variant="light" onClick={() => navigate(backPath)}>{t('tickets.backToList')}</Button>
      </Stack>
    );
  }

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removeFile = (index: number) => setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSend = async () => {
    if (!replyText.trim() && selectedFiles.length === 0) return;
    setSending(true);
    try {
      const newMsg = await supportApi.sendMessage(ticket.id, replyText, selectedFiles);
      setTicket((prev) => prev ? { ...prev, messages: [...prev.messages, newMsg], updatedAt: newMsg.createdAt } : prev);
      setReplyText('');
      setSelectedFiles([]);
    } catch {
      notifications.show({ color: 'red', message: t('common.error') });
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus) return;
    try {
      const updated = await supportApi.updateTicket(ticket.id, { status: newStatus });
      setTicket(updated);
      notifications.show({ color: 'green', message: t('tickets.statusChanged') });
    } catch {
      notifications.show({ color: 'red', message: t('common.error') });
    }
  };

  const handleTakeTicket = async () => {
    try {
      const updated = await supportApi.updateTicket(ticket.id, { take: true });
      setTicket(updated);
      notifications.show({ color: 'green', message: t('tickets.takenIntoWork') });
    } catch {
      notifications.show({ color: 'red', message: t('common.error') });
    }
  };

  const handleCloseTicket = async () => {
    try {
      const updated = await supportApi.updateTicket(ticket.id, { status: 'closed' });
      setTicket(updated);
      notifications.show({ color: 'green', message: t('tickets.ticketClosed') });
    } catch {
      notifications.show({ color: 'red', message: t('common.error') });
    }
  };

  const handleReopenTicket = async () => {
    try {
      const updated = await supportApi.updateTicket(ticket.id, { status: 'open' });
      setTicket(updated);
      notifications.show({ color: 'blue', message: t('tickets.ticketReopened') });
    } catch {
      notifications.show({ color: 'red', message: t('common.error') });
    }
  };

  const statusOptions = [
    { value: 'open', label: t('tickets.status.open') },
    { value: 'in_progress', label: t('tickets.status.in_progress') },
    { value: 'waiting', label: t('tickets.status.waiting') },
    { value: 'resolved', label: t('tickets.status.resolved') },
    { value: 'closed', label: t('tickets.status.closed') },
  ];

  return (
    <Stack gap="md" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Group gap="sm" wrap="nowrap">
        <ActionIcon variant="subtle" size="lg" onClick={() => navigate(backPath)}>
          <IconArrowLeft size={18} />
        </ActionIcon>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" wrap="nowrap">
            <Text fw={700} size="lg" truncate style={{ minWidth: 0 }}>
              {t(`tickets.ticketType.${ticket.type}`)}
            </Text>
            <TicketStatusBadge status={ticket.status} />
          </Group>
          <Group gap="xs">
            <Text size="xs" c="dimmed">#{ticket.id}</Text>
            {ticket.assignedTo && (
              <>
                <Text size="xs" c="dimmed">·</Text>
                <Text size="xs" c="dimmed">🛡 {ticket.assignedTo}</Text>
              </>
            )}
          </Group>
        </Stack>
        {!isSpecialistView && !isClosed && (
          <Button size="xs" variant="light" color="red" onClick={handleCloseTicket} style={{ flexShrink: 0 }}>
            {t('tickets.closeTicket')}
          </Button>
        )}
      </Group>

      {isSpecialistView && <UserInfoPanel ticket={ticket} />}

      {isSpecialistView && (
        <>
          <Divider />
          <Group gap="sm" wrap="wrap">
            {!ticket.assignedTo && ticket.status === 'open' && (
              <Button size="xs" variant="light" onClick={handleTakeTicket}>
                {t('tickets.takeIntoWork')}
              </Button>
            )}
            <Select
              size="xs"
              placeholder={t('tickets.changeStatus')}
              data={statusOptions}
              value={ticket.status}
              onChange={handleStatusChange}
              w={160}
            />
          </Group>
          <Divider />
        </>
      )}

      {/* Chat */}
      <ScrollArea flex={1} viewportRef={scrollRef} style={{ minHeight: 300 }}>
        <Stack gap="sm" p="xs">
          {ticket.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOwn={isSpecialistView ? msg.isSpecialist : !msg.isSpecialist}
              ticket={ticket}
            />
          ))}
          {isClosed && (
            <Stack align="center" gap="xs" py="xs">
              <Text size="xs" c="dimmed" ta="center">{t('tickets.ticketClosedInfo')}</Text>
              {!isSpecialistView && (
                <Button size="xs" variant="light" onClick={handleReopenTicket}>
                  {t('tickets.reopenTicket')}
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      </ScrollArea>

      {/* Reply */}
      {!isClosed && (
        <Paper withBorder radius="md" p="sm">
          {selectedFiles.length > 0 && (
            <Pill.Group mb="xs">
              {selectedFiles.map((file, i) => (
                <Pill key={i} withRemoveButton onRemove={() => removeFile(i)} size="sm">
                  {truncateName(file.name)}
                </Pill>
              ))}
            </Pill.Group>
          )}
          <Textarea
            variant="unstyled"
            placeholder={t('tickets.messagePlaceholder')}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            minRows={1}
            autosize
            maxRows={6}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (replyText.trim() || selectedFiles.length > 0) handleSend();
              }
            }}
          />
          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
          <Group justify="space-between" mt="xs">
            <ActionIcon size="sm" variant="default" onClick={() => fileInputRef.current?.click()}>
              <IconPaperclip size={14} />
            </ActionIcon>
            <Group gap="xs">
              <Text size="xs" c="dimmed">{t('tickets.enterToSend')}</Text>
              <ActionIcon
                size="sm" variant="filled"
                onClick={handleSend}
                loading={sending}
                disabled={!replyText.trim() && selectedFiles.length === 0}
              >
                <IconSend size={14} />
              </ActionIcon>
            </Group>
          </Group>
        </Paper>
      )}
    </Stack>
  );
}

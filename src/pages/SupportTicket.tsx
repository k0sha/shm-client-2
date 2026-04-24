import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMediaQuery } from '@mantine/hooks';
import {
  Stack, Group, Text, ActionIcon, Textarea, Button,
  Paper, Box, Select, Badge, Divider, Collapse, Table, Pill, Loader, Center,
} from '@mantine/core';
import { IconArrowLeft, IconSend, IconChevronDown, IconChevronUp, IconPaperclip, IconFile } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { useComputedColorScheme } from '@mantine/core';
import { TicketStatusBadge } from '../components/support/TicketStatusBadge';
import { supportApi } from '../api/supportApi';
import { useTicketWebSocket, type TicketUpdate } from '../hooks/useTicketWebSocket';
import { useStore } from '../store/useStore';
import type { Ticket, TicketMessage, TicketAttachment, TicketUserInfo } from '../types/tickets';

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
  if (ticket.userFullName) return ticket.userFullName;
  const tg = ticket.userLogin?.startsWith('@') ? ticket.userLogin : null;
  const email = ticket.userLogin2 && !ticket.userLogin2.startsWith('@') ? ticket.userLogin2 : null;
  if (tg && email) return `${tg} · ${email}`;
  if (tg) return tg;
  if (email) return email;
  if (ticket.userLogin) return ticket.userLogin;
  return msg.authorName;
}

function MessageBubble({ msg, isOwn, ticket, showAllLabels }: { msg: TicketMessage; isOwn: boolean; ticket: Ticket; showAllLabels?: boolean }) {
  const scheme = useComputedColorScheme('light');
  const showLabel = showAllLabels || !isOwn;
  return (
    <Box style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
      <Box style={{ maxWidth: '72%' }}>
        {showLabel && (
          <Text size="xs" c="dimmed" mb={2} ml={isOwn ? 0 : 4} mr={isOwn ? 4 : 0} ta={isOwn ? 'right' : 'left'}>
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

function isTelegramLogin(login: string): boolean {
  return /^@\d+$/.test(login);
}

function UserInfoPanel({ ticket }: { ticket: Ticket }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<TicketUserInfo | null>(ticket.userInfo ?? null);

  useEffect(() => {
    supportApi.getUserInfo(ticket.userId)
      .then(setInfo)
      .catch(() => {});
  }, [ticket.userId]);

  const handleToggle = () => setOpen((v) => !v);

  const loginValue = info?.login ?? ticket.userLogin;
  const login2Value = info?.login2 ?? ticket.userLogin2;
  const fullNameValue = info?.fullName ?? ticket.userFullName;

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
            {fullNameValue ? ` · ${fullNameValue}` : ''}
            {loginValue ? ` · ${loginValue}` : ''}
            {login2Value ? ` · ${login2Value}` : ''}
          </Text>
        </Group>
        <ActionIcon variant="subtle" size="sm" style={{ flexShrink: 0 }}>
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
              {fullNameValue && (
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">{t('tickets.userFullName')}</Text>
                  <Text size="sm" fw={500}>{fullNameValue}</Text>
                </Stack>
              )}
              {loginValue && (
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">
                    {isTelegramLogin(loginValue) ? t('tickets.userTgLogin') : t('tickets.userLogin')}
                  </Text>
                  <Text size="sm" fw={500}>{loginValue}</Text>
                </Stack>
              )}
              {login2Value && (
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">{t('tickets.userEmailLogin')}</Text>
                  <Text size="sm" fw={500}>{login2Value}</Text>
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
  const isMobile = useMediaQuery('(max-width: 768px)') ?? true;

  const { decrementSupportUnread, decrementTicketsUnread, markTicketOpened } = useStore();

  const [ticket, setTicket] = useState<Ticket | undefined>();
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const markedReadRef = useRef(false);

  const handleWsMessage = useCallback((msg: TicketMessage) => {
    setTicket((prev) => {
      if (!prev) return prev;
      if (prev.messages.some((m) => m.id === msg.id)) return prev;
      return { ...prev, messages: [...prev.messages, msg] };
    });
  }, []);

  const handleWsTicketUpdate = useCallback((update: TicketUpdate) => {
    setTicket((prev) => prev ? { ...prev, status: update.status as Ticket['status'], assignedTo: update.assignedTo ?? undefined } : prev);
  }, []);

  useTicketWebSocket(ticketId, handleWsMessage, handleWsTicketUpdate);

  useEffect(() => {
    if (!ticketId) return;
    markedReadRef.current = false;
    supportApi.getTicket(ticketId, !isSpecialistView)
      .then(setTicket)
      .catch(() => setTicket(undefined))
      .finally(() => setLoading(false));
  }, [ticketId]);

  useEffect(() => {
    if (!ticket || markedReadRef.current) return;
    markedReadRef.current = true;
    if (ticket.unread) {
      if (isSpecialistView) {
        decrementTicketsUnread();
      } else {
        decrementSupportUnread();
      }
    }
    markTicketOpened(ticket.id);
  }, [ticket?.id]);

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
      setTicket((prev) => {
        if (!prev) return prev;
        const idx = prev.messages.findIndex((m) => m.id === newMsg.id);
        if (idx !== -1) {
          const msgs = [...prev.messages];
          msgs[idx] = newMsg;
          return { ...prev, messages: msgs, updatedAt: newMsg.createdAt };
        }
        return { ...prev, messages: [...prev.messages, newMsg], updatedAt: newMsg.createdAt };
      });
      setReplyText('');
      setSelectedFiles([]);
    } catch {
      notifications.show({ color: 'red', message: t('common.error') });
    } finally {
      setSending(false);
    }
  };

  const applyTicketUpdate = (updated: Ticket) => {
    setTicket((prev) => prev ? { ...prev, ...updated, messages: prev.messages } : prev);
  };

  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus) return;
    try {
      applyTicketUpdate(await supportApi.updateTicket(ticket.id, { status: newStatus }));
      notifications.show({ color: 'green', message: t('tickets.statusChanged') });
    } catch {
      notifications.show({ color: 'red', message: t('common.error') });
    }
  };

  const handleTakeTicket = async () => {
    try {
      applyTicketUpdate(await supportApi.updateTicket(ticket.id, { take: true }));
      notifications.show({ color: 'green', message: t('tickets.takenIntoWork') });
    } catch {
      notifications.show({ color: 'red', message: t('common.error') });
    }
  };

  const handleCloseTicket = async () => {
    try {
      applyTicketUpdate(await supportApi.updateTicket(ticket.id, { status: 'closed' }));
      notifications.show({ color: 'green', message: t('tickets.ticketClosed') });
    } catch {
      notifications.show({ color: 'red', message: t('common.error') });
    }
  };

  const handleReopenTicket = async () => {
    try {
      applyTicketUpdate(await supportApi.updateTicket(ticket.id, { status: 'open' }));
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
    <Box style={{
      position: 'fixed',
      top: 60,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--mantine-color-body)',
    }}>
    <Stack gap="md" p="md" style={{
      flex: 1,
      minHeight: 0,
      maxWidth: isMobile ? undefined : 1200,
      width: '100%',
      margin: '0 auto',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <Group gap="sm" wrap="nowrap">
        <ActionIcon variant="subtle" size="lg" onClick={() => navigate(backPath)}>
          <IconArrowLeft size={18} />
        </ActionIcon>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" wrap="nowrap" align="center">
            <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
              #{ticket.number ?? ticket.id.slice(0, 8)}
            </Text>
            <Text fw={700} size="lg" truncate style={{ minWidth: 0 }}>
              {t(`tickets.ticketType.${ticket.type}`)}
            </Text>
            <TicketStatusBadge status={ticket.status} />
          </Group>
          {ticket.assignedTo && (
            <Text size="xs" c="dimmed">🛡 {ticket.assignedTo}</Text>
          )}
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
      <Box ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <Stack gap="sm" p="xs">
          {ticket.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOwn={msg.isOwn ?? (isSpecialistView ? msg.isSpecialist : !msg.isSpecialist)}
              ticket={ticket}
              showAllLabels={isSpecialistView}
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
      </Box>

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
            styles={{ input: { fontSize: 16 } }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (replyText.trim() || selectedFiles.length > 0) handleSend();
              }
            }}
          />
          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileSelect} accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt,.zip,.dmg,.pkg,.exe,.msi,.deb,.rpm,.AppImage,.apk" />
          <Group justify="space-between" mt="xs">
            <ActionIcon size="lg" variant="subtle" color="gray" onClick={() => fileInputRef.current?.click()}>
              <IconPaperclip size={20} />
            </ActionIcon>
            <Button
              variant="filled"
              size="sm"
              leftSection={<IconSend size={15} />}
              onClick={handleSend}
              loading={sending}
              disabled={!replyText.trim() && selectedFiles.length === 0}
            >
              {t('tickets.send')}
            </Button>
          </Group>
        </Paper>
      )}
    </Stack>
    {isMobile && (
      <Box style={{ height: 'calc(112px + env(safe-area-inset-bottom, 0px))', flexShrink: 0 }} />
    )}
    </Box>
  );
}

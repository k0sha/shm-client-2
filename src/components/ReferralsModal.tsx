import { useEffect, useState } from 'react';
import { Modal, Stack, Text, Center, Loader, Card, Group, Pagination } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { userApi, type ReferralUser } from '../api/client';
import { displayReferralUser } from '../utils/ticketDisplay';

interface Props {
  opened: boolean;
  onClose: () => void;
}

const PER_PAGE = 10;

function extractItems(raw: unknown): ReferralUser[] {
  if (!raw || typeof raw !== 'object') return [];
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.items)) return obj.items as ReferralUser[];
  if (Array.isArray(obj.data)) {
    const first = obj.data[0];
    if (first && typeof first === 'object' && Array.isArray((first as Record<string, unknown>).items)) {
      return (first as { items: ReferralUser[] }).items;
    }
    if (obj.data.length > 0 && typeof obj.data[0] === 'object') {
      return obj.data as ReferralUser[];
    }
  }
  return [];
}

export default function ReferralsModal({ opened, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReferralUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!opened) return;
    setLoading(true);
    setError(null);
    setPage(1);
    userApi
      .getReferrals()
      .then((res) => {
        const data = res.data;
        // Diagnostic: surface the raw shape in the console for ops debugging
        // eslint-disable-next-line no-console
        console.debug('[ReferralsModal] response:', data);
        const list = extractItems(data);
        setItems(list);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error('[ReferralsModal] failed:', e);
        setError(e?.response?.status ? `HTTP ${e.response.status}` : 'request failed');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [opened]);

  const totalPages = Math.ceil(items.length / PER_PAGE);
  const paginatedItems = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US');
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('profile.referrals')} size="md">
      {loading ? (
        <Center h={200}>
          <Loader size="lg" />
        </Center>
      ) : items.length === 0 ? (
        <Center py="xl">
          <Stack gap="xs" align="center">
            <Text c="dimmed">{t('profile.referralsEmpty')}</Text>
            {error && <Text size="xs" c="red">{error}</Text>}
          </Stack>
        </Center>
      ) : (
        <Stack gap="md">
          <Text fw={500}>{t('profile.referralsTotal', { count: items.length })}</Text>
          <Stack gap="sm">
            {paginatedItems.map((ref) => (
              <Card key={ref.user_id} withBorder radius="md" p="md">
                <Group justify="space-between" wrap="nowrap" gap="md">
                  <Text fw={500} truncate style={{ flex: 1, minWidth: 0 }}>
                    #{ref.user_id} — {displayReferralUser(ref)}
                  </Text>
                  {ref.created && (
                    <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                      {formatDate(ref.created)}
                    </Text>
                  )}
                </Group>
              </Card>
            ))}
          </Stack>
          {totalPages > 1 && (
            <Center>
              <Pagination total={totalPages} value={page} onChange={setPage} />
            </Center>
          )}
        </Stack>
      )}
    </Modal>
  );
}

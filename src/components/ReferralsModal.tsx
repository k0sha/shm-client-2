import { useEffect, useState } from 'react';
import { Modal, Stack, Text, Center, Loader, Card, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { userApi, type ReferralUser } from '../api/client';
import { displayReferralUser } from '../utils/ticketDisplay';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export default function ReferralsModal({ opened, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReferralUser[]>([]);

  useEffect(() => {
    if (!opened) return;
    setLoading(true);
    userApi
      .getReferrals()
      .then((res) => {
        const payload = res.data?.data?.[0];
        setItems(payload?.items ?? []);
      })
      .catch(() => {
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [opened]);

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
          <Text c="dimmed">{t('profile.referralsEmpty')}</Text>
        </Center>
      ) : (
        <Stack gap="md">
          <Text fw={500}>{t('profile.referralsTotal', { count: items.length })}</Text>
          <Stack gap="sm">
            {items.map((ref) => (
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
        </Stack>
      )}
    </Modal>
  );
}

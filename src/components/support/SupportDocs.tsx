import { Card, Stack, Text, Group, Box } from '@mantine/core';
import { IconFileText, IconExternalLink } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { config } from '../../config';

export function SupportDocs() {
  const { t } = useTranslation();

  const docs = [
    { url: config.PRIVACY_POLICY_URL, title: t('common.privacyPolicy') },
    { url: config.TERMS_OF_USE_URL, title: t('common.termsOfUse') },
    { url: config.PUBLIC_OFFER_URL, title: t('common.publicOffer') },
  ].filter((d) => Boolean(d.url));

  if (docs.length === 0) {
    return <Text c="dimmed" ta="center" py="xl">{t('support.docs.empty')}</Text>;
  }

  return (
    <Stack gap="sm">
      {docs.map((doc) => (
        <Card
          key={doc.url}
          withBorder
          radius="md"
          p="md"
          className="service-card-desktop"
          style={{ cursor: 'pointer' }}
          onClick={() => window.open(doc.url, '_blank', 'noopener,noreferrer')}
        >
          <Group justify="space-between" wrap="nowrap" gap="md">
            <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
              <IconFileText size={20} style={{ flexShrink: 0 }} />
              <Text fw={500} truncate>{doc.title}</Text>
            </Group>
            <Box c="dimmed" style={{ flexShrink: 0, display: 'flex' }}>
              <IconExternalLink size={16} />
            </Box>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}

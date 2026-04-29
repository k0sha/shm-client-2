import { Stack, Text, UnstyledButton, Group, Box } from '@mantine/core';
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
    <Stack gap="xs">
      {docs.map((doc) => (
        <UnstyledButton
          key={doc.url}
          onClick={() => window.open(doc.url, '_blank', 'noopener,noreferrer')}
          style={{
            padding: 'var(--mantine-spacing-md)',
            borderRadius: 'var(--mantine-radius-md)',
            border: '1px solid var(--mantine-color-default-border)',
            background: 'var(--mantine-color-body)',
          }}
        >
          <Group justify="space-between" wrap="nowrap">
            <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
              <IconFileText size={20} style={{ flexShrink: 0 }} />
              <Text fw={500} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {doc.title}
              </Text>
            </Group>
            <Box c="dimmed" style={{ flexShrink: 0 }}>
              <IconExternalLink size={16} />
            </Box>
          </Group>
        </UnstyledButton>
      ))}
    </Stack>
  );
}

import { Card, Stack, Text, Title, ThemeIcon, SimpleGrid, Group } from '@mantine/core';
import { IconMessage, IconHelp, IconFileText, IconArrowRight } from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface HubCard {
  id: 'chat' | 'faq' | 'docs';
  icon: Icon;
  title: string;
  description: string;
  color: string;
}

export function SupportHub({ onSelect }: { onSelect: (id: 'chat' | 'faq' | 'docs') => void }) {
  const { t } = useTranslation();

  const cards: HubCard[] = [
    {
      id: 'chat',
      icon: IconMessage,
      title: t('support.tabs.chat'),
      description: t('support.hub.chatDesc'),
      color: 'blue',
    },
    {
      id: 'faq',
      icon: IconHelp,
      title: t('support.tabs.faq'),
      description: t('support.hub.faqDesc'),
      color: 'cyan',
    },
    {
      id: 'docs',
      icon: IconFileText,
      title: t('support.tabs.docs'),
      description: t('support.hub.docsDesc'),
      color: 'gray',
    },
  ];

  return (
    <Stack gap="md">
      <Title order={2} ta="center" mt="md">
        {t('support.hub.title')}
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.id}
              withBorder
              radius="md"
              p="lg"
              className="service-card-desktop"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelect(card.id)}
            >
              <Stack gap="md" align="center" ta="center">
                <ThemeIcon size={64} radius="md" variant="light" color={card.color}>
                  <Icon size={36} />
                </ThemeIcon>
                <Stack gap={4}>
                  <Text fw={600} size="lg">{card.title}</Text>
                  <Text size="sm" c="dimmed">{card.description}</Text>
                </Stack>
                <Group gap={4} c={card.color} mt="auto">
                  <IconArrowRight size={16} />
                </Group>
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}

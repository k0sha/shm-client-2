import { useState } from 'react';
import { Card, Collapse, Stack, Text, Group } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import faqRu from '../../data/faq.ru.json';
import faqEn from '../../data/faq.en.json';
import faqDe from '../../data/faq.de.json';
import faqFr from '../../data/faq.fr.json';
import faqEs from '../../data/faq.es.json';
import faqUz from '../../data/faq.uz.json';
import faqAr from '../../data/faq.ar.json';

interface FaqCategory {
  id: string;
  title: string;
}

interface FaqItem {
  id: string;
  category: string;
  q: string;
  a: string;
}

interface FaqData {
  categories: FaqCategory[];
  items: FaqItem[];
}

const FAQ_BY_LANG: Record<string, FaqData> = {
  ru: faqRu,
  en: faqEn,
  de: faqDe,
  fr: faqFr,
  es: faqEs,
  uz: faqUz,
  ar: faqAr,
};

export function SupportFAQ() {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').split('-')[0];
  const data = FAQ_BY_LANG[lang] ?? FAQ_BY_LANG.en;

  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Stack gap="lg">
      {data.categories.map((category) => {
        const items = data.items.filter((it) => it.category === category.id);
        if (items.length === 0) return null;

        return (
          <Stack key={category.id} gap="xs">
            <Text fw={600} size="sm" c="dimmed" tt="uppercase">{category.title}</Text>
            <Stack gap="sm">
              {items.map((item) => {
                const isOpen = openIds.has(item.id);
                return (
                  <Card
                    key={item.id}
                    withBorder
                    radius="md"
                    p="md"
                    className="service-card-desktop"
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggle(item.id)}
                  >
                    <Group justify="space-between" wrap="nowrap" gap="md">
                      <Text fw={500} style={{ flex: 1, minWidth: 0 }}>{item.q}</Text>
                      <IconChevronDown
                        size={18}
                        style={{
                          flexShrink: 0,
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 150ms ease',
                        }}
                      />
                    </Group>
                    <Collapse in={isOpen}>
                      <Text size="sm" mt="md" c="dimmed" style={{ whiteSpace: 'pre-line' }}>{item.a}</Text>
                    </Collapse>
                  </Card>
                );
              })}
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
}

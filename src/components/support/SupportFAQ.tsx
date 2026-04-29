import { Accordion, Stack, Text } from '@mantine/core';
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

  return (
    <Stack gap="lg">
      {data.categories.map((category) => {
        const items = data.items.filter((it) => it.category === category.id);
        if (items.length === 0) return null;

        return (
          <Stack key={category.id} gap="xs">
            <Text fw={600} size="sm" c="dimmed" tt="uppercase">{category.title}</Text>
            <Accordion
              variant="separated"
              radius="md"
              styles={{
                item: {
                  backgroundColor: 'var(--mantine-color-body)',
                  borderColor: 'var(--mantine-color-default-border)',
                },
                control: { backgroundColor: 'var(--mantine-color-body)' },
                panel: { backgroundColor: 'var(--mantine-color-body)' },
              }}
            >
              {items.map((item) => (
                <Accordion.Item key={item.id} value={item.id}>
                  <Accordion.Control>{item.q}</Accordion.Control>
                  <Accordion.Panel>
                    <Text size="sm" style={{ whiteSpace: 'pre-line' }}>{item.a}</Text>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </Stack>
        );
      })}
    </Stack>
  );
}

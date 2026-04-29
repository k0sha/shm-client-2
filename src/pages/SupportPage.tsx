import { useSearchParams } from 'react-router-dom';
import { Tabs, Stack, Button } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconMessage, IconHelp, IconFileText, IconArrowLeft } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import Support from './Support';
import { SupportFAQ } from '../components/support/SupportFAQ';
import { SupportDocs } from '../components/support/SupportDocs';
import { SupportHub } from '../components/support/SupportHub';

const VALID_TABS = new Set(['chat', 'faq', 'docs']);

type SectionId = 'chat' | 'faq' | 'docs';

function renderSection(section: SectionId) {
  if (section === 'chat') return <Support />;
  if (section === 'faq') return <SupportFAQ />;
  if (section === 'docs') return <SupportDocs />;
  return null;
}

export default function SupportPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDesktop = useMediaQuery('(min-width: 48em)', true);

  const rawTab = searchParams.get('tab');
  const activeTab = rawTab && VALID_TABS.has(rawTab) ? (rawTab as SectionId) : null;

  const setTab = (value: SectionId | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('tab', value);
    } else {
      next.delete('tab');
    }
    setSearchParams(next, { replace: true });
  };

  // Desktop hub: no tab selected → show landing with 3 cards
  if (isDesktop && !activeTab) {
    return <SupportHub onSelect={(id) => setTab(id)} />;
  }

  // Desktop drill-down: tab selected → show section + back link
  if (isDesktop && activeTab) {
    return (
      <Stack gap="md">
        <div>
          <Button
            variant="subtle"
            size="compact-sm"
            leftSection={<IconArrowLeft size={14} />}
            onClick={() => setTab(null)}
          >
            {t('common.back')}
          </Button>
        </div>
        {renderSection(activeTab)}
      </Stack>
    );
  }

  // Mobile: tabs (default chat)
  const mobileTab: SectionId = activeTab ?? 'chat';
  return (
    <Tabs
      value={mobileTab}
      onChange={(value) => {
        if (value && VALID_TABS.has(value)) setTab(value as SectionId);
      }}
      keepMounted={false}
    >
      <Tabs.List grow>
        <Tabs.Tab value="chat" leftSection={<IconMessage size={16} />}>
          {t('support.tabs.chat')}
        </Tabs.Tab>
        <Tabs.Tab value="faq" leftSection={<IconHelp size={16} />}>
          {t('support.tabs.faq')}
        </Tabs.Tab>
        <Tabs.Tab value="docs" leftSection={<IconFileText size={16} />}>
          {t('support.tabs.docs')}
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="chat" pt="md"><Support /></Tabs.Panel>
      <Tabs.Panel value="faq" pt="md"><SupportFAQ /></Tabs.Panel>
      <Tabs.Panel value="docs" pt="md"><SupportDocs /></Tabs.Panel>
    </Tabs>
  );
}

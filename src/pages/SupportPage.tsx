import { useSearchParams } from 'react-router-dom';
import { Tabs } from '@mantine/core';
import { IconMessage, IconHelp, IconFileText } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import Support from './Support';
import { SupportFAQ } from '../components/support/SupportFAQ';
import { SupportDocs } from '../components/support/SupportDocs';

const VALID_TABS = new Set(['chat', 'faq', 'docs']);

export default function SupportPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab = rawTab && VALID_TABS.has(rawTab) ? rawTab : 'chat';

  const handleTabChange = (value: string | null) => {
    if (!value) return;
    const next = new URLSearchParams(searchParams);
    if (value === 'chat') {
      next.delete('tab');
    } else {
      next.set('tab', value);
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <Tabs value={activeTab} onChange={handleTabChange} keepMounted={false}>
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

      <Tabs.Panel value="chat" pt="md">
        <Support />
      </Tabs.Panel>
      <Tabs.Panel value="faq" pt="md">
        <SupportFAQ />
      </Tabs.Panel>
      <Tabs.Panel value="docs" pt="md">
        <SupportDocs />
      </Tabs.Panel>
    </Tabs>
  );
}

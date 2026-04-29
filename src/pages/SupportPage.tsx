import { useSearchParams } from 'react-router-dom';
import { Stack, Button } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
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

  // No tab → hub landing (cards)
  if (!activeTab) {
    return <SupportHub onSelect={(id) => setTab(id)} />;
  }

  // Tab selected → section content with back link
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

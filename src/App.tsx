import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { useEffect, useRef, useState } from 'react';
import { MantineProvider, createTheme, AppShell, Group, Text, ActionIcon, useMantineColorScheme, useComputedColorScheme, Center, Loader, Box, Button, Modal, TextInput, Stack, Card, Badge } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useMediaQuery, useHotkeys, useLongPress } from '@mantine/hooks';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { IconSun, IconMoon, IconLogout, IconHeadset, IconBrandTelegram } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useStore } from './store/useStore';
import { NAV_ITEMS } from './constants/navigation';
import { auth, storageApi } from './api/client';
import { clearInviteTelegramFlow, clearInviteWebsiteFlow, clearPendingInviteChoice, getCookie, getInviteStart, hasInviteTelegramFlow, hasPendingInviteChoice, markInviteTelegramFlow, markInviteWebsiteFlow, parseAndSaveInviteStart, removeCookie, removeInviteStart, parseAndSavePartnerId, parseAndSaveSessionId } from './api/cookie';
import { config } from './config';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTelegramWebApp } from './hooks/useTelegramWebApp';
import { useEmailRequired } from './hooks/useEmailRequired';

parseAndSaveSessionId();
parseAndSaveInviteStart();
parseAndSavePartnerId();
function supportsTelegramChoice(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent || '';
  const isTelegramBlockedEnv = /Instagram|FBAN|FBAV|Line\//i.test(ua);
  if (isTelegramBlockedEnv) {
    return false;
  }

  return /Android|iPhone|iPad|iPod|Windows|Macintosh|Linux/i.test(ua);
}

function buildTelegramStartLink(start: string): string | null {
  const botName = config.TELEGRAM_BOT_NAME?.trim();
  if (!botName) {
    return null;
  }

  return `https://t.me/${botName}?start=${encodeURIComponent(start)}`;
}

function buildTelegramDeepLink(start: string): string | null {
  const botName = config.TELEGRAM_BOT_NAME?.trim();
  if (!botName) {
    return null;
  }

  return `tg://resolve?domain=${encodeURIComponent(botName)}&start=${encodeURIComponent(start)}`;
}

function openTelegramLinkSmart(start: string): void {
  const telegramStartLink = buildTelegramStartLink(start);
  const telegramDeepLink = buildTelegramDeepLink(start);

  if (!telegramStartLink) {
    return;
  }

  if (!telegramDeepLink) {
    window.location.href = telegramStartLink;
    return;
  }

  let finished = false;

  const cleanup = () => {
    window.removeEventListener('pagehide', handleSuccess);
    window.removeEventListener('blur', handleSuccess);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  const handleSuccess = () => {
    finished = true;
    cleanup();
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      handleSuccess();
    }
  };

  window.addEventListener('pagehide', handleSuccess, { once: true });
  window.addEventListener('blur', handleSuccess, { once: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);

  window.location.href = telegramDeepLink;

  window.setTimeout(() => {
    if (finished) {
      return;
    }

    cleanup();
    window.location.href = telegramStartLink;
  }, 1200);
}

function useTelegramOpenState() {
  const [telegramOpening, setTelegramOpening] = useState(false);
  const telegramFallbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (telegramFallbackTimerRef.current) {
        window.clearTimeout(telegramFallbackTimerRef.current);
      }
    };
  }, []);

  const beginTelegramOpening = () => {
    setTelegramOpening(true);

    const resetOpeningState = () => {
      setTelegramOpening(false);
      telegramFallbackTimerRef.current = null;
    };

    telegramFallbackTimerRef.current = window.setTimeout(() => {
      resetOpeningState();
    }, 2500);

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden && telegramFallbackTimerRef.current) {
          window.clearTimeout(telegramFallbackTimerRef.current);
          resetOpeningState();
        }
      },
      { once: true }
    );
  };

  return { telegramOpening, beginTelegramOpening };
}

import Services from './pages/Services';
import Profile from './pages/Profile';
import Support from './pages/Support';
import Tickets from './pages/Tickets';
import SupportTicket from './pages/SupportTicket';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  defaultRadius: 'md',
  colors: {
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5c5f66',
      '#373A40',
      '#2C2E33',
      '#25262b',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },
  components: {
    Modal: {
      defaultProps: {
        lockScroll: false,
      },
    },
  },
});

function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');

  return (
    <ActionIcon
      onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
      variant="default"
      size="lg"
      aria-label="Toggle color scheme"
    >
      {computedColorScheme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
    </ActionIcon>
  );
}

function WebAppHeader({ onShowVersion }: { onShowVersion?: () => void }) {
  const navigate = useNavigate();
  const { logout } = useStore();
  const longPressProps = useLongPress(onShowVersion ?? (() => {}));
  const computedColorScheme = useComputedColorScheme('light');
  const { setColorScheme } = useMantineColorScheme();

  const handleThemeToggle = () => {
    setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light');
  };

  const handleSupportLink = () => {
    if (config.SUPPORT_LINK) {
      const tgWebApp = window.Telegram?.WebApp;
      if (tgWebApp && config.SUPPORT_LINK.includes('t.me')) {
        tgWebApp.openTelegramLink(config.SUPPORT_LINK);
      } else {
        window.open(config.SUPPORT_LINK, '_blank');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Group justify="space-between" p="sm" gap="xs" wrap="nowrap">
      <Group gap="xs" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} wrap="nowrap" {...longPressProps}>
        {config.LOGO_URL && (
          <img
            src={config.LOGO_URL}
            alt=""
            style={{ height: 28, width: 28, objectFit: 'contain', flexShrink: 0 }}
          />
        )}
        <Text size="md" fw={700}>{config.APP_NAME}</Text>
      </Group>
      <Group gap="xs" wrap="nowrap">
        { config.SUPPORT_LINK &&  <ActionIcon
          onClick={handleSupportLink}
          variant="subtle"
          size="lg"
          color="blue"
        >
          <IconHeadset size={20} />
        </ActionIcon> }
        <LanguageSwitcher />
        <ActionIcon
          onClick={handleThemeToggle}
          variant="subtle"
          size="lg"
          color={computedColorScheme === 'dark' ? 'gray' : 'gray'}
        >
          {computedColorScheme === 'light' ? <IconMoon size={20} /> : <IconSun size={20} />}
        </ActionIcon>
        {(
          <ActionIcon
            onClick={handleLogout}
            variant="subtle"
            size="lg"
            color="red"
          >
            <IconLogout size={20} />
          </ActionIcon>
        )}
      </Group>
    </Group>
  );
}

function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const computedColorScheme = useComputedColorScheme('light');
  const { t } = useTranslation();
  const { isSupportUser, supportUnreadCount, ticketsUnreadCount } = useStore();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.requiresRole || isSupportUser
  );

  const handleClick = (path: string) => {
    navigate(path);
  };

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 300,
      }}
    >
      <Box
        style={{
          background: computedColorScheme === 'dark'
            ? 'rgba(40, 40, 45, 0.85)'
            : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 20,
          border: computedColorScheme === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: computedColorScheme === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
            : '0 8px 32px rgba(0, 0, 0, 0.12)',
          padding: '8px 12px',
        }}
      >
        <Group justify="space-around" gap={4}>
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Box
                key={item.path}
                onClick={() => handleClick(item.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 12px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  background: isActive
                    ? (computedColorScheme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                    : 'transparent',
                  color: isActive ? 'var(--mantine-color-blue-6)' : (computedColorScheme === 'dark' ? '#9ca3af' : '#6b7280'),
                  transition: 'all 0.2s ease',
                }}
              >
                <Box style={{ position: 'relative', display: 'inline-flex' }}>
                  <Icon size={20} />
                  {item.path === '/support' && supportUnreadCount > 0 && (
                    <Badge size="xs" variant="filled" color="red" circle style={{ position: 'absolute', top: -6, right: -8, minWidth: 16, height: 16, fontSize: 9, padding: '0 3px' }}>
                      {supportUnreadCount}
                    </Badge>
                  )}
                  {item.path === '/tickets' && ticketsUnreadCount > 0 && (
                    <Badge size="xs" variant="filled" color="red" circle style={{ position: 'absolute', top: -6, right: -8, minWidth: 16, height: 16, fontSize: 9, padding: '0 3px' }}>
                      {ticketsUnreadCount}
                    </Badge>
                  )}
                </Box>
                <Text size="xs" mt={4} fw={isActive ? 600 : 400}>{t(item.labelKey)}</Text>
              </Box>
            );
          })}
        </Group>
      </Box>
    </Box>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userEmail, isAuthenticated, isLoading, setUser, setIsLoading, logout, isSupportUser, setIsSupportUser } = useStore();
  const [roleChecked, setRoleChecked] = useState(false);
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.requiresRole || isSupportUser
  );
  const { isInsideTelegramWebApp } = useTelegramWebApp();
  const isTelegramWebAppRuntime = isInsideTelegramWebApp;
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { t } = useTranslation();
  const {
    modalOpen: globalEmailModalOpen,
    setModalOpen: setGlobalEmailModalOpen,
    emailInput: globalEmailInput,
    setEmailInput: setGlobalEmailInput,
    saving: globalEmailSaving,
    handleSave: handleGlobalSaveEmail,
    isValidEmail,
    verifyModalOpen: globalVerifyModalOpen,
    setVerifyModalOpen: setGlobalVerifyModalOpen,
    verifyCode: globalVerifyCode,
    setVerifyCode: setGlobalVerifyCode,
    verifySending: globalVerifySending,
    verifyConfirming: globalVerifyConfirming,
    resendCooldown: globalResendCooldown,
    pendingEmail: globalPendingEmail,
    handleConfirmEmail: handleGlobalConfirmEmail,
    handleResendCode: handleGlobalResendCode,
  } = useEmailRequired();

  const [versionOpen, setVersionOpen] = useState(false);
  const [preferWebsiteFlow, setPreferWebsiteFlow] = useState(false);
  const [showInviteChoiceCard, setShowInviteChoiceCard] = useState(false);
  const { telegramOpening, beginTelegramOpening } = useTelegramOpenState();
  useEffect(() => {
    if (isAuthenticated) {
      removeInviteStart();
      clearPendingInviteChoice();
      clearInviteWebsiteFlow();
      clearInviteTelegramFlow();
      setPreferWebsiteFlow(false);
      setShowInviteChoiceCard(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!getInviteStart()) {
      clearInviteTelegramFlow();
      setPreferWebsiteFlow(false);
      setShowInviteChoiceCard(false);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (hasInviteTelegramFlow()) {
      setShowInviteChoiceCard(true);
    }
  }, []);


  const showVersion = () => setVersionOpen(true);
  const longPressProps = useLongPress(showVersion);


  const handleSupportLink = () => {
    if (config.SUPPORT_LINK) {
      const tgWebApp = window.Telegram?.WebApp;
      if (tgWebApp && isTelegramWebAppRuntime && config.SUPPORT_LINK.includes('t.me')) {
        tgWebApp.openTelegramLink(config.SUPPORT_LINK);
      } else {
        window.open(config.SUPPORT_LINK, '_blank');
      }
    }
  };

  useEffect(() => {
    const tgWebApp = window.Telegram?.WebApp;
    if (tgWebApp && isTelegramWebAppRuntime) {
      tgWebApp.ready();
      tgWebApp.expand();

      if (tgWebApp.setHeaderColor) {
        tgWebApp.setHeaderColor('secondary_bg_color');
      }
      if (tgWebApp.setBackgroundColor) {
        tgWebApp.setBackgroundColor('secondary_bg_color');
      }
    }
  }, [isTelegramWebAppRuntime]);

  useEffect(() => {
    const tgWebApp = window.Telegram?.WebApp;
    if (!tgWebApp || !isTelegramWebAppRuntime) return;

    const backButton = tgWebApp.BackButton;
    if (!backButton) return;

    const isMainPage = location.pathname === '/' || location.pathname === '';

    if (isMainPage) {
      backButton.hide();
    } else {
      backButton.show();
      backButton.onClick(() => {
        navigate('/');
      });
    }

    return () => {
      backButton.hide();
      backButton.offClick(() => {});
    };
  }, [location.pathname, navigate, isTelegramWebAppRuntime]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getCookie();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await auth.getCurrentUser();
        const responseData = response.data.data;
        const userData: any = Array.isArray(responseData) ? responseData[0] : responseData;
        setUser(userData);
      } catch {
        removeCookie();
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [setUser, setIsLoading]);

  useEffect(() => {
    if (!isAuthenticated) { setRoleChecked(true); return; }
    setRoleChecked(false);
    storageApi.get('support_role')
      .then((res) => setIsSupportUser(!!res.data))
      .catch(() => setIsSupportUser(false))
      .finally(() => setRoleChecked(true));
  }, [isAuthenticated, setIsSupportUser]);

  useHotkeys([
    ['shift + V', () => setVersionOpen(true)],
  ]);

  const inviteStart = getInviteStart()?.trim() || null;
  const telegramStartLink = inviteStart ? buildTelegramStartLink(inviteStart) : null;
  const shouldShowTelegramChoice = !isLoading && !isAuthenticated && !preferWebsiteFlow && !isTelegramWebAppRuntime && !!inviteStart && !!telegramStartLink && hasPendingInviteChoice() && supportsTelegramChoice();
  const shouldRenderTelegramChoice = showInviteChoiceCard || telegramOpening;
  useEffect(() => {
    if (shouldShowTelegramChoice) {
      setShowInviteChoiceCard(true);
      clearPendingInviteChoice();
    }
  }, [shouldShowTelegramChoice]);

  const handleTelegramContinue = () => {
    if (!inviteStart || telegramOpening) {
      return;
    }
    markInviteTelegramFlow();
    setShowInviteChoiceCard(true);
    clearInviteWebsiteFlow();
    clearPendingInviteChoice();
    beginTelegramOpening();
    openTelegramLinkSmart(inviteStart);
  };

  if (isLoading || !roleChecked) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    if (shouldRenderTelegramChoice) {
      return (
        <>
          <Center h="100vh" px="md">
            <Card withBorder radius="md" p="xl" w={420}>
              <Stack gap="lg">
                <Group justify="space-between" align="center">
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                    <ThemeToggle />
                  </div>
                  <Group gap="xs" align="center" style={{ flex: 'auto', justifyContent: 'center' }}>
                    {config.LOGO_URL && (
                      <img
                        src={config.LOGO_URL}
                        alt=""
                        style={{ height: 28, width: 28, objectFit: 'contain', flexShrink: 0 }}
                      />
                    )}
                    <Text fw={700} size="xl" ta="center">{config.APP_NAME}</Text>
                  </Group>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <LanguageSwitcher />
                  </div>
                </Group>

                <Text size="sm" c="dimmed" ta="center">
                  {t('auth.inviteChoiceDescription')}
                </Text>

                <Button
                  size="md"
                  fullWidth
                  onClick={handleTelegramContinue}
                  loading={telegramOpening}
                  disabled={telegramOpening}
                  leftSection={<IconBrandTelegram size={18} />}
                >
                  {t('auth.continueInTelegram')}
                </Button>

                <Button
                  variant="light"
                  size="md"
                  fullWidth
                  onClick={() => {
                    clearInviteTelegramFlow();
                    markInviteWebsiteFlow();
                    clearPendingInviteChoice();
                    setShowInviteChoiceCard(false);
                    setPreferWebsiteFlow(true);
                  }}
                  disabled={telegramOpening}
                >
                  {t('auth.continueOnWebsite')}
                </Button>
              </Stack>
            </Card>
          </Center>

          {config.SUPPORT_LINK && (
            <Button
              onClick={handleSupportLink}
              style={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 200,
              }}
              leftSection={<IconHeadset size={20} />}
              radius="xl"
              size="md"
            >
              {t('common.support')}
            </Button>
          )}
        </>
      );
    }

    return <Login />;
  }

  const emailRequiredModal = (
    <Modal
      opened={globalEmailModalOpen}
      onClose={() => {
        if (config.EMAIL_REQUIRED === 'true' && !userEmail) return;
        setGlobalEmailModalOpen(false);
      }}
      title={t('profile.linkEmail')}
      closeOnClickOutside={!(config.EMAIL_REQUIRED === 'true' && !userEmail)}
      closeOnEscape={!(config.EMAIL_REQUIRED === 'true' && !userEmail)}
      withCloseButton={!(config.EMAIL_REQUIRED === 'true' && !userEmail)}
    >
      <Stack gap="md">
        <TextInput
          label={t('profile.emailAddress')}
          placeholder="example@email.com"
          withAsterisk
          error={globalEmailInput.length > 0 && !isValidEmail(globalEmailInput)}
          type="email"
          value={globalEmailInput}
          onChange={(e) => setGlobalEmailInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGlobalSaveEmail()}
        />
        <Text size="xs" c="dimmed">
          {t('profile.emailHint')}
        </Text>
        <Group justify="flex-end">
          <Button variant="light" onClick={() => setGlobalEmailModalOpen(false)} disabled={config.EMAIL_REQUIRED === 'true' && !userEmail}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleGlobalSaveEmail} loading={globalEmailSaving} disabled={!isValidEmail(globalEmailInput)}>
            {t('common.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );

  const verifyRequiredModal = (
    <Modal
      opened={globalVerifyModalOpen}
      onClose={() => setGlobalVerifyModalOpen(false)}
      title={t('profile.verifyEmail')}
    >
      <Stack gap="md">
        <Text size="sm">
          {t('profile.verifyEmailDescription', { email: globalPendingEmail })}
        </Text>
        <TextInput
          label={t('profile.verifyCode')}
          placeholder="123456"
          value={globalVerifyCode}
          onChange={(e) => setGlobalVerifyCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGlobalConfirmEmail()}
          maxLength={6}
        />
        <Group justify="space-between">
          <Button
            variant="subtle"
            size="xs"
            onClick={handleGlobalResendCode}
            loading={globalVerifySending}
            disabled={globalResendCooldown > 0}
          >
            {globalResendCooldown > 0 ? `${t('profile.resendCode')} (${globalResendCooldown}s)` : t('profile.resendCode')}
          </Button>
          <Group gap="xs">
            <Button variant="light" onClick={() => setGlobalVerifyModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleGlobalConfirmEmail}
              loading={globalVerifyConfirming}
              disabled={!globalVerifyCode.trim()}
            >
              {t('profile.confirmEmail')}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );

  const versionModal = (
    <Modal opened={versionOpen} onClose={() => setVersionOpen(false)} title="Version" size="xs" centered>
      <Text size="sm" ff="monospace" ta="center" py="xs">{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '?'} {  }</Text>
    </Modal>
  );

  if (isTelegramWebAppRuntime || isMobile) {
    return (
      <>
        {emailRequiredModal}
        {verifyRequiredModal}
        {versionModal}
        <Box style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          zIndex: 300,
          background: 'var(--mantine-color-body)',
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}>
          <WebAppHeader onShowVersion={showVersion} />
        </Box>
        <Box style={{ minHeight: '100vh', paddingTop: 60, paddingBottom: 110 }}>
          <Box px="md">
            <Routes>
              <Route path="/" element={<Services />} />
              <Route path="/profile" element={<Profile />} />
              {isSupportUser && <Route path="/support" element={<Support />} />}
              {isSupportUser && <Route path="/support/:ticketId" element={<SupportTicket />} />}
              {isSupportUser && <Route path="/tickets" element={<Tickets />} />}
              {isSupportUser && <Route path="/tickets/:ticketId" element={<SupportTicket />} />}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Box>
        </Box>
        <BottomNavigation />
      </>
    );
  }

  const appShellMaxWidth = 1200;

  return (
    <>
      {emailRequiredModal}
      {verifyRequiredModal}
      {versionModal}
      <AppShell
        header={{ height: 60 }}
        padding="md"
        styles={{
          header: {
            borderBottom: 0,
          },
        }}
      >
        <AppShell.Header>
          <Box style={{ maxWidth: appShellMaxWidth, margin: '0 auto', height: '100%' }}>
          <Group h="100%" px="md" justify="space-between" wrap="nowrap">
            <Group gap="xs" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} {...longPressProps}>
              {config.LOGO_URL && (
                <img
                  src={config.LOGO_URL}
                  alt=""
                  style={{ height: 32, width: 32, objectFit: 'contain', flexShrink: 0 }}
                />
              )}
              <Text
                size="lg"
                fw={700}
                visibleFrom={config.APP_NAME.length > 10 ? 'sm' : undefined}
              >
                {config.APP_NAME}
              </Text>
            </Group>
            <Group gap="xs" visibleFrom="sm" wrap="nowrap">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    leftSection={<Icon size={16} />}
                    variant={isActive ? 'light' : 'subtle'}
                    size="xs"
                    radius="md"
                  >
                    {t(item.labelKey)}
                  </Button>
                );
              })}
            </Group>
            <Group>
              { config.SUPPORT_LINK &&  <ActionIcon
                onClick={handleSupportLink}
                variant="subtle"
                size="lg"
                color="blue"
              >
              <IconHeadset size={20} />
              </ActionIcon> }
              <LanguageSwitcher />
              <ThemeToggle />
              {(
              <ActionIcon
                onClick={logout}
                variant="default"
                size="lg"
                aria-label="Logout"
              >
                <IconLogout size={18} />
              </ActionIcon>
            )}
            </Group>
          </Group>
          </Box>
        </AppShell.Header>

        <AppShell.Main>
          <Box style={{ maxWidth: appShellMaxWidth, margin: '0 auto' }}>
            <Routes>
              <Route path="/" element={<Services />} />
              <Route path="/profile" element={<Profile />} />
              {isSupportUser && <Route path="/support" element={<Support />} />}
              {isSupportUser && <Route path="/support/:ticketId" element={<SupportTicket />} />}
              {isSupportUser && <Route path="/tickets" element={<Tickets />} />}
              {isSupportUser && <Route path="/tickets/:ticketId" element={<SupportTicket />} />}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Box>
        </AppShell.Main>
      </AppShell>
    </>
  );
}

function App() {
  const basePath = config.SHM_BASE_PATH && config.SHM_BASE_PATH !== '/' ? config.SHM_BASE_PATH : undefined;

  useEffect(() => {
    if (config.BITRIX_WIDGET_SCRIPT_URL) {
      const script = document.createElement('script');
      script.async = true;
      script.src = config.BITRIX_WIDGET_SCRIPT_URL + '?' + (Date.now() / 60000 | 0);
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript?.parentNode?.insertBefore(script, firstScript);

      return () => {
        script.remove();
      };
    }
  }, []);

  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-right" />
      <BrowserRouter basename={basePath}>
        <AppContent />
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
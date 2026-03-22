interface AppConfig {
  APP_NAME: string;
  TELEGRAM_BOT_NAME: string;
  TELEGRAM_BOT_AUTH_ENABLE: string;
  TELEGRAM_WEBAPP_AUTH_ENABLE: string;
  TELEGRAM_WEBAPP_AUTO_AUTH_ENABLE: string;
  TELEGRAM_WEBAPP_PROFILE: string;
  SUPPORT_LINK: string;
  DEFAULT_LANGUAGE: string;
  SHM_BASE_PATH: string;
  OTP_ENABLE: string;
  PASSKEY_ENABLE: string;
  PASSKEY_AUTH_DISABLED: string;
  BITRIX_WIDGET_SCRIPT_URL: string;
  PROXY_CATEGORY: string;
  PROXY_CATEGORY_TITLE: string;
  PROXY_STORAGE_PREFIX?: string;
  VPN_CATEGORY: string;
  VPN_CATEGORY_TITLE: string;
  VPN_STORAGE_PREFIX?: string;
  VISIBLE_CATEGORIES: string;
  EMAIL_REQUIRED: string;
  EMAIL_VERIFY_REQUIRED: string;
  ALLOW_SERVICE_BLOCKED: string;
  ALLOW_SERVICE_DELETE: string;
  ALLOW_SERVICE_CHANGE: string;
  ALLOW_SERVICE_CHANGE_FORCE: string;
  ALLOW_TELEGRAM_PIN: string;
  APP_WINDOWS_URL: string;
  APP_LINUX_URL: string;
  APP_MAC_URL: string;
  APP_IOS_URL: string;
  APP_ANDROID_URL: string;
  APP_APPLE_TV_URL: string;
  APP_ANDROID_TV_URL: string;
  WINDOWS_APP_NAME: string;
  LINUX_APP_NAME: string;
  MAC_APP_NAME: string;
  IOS_APP_NAME: string;
  ANDROID_APP_NAME: string;
  APPLE_TV_APP_NAME: string;
  ANDROID_TV_APP_NAME: string;
  CAPTCHA_ENABLED: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: AppConfig;
  }
}

function getConfig(): AppConfig {
  const runtimeConfig = window.__APP_CONFIG__;

  return {
    APP_NAME: runtimeConfig?.APP_NAME || import.meta.env.VITE_APP_NAME || 'SHM Client',
    TELEGRAM_BOT_NAME: runtimeConfig?.TELEGRAM_BOT_NAME || import.meta.env.VITE_TELEGRAM_BOT_NAME || '',
    TELEGRAM_BOT_AUTH_ENABLE: runtimeConfig?.TELEGRAM_BOT_AUTH_ENABLE || import.meta.env.VITE_TELEGRAM_BOT_AUTH_ENABLE || 'false',
    TELEGRAM_WEBAPP_AUTH_ENABLE: runtimeConfig?.TELEGRAM_WEBAPP_AUTH_ENABLE || import.meta.env.VITE_TELEGRAM_WEBAPP_AUTH_ENABLE || 'false',
    TELEGRAM_WEBAPP_AUTO_AUTH_ENABLE: runtimeConfig?.TELEGRAM_WEBAPP_AUTO_AUTH_ENABLE || import.meta.env.VITE_TELEGRAM_WEBAPP_AUTO_AUTH_ENABLE || 'false',
    TELEGRAM_WEBAPP_PROFILE: runtimeConfig?.TELEGRAM_WEBAPP_PROFILE || import.meta.env.VITE_TELEGRAM_WEBAPP_PROFILE || '',
    SUPPORT_LINK: runtimeConfig?.SUPPORT_LINK || import.meta.env.VITE_SUPPORT_LINK || '',
    DEFAULT_LANGUAGE: runtimeConfig?.DEFAULT_LANGUAGE || import.meta.env.VITE_DEFAULT_LANGUAGE || 'ru',
    SHM_BASE_PATH: runtimeConfig?.SHM_BASE_PATH || import.meta.env.VITE_SHM_BASE_PATH || '/',
    OTP_ENABLE: runtimeConfig?.OTP_ENABLE || import.meta.env.VITE_OTP_ENABLE || 'true',
    PASSKEY_ENABLE: runtimeConfig?.PASSKEY_ENABLE || import.meta.env.VITE_PASSKEY_ENABLE || 'true',
    PASSKEY_AUTH_DISABLED: runtimeConfig?.PASSKEY_AUTH_DISABLED || import.meta.env.VITE_PASSKEY_AUTH_DISABLED || 'false',
    BITRIX_WIDGET_SCRIPT_URL: runtimeConfig?.BITRIX_WIDGET_SCRIPT_URL || import.meta.env.VITE_BITRIX_WIDGET_SCRIPT_URL || '',
    PROXY_CATEGORY: runtimeConfig?.PROXY_CATEGORY || import.meta.env.VITE_PROXY_CATEGORY || '',
    PROXY_CATEGORY_TITLE: runtimeConfig?.PROXY_CATEGORY_TITLE || import.meta.env.VITE_PROXY_CATEGORY_TITLE || '',
    PROXY_STORAGE_PREFIX: runtimeConfig?.PROXY_STORAGE_PREFIX || import.meta.env.VITE_PROXY_STORAGE_PREFIX || '',
    VPN_CATEGORY: runtimeConfig?.VPN_CATEGORY || import.meta.env.VITE_VPN_CATEGORY || '',
    VPN_CATEGORY_TITLE: runtimeConfig?.VPN_CATEGORY_TITLE || import.meta.env.VITE_VPN_CATEGORY_TITLE|| '',
    VPN_STORAGE_PREFIX: runtimeConfig?.VPN_STORAGE_PREFIX || import.meta.env.VITE_VPN_STORAGE_PREFIX || '',
    VISIBLE_CATEGORIES: runtimeConfig?.VISIBLE_CATEGORIES || import.meta.env.VITE_VISIBLE_CATEGORIES || '',
    EMAIL_REQUIRED: runtimeConfig?.EMAIL_REQUIRED || import.meta.env.VITE_EMAIL_REQUIRED || 'false',
    EMAIL_VERIFY_REQUIRED: runtimeConfig?.EMAIL_VERIFY_REQUIRED || import.meta.env.VITE_EMAIL_VERIFY_REQUIRED || 'false',
    ALLOW_SERVICE_BLOCKED: runtimeConfig?.ALLOW_SERVICE_BLOCKED || import.meta.env.VITE_ALLOW_SERVICE_BLOCKED || 'true',
    ALLOW_SERVICE_DELETE: runtimeConfig?.ALLOW_SERVICE_DELETE || import.meta.env.VITE_ALLOW_SERVICE_DELETE || 'true',
    ALLOW_SERVICE_CHANGE: runtimeConfig?.ALLOW_SERVICE_CHANGE || import.meta.env.VITE_ALLOW_SERVICE_CHANGE || 'true',
    ALLOW_SERVICE_CHANGE_FORCE: runtimeConfig?.ALLOW_SERVICE_CHANGE_FORCE || import.meta.env.VITE_ALLOW_SERVICE_CHANGE_FORCE || 'false',
    ALLOW_TELEGRAM_PIN: runtimeConfig?.ALLOW_TELEGRAM_PIN || import.meta.env.VITE_ALLOW_TELEGRAM_PIN || 'true',
    APP_WINDOWS_URL: runtimeConfig?.APP_WINDOWS_URL || import.meta.env.VITE_APP_WINDOWS_URL || 'https://github.com/Happ-proxy/happ-desktop/releases/latest/download/setup-Happ.x64.exe',
    APP_LINUX_URL: runtimeConfig?.APP_LINUX_URL || import.meta.env.VITE_APP_LINUX_URL || 'https://github.com/Happ-proxy/happ-desktop/releases/latest/download/Happ.linux.x64.deb',
    APP_MAC_URL: runtimeConfig?.APP_MAC_URL || import.meta.env.VITE_APP_MAC_URL || 'https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973',
    APP_IOS_URL: runtimeConfig?.APP_IOS_URL || import.meta.env.VITE_APP_IOS_URL || 'https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973',
    APP_ANDROID_URL: runtimeConfig?.APP_ANDROID_URL || import.meta.env.VITE_APP_ANDROID_URL || 'https://play.google.com/store/apps/details?id=com.happproxy',
    APP_APPLE_TV_URL: runtimeConfig?.APP_APPLE_TV_URL || import.meta.env.VITE_APP_APPLE_TV_URL || 'https://apps.apple.com/us/app/happ-proxy-utility-for-tv/id6748297274',
    APP_ANDROID_TV_URL: runtimeConfig?.APP_ANDROID_TV_URL || import.meta.env.VITE_APP_ANDROID_TV_URL || 'https://play.google.com/store/apps/details?id=com.happproxy',
    WINDOWS_APP_NAME: runtimeConfig?.WINDOWS_APP_NAME || import.meta.env.VITE_WINDOWS_APP_NAME || 'Скачать для Windows',
    LINUX_APP_NAME: runtimeConfig?.LINUX_APP_NAME || import.meta.env.VITE_LINUX_APP_NAME || 'Скачать для Linux',
    MAC_APP_NAME: runtimeConfig?.MAC_APP_NAME || import.meta.env.VITE_MAC_APP_NAME || 'Скачать для Mac',
    IOS_APP_NAME: runtimeConfig?.IOS_APP_NAME || import.meta.env.VITE_IOS_APP_NAME || 'Скачать для iOS',
    ANDROID_APP_NAME: runtimeConfig?.ANDROID_APP_NAME || import.meta.env.VITE_ANDROID_APP_NAME || 'Скачать для Android',
    APPLE_TV_APP_NAME: runtimeConfig?.APPLE_TV_APP_NAME || import.meta.env.VITE_APPLE_TV_APP_NAME || 'Скачать для Apple TV',
    ANDROID_TV_APP_NAME: runtimeConfig?.ANDROID_TV_APP_NAME || import.meta.env.VITE_ANDROID_TV_APP_NAME || 'Скачать для Android TV',
    CAPTCHA_ENABLED: runtimeConfig?.CAPTCHA_ENABLED || import.meta.env.VITE_CAPTCHA_ENABLED || 'false',
  };
}

export const config = getConfig();

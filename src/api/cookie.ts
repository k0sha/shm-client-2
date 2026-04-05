function buildUrlWithoutSearchParam(paramName: string): string {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.delete(paramName);
  const newSearch = urlParams.toString();
  return window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
}

function replaceUrlWithoutSearchParam(paramName: string): void {
  window.history.replaceState({}, '', buildUrlWithoutSearchParam(paramName));
}
const COOKIE_NAME = 'session_id';
const COOKIE_DAYS = 3;

export function setCookie(value: string): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + COOKIE_DAYS * 24 * 60 * 60 * 1000);
  document.cookie = `${COOKIE_NAME}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getCookie(): string | null {
  const name = COOKIE_NAME + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

export function removeCookie(): void {
  document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
}

export function extendCookie(): void {
  const value = getCookie();
  if (value) {
    setCookie(value);
  }
}

const PARTNER_COOKIE_NAME = 'partner_id';
const PARTNER_COOKIE_DAYS = 30;

export function setPartnerCookie(value: string): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + PARTNER_COOKIE_DAYS * 24 * 60 * 60 * 1000);
  document.cookie = `${PARTNER_COOKIE_NAME}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getPartnerCookie(): string | null {
  const name = PARTNER_COOKIE_NAME + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

export function removePartnerCookie(): void {
  document.cookie = `${PARTNER_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
}

const INVITE_START_STORAGE_KEY = 'invite_start';
const INVITE_CHOICE_PENDING_SESSION_KEY = 'invite_choice_pending';
const INVITE_WEBSITE_FLOW_SESSION_KEY = 'invite_website_flow';
const INVITE_TELEGRAM_FLOW_SESSION_KEY = 'invite_telegram_flow';
const INVITE_TELEGRAM_FLOW_TTL_MS = 3000;

export function setInviteStart(value: string): void {
  try {
    window.localStorage.setItem(INVITE_START_STORAGE_KEY, value);
  } catch {
    // ignore storage errors
  }
}

export function getInviteStart(): string | null {
  try {
    return window.localStorage.getItem(INVITE_START_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function removeInviteStart(): void {
  try {
    window.localStorage.removeItem(INVITE_START_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

export function markInviteChoicePending(): void {
  try {
    window.sessionStorage.setItem(INVITE_CHOICE_PENDING_SESSION_KEY, '1');
  } catch {
    // ignore storage errors
  }
}

export function hasPendingInviteChoice(): boolean {
  try {
    return window.sessionStorage.getItem(INVITE_CHOICE_PENDING_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearPendingInviteChoice(): void {
  try {
    window.sessionStorage.removeItem(INVITE_CHOICE_PENDING_SESSION_KEY);
  } catch {
    // ignore storage errors
  }
}

export function markInviteWebsiteFlow(): void {
  try {
    window.sessionStorage.setItem(INVITE_WEBSITE_FLOW_SESSION_KEY, '1');
  } catch {
    // ignore storage errors
  }
}

export function hasInviteWebsiteFlow(): boolean {
  try {
    return window.sessionStorage.getItem(INVITE_WEBSITE_FLOW_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearInviteWebsiteFlow(): void {
  try {
    window.sessionStorage.removeItem(INVITE_WEBSITE_FLOW_SESSION_KEY);
  } catch {
    // ignore storage errors
  }
}

export function markInviteTelegramFlow(): void {
  try {
    window.sessionStorage.setItem(INVITE_TELEGRAM_FLOW_SESSION_KEY, String(Date.now()));
  } catch {
    // ignore storage errors
  }
}

export function hasInviteTelegramFlow(): boolean {
  try {
    const raw = window.sessionStorage.getItem(INVITE_TELEGRAM_FLOW_SESSION_KEY);
    if (!raw) {
      return false;
    }

    const savedAt = Number(raw);
    if (!Number.isFinite(savedAt)) {
      window.sessionStorage.removeItem(INVITE_TELEGRAM_FLOW_SESSION_KEY);
      return false;
    }

    const isActive = Date.now() - savedAt < INVITE_TELEGRAM_FLOW_TTL_MS;
    if (!isActive) {
      window.sessionStorage.removeItem(INVITE_TELEGRAM_FLOW_SESSION_KEY);
    }

    return isActive;
  } catch {
    return false;
  }
}

export function clearInviteTelegramFlow(): void {
  try {
    window.sessionStorage.removeItem(INVITE_TELEGRAM_FLOW_SESSION_KEY);
  } catch {
    // ignore storage errors
  }
}

export function parseAndSaveInviteStart(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  const start = urlParams.get('start');
  if (start) {
    setInviteStart(start);
    markInviteChoicePending();
    replaceUrlWithoutSearchParam('start');
    return start;
  }
  return null;
}

export function parseAndSavePartnerId(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const partnerId = urlParams.get('partner_id');
  if (partnerId) {
    setPartnerCookie(partnerId);
    replaceUrlWithoutSearchParam('partner_id');
  }
}

export function parseAndSaveSessionId(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  if (sessionId) {
    setCookie(sessionId);
    replaceUrlWithoutSearchParam('session_id');
  }
}

const RESET_TOKEN_COOKIE_NAME = 'reset_token';
const RESET_TOKEN_COOKIE_MINUTES = 60;

export function setResetTokenCookie(value: string): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + RESET_TOKEN_COOKIE_MINUTES * 60 * 1000);
  document.cookie = `${RESET_TOKEN_COOKIE_NAME}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getResetTokenCookie(): string | null {
  const name = RESET_TOKEN_COOKIE_NAME + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

export function removeResetTokenCookie(): void {
  document.cookie = `${RESET_TOKEN_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
}

export function parseAndSaveResetToken(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token) {
    setResetTokenCookie(token);
    urlParams.delete('token');
    const newSearch = urlParams.toString();
    const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
    window.history.replaceState({}, '', newUrl);
    return token;
  }
  return null;
}
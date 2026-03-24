import { config } from '../config';

export function buildRedirectLink(targetUrl: string): string {
    if (!config.PROXY_REDIRECT_URL) {
        return targetUrl;
    }

    const base = config.PROXY_REDIRECT_URL.replace(/\/+$/, '');
    const params = new URLSearchParams({
        redirect_to: targetUrl,
    });

    return `${base}/?${params.toString()}`;
}
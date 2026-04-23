import axios from 'axios';
import { createHmac } from 'crypto';

const SHM_INTERNAL_URL = (process.env.SHM_INTERNAL_URL ?? '').replace(/\/$/, '');
const WEBHOOK_SECRET = process.env.SHM_WEBHOOK_SECRET ?? '';
const WEBHOOK_PATH = '/shm/v1/public/webhook_support';

type WebhookPayload = Record<string, string | number | null | undefined>;

export async function notifyWebhook(payload: WebhookPayload): Promise<void> {
  if (!SHM_INTERNAL_URL || !WEBHOOK_SECRET) return;

  const body = new URLSearchParams(
    Object.entries(payload)
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  const signature = createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');

  await axios.post(`${SHM_INTERNAL_URL}${WEBHOOK_PATH}?_sig=${signature}`, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 5000,
  }).catch((err) => {
    console.error('[webhook] error:', err?.message, err?.response?.status, err?.response?.data);
  });
}

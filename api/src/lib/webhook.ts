import axios from 'axios';
import { createHmac } from 'crypto';

const WEBHOOK_URL = process.env.SHM_WEBHOOK_URL ?? '';
const WEBHOOK_SECRET = process.env.SHM_WEBHOOK_SECRET ?? '';

type WebhookPayload = Record<string, string | number | null | undefined>;

export async function notifyWebhook(payload: WebhookPayload): Promise<void> {
  if (!WEBHOOK_URL || !WEBHOOK_SECRET) return;

  const body = new URLSearchParams(
    Object.entries(payload)
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  const signature = createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');

  await axios.post(WEBHOOK_URL, body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Support-Signature': signature,
    },
    timeout: 5000,
  }).catch(() => {});
}

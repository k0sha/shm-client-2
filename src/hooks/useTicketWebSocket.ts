import { useEffect, useRef, useCallback } from 'react';
import type { TicketMessage } from '../data/mockTickets';

function transformMessage(m: Record<string, unknown>): TicketMessage {
  const attachments = (m.attachments as Record<string, unknown>[] | undefined)?.map((a) => ({
    id: a.id as string,
    name: a.filename as string,
    size: a.size as number,
    mimeType: a.mimeType as string,
    url: (a.url as string) ?? '',
  })) ?? [];

  return {
    id: m.id as string,
    authorId: m.authorId as number,
    authorName: m.authorName as string,
    isSpecialist: m.isSpecialist as boolean,
    isOwn: m.isOwn as boolean | undefined,
    text: (m.text as string) ?? '',
    createdAt: m.createdAt as string,
    attachments,
  };
}

function buildWsUrl(ticketId: string): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/shm_support/v1/tickets/${ticketId}/ws`;
}

export function useTicketWebSocket(
  ticketId: string | undefined,
  onMessage: (msg: TicketMessage) => void,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const destroyedRef = useRef(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!ticketId || destroyedRef.current) return;

    const ws = new WebSocket(buildWsUrl(ticketId));
    wsRef.current = ws;

    ws.onopen = () => { attemptsRef.current = 0; };

    ws.onmessage = (event) => {
      try {
        const envelope = JSON.parse(event.data as string) as { type: string; data: Record<string, unknown> };
        if (envelope.type === 'message') {
          onMessageRef.current(transformMessage(envelope.data));
        }
      } catch { /* ignore malformed */ }
    };

    ws.onclose = (e) => {
      if (destroyedRef.current) return;
      if (e.code === 4004) return;
      const delay = (e.code === 4001 || e.code === 4003)
        ? 60_000
        : Math.min(1000 * 2 ** attemptsRef.current, 30_000);
      attemptsRef.current += 1;
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {};
  }, [ticketId]);

  useEffect(() => {
    destroyedRef.current = false;
    attemptsRef.current = 0;
    connect();

    return () => {
      destroyedRef.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);
}

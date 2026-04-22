import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';

function buildWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/shm_support/v1/ws`;
}

export function useGlobalWebSocket(enabled: boolean) {
  const { incrementSupportUnread, incrementTicketsUnread } = useStore();

  const incrementSupportRef = useRef(incrementSupportUnread);
  incrementSupportRef.current = incrementSupportUnread;

  const incrementTicketsRef = useRef(incrementTicketsUnread);
  incrementTicketsRef.current = incrementTicketsUnread;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const destroyedRef = useRef(false);

  const connect = useCallback(() => {
    if (!enabled || destroyedRef.current) return;

    const ws = new WebSocket(buildWsUrl());
    wsRef.current = ws;

    ws.onopen = () => { attemptsRef.current = 0; };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string;
          ticketId: string;
          isSpecialist: boolean;
          target?: 'user' | 'specialist';
        };

        if (msg.type !== 'new_message') return;

        const currentPath = window.location.pathname;
        const isViewingTicket = currentPath.includes(msg.ticketId);

        if (!isViewingTicket) {
          if (msg.target === 'specialist') {
            incrementTicketsRef.current();
          } else {
            incrementSupportRef.current();
          }
        }

        window.dispatchEvent(
          new CustomEvent('ticket:new_message', { detail: { ticketId: msg.ticketId, isSpecialist: msg.isSpecialist } })
        );
      } catch { /* ignore */ }
    };

    ws.onclose = (e) => {
      if (destroyedRef.current) return;
      const delay = (e.code === 4001 || e.code === 4003)
        ? 60_000
        : Math.min(1000 * 2 ** attemptsRef.current, 30_000);
      attemptsRef.current += 1;
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {};
  }, [enabled]);

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

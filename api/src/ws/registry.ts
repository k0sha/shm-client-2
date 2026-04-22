interface WsSocket {
  readyState: number;
  send(data: string): void;
}

const WS_OPEN = 1;

const rooms = new Map<string, Set<WsSocket>>();

export function register(ticketId: string, ws: WsSocket): void {
  let room = rooms.get(ticketId);
  if (!room) { room = new Set(); rooms.set(ticketId, room); }
  room.add(ws);
}

export function unregister(ticketId: string, ws: WsSocket): void {
  const room = rooms.get(ticketId);
  if (!room) return;
  room.delete(ws);
  if (room.size === 0) rooms.delete(ticketId);
}

export function broadcast(ticketId: string, payload: unknown): void {
  const room = rooms.get(ticketId);
  if (!room) return;
  const data = JSON.stringify(payload);
  for (const ws of room) {
    if (ws.readyState === WS_OPEN) ws.send(data);
  }
}

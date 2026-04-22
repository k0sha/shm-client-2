interface WsSocket {
  readyState: number;
  send(data: string): void;
}

const WS_OPEN = 1;

// Regular users: userId → sockets
const userSockets = new Map<number, Set<WsSocket>>();
// Specialists: all connected specialist sockets
const specialistSockets = new Set<WsSocket>();

export function registerUser(userId: number, ws: WsSocket): void {
  let s = userSockets.get(userId);
  if (!s) { s = new Set(); userSockets.set(userId, s); }
  s.add(ws);
}

export function unregisterUser(userId: number, ws: WsSocket): void {
  const s = userSockets.get(userId);
  if (!s) return;
  s.delete(ws);
  if (s.size === 0) userSockets.delete(userId);
}

export function registerSpecialist(ws: WsSocket): void {
  specialistSockets.add(ws);
}

export function unregisterSpecialist(ws: WsSocket): void {
  specialistSockets.delete(ws);
}

export function notifyUser(userId: number, payload: unknown): void {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  const data = JSON.stringify(payload);
  for (const ws of sockets) {
    if (ws.readyState === WS_OPEN) ws.send(data);
  }
}

export function notifySpecialists(payload: unknown): void {
  const data = JSON.stringify(payload);
  for (const ws of specialistSockets) {
    if (ws.readyState === WS_OPEN) ws.send(data);
  }
}

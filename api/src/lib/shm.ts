import axios from 'axios';

const SHM_INTERNAL_URL = process.env.SHM_INTERNAL_URL ?? 'http://host.docker.internal:8082';
const ADMIN_LOGIN = process.env.SHM_ADMIN_LOGIN ?? '';
const ADMIN_PASSWORD = process.env.SHM_ADMIN_PASSWORD ?? '';

const adminHeaders = () => ({
  login: ADMIN_LOGIN,
  password: ADMIN_PASSWORD,
});

export interface ShmUserInfo {
  user_id: number;
  login: string;
  login2?: string;
  full_name?: string;
  balance: number;
  bonus?: number;
  credit: number;
  discount: number;
}

export interface ShmUserService {
  user_service_id: number;
  name: string;
  status: string;
  expire: string | null;
}

function extractList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>).data)) {
    return (raw as { data: T[] }).data;
  }
  return [];
}

export async function fetchShmUser(userId: number): Promise<ShmUserInfo | null> {
  try {
    const res = await axios.get(`${SHM_INTERNAL_URL}/shm/v1/admin/user`, {
      headers: adminHeaders(),
      params: { user_id: userId },
      timeout: 10_000,
    });
    return extractList<ShmUserInfo>(res.data)[0] ?? null;
  } catch {
    return null;
  }
}

export async function fetchShmUserServices(userId: number): Promise<ShmUserService[]> {
  try {
    const res = await axios.get(`${SHM_INTERNAL_URL}/shm/v1/admin/user/service`, {
      headers: adminHeaders(),
      params: { user_id: userId },
      timeout: 10_000,
    });
    return extractList<ShmUserService>(res.data);
  } catch {
    return [];
  }
}

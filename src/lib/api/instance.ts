import type { FieldError } from '@/server/http'

// error จากหลังบ้านมาเป็น { code, message: UPPER_SNAKE, payload } หน้าจอแปลข้อความเองจาก message
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public payload?: FieldError[],
  ) {
    super(code)
  }
}

const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, json?.message ?? 'NETWORK_ERROR', json?.payload)
  return json.data as T
}

const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown = {}) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}

export default api

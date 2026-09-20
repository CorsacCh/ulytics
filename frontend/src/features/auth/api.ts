import type { AuthUser } from './types'

const API_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4004').replace(/\/$/, '')

export const UNAUTHORIZED_EVENT = 'ulytics:unauthorized'

type ApiErrorBody = {
  error?: {
    code?: string
    message?: string
    details?: unknown
  }
}

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, body: ApiErrorBody) {
    super(body.error?.message || 'No fue posible completar la solicitud.')
    this.name = 'ApiError'
    this.status = status
    this.code = body.error?.code || 'REQUEST_ERROR'
    this.details = body.error?.details
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })

  const body = response.status === 204
    ? null
    : await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    throw new ApiError(response.status, body || {})
  }

  return body as T
}

export async function loginRequest(email: string, password: string) {
  return apiRequest<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function getSessionRequest() {
  return apiRequest<{ user: AuthUser }>('/api/auth/me')
}

export async function logoutRequest() {
  return apiRequest<void>('/api/auth/logout', { method: 'POST' })
}

export async function changePasswordRequest(currentPassword: string, newPassword: string) {
  return apiRequest<{ message: string }>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

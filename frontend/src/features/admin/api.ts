import { apiRequest } from '../auth/api'
import type {
  AcademicScope,
  AdminRole,
  AdminUser,
  AmbitosCatalog,
  CreateUserPayload,
} from './types'

export async function listAdminUsers() {
  return apiRequest<{ users: AdminUser[] }>('/api/admin/users')
}

export async function listAdminRoles() {
  return apiRequest<{ roles: AdminRole[] }>('/api/admin/roles')
}

export async function listAcademicScopes() {
  return apiRequest<{ scopes: AcademicScope[] }>('/api/admin/scopes')
}

export async function listAmbitosCatalog() {
  return apiRequest<AmbitosCatalog>('/api/ambitos')
}

export async function createAdminUser(payload: CreateUserPayload) {
  return apiRequest<{ user: AdminUser }>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateAdminUserStatus(userId: number, activo: boolean) {
  return apiRequest<{ user: AdminUser }>(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ activo }),
  })
}

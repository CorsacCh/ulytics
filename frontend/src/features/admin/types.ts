import type { AuthUser, RoleCode } from '../auth/types'

export type AdminUser = AuthUser

export type AdminRole = {
  id_rol: number
  codigo: RoleCode
  nombre: string
}

export type AcademicScopeType = 'INSTITUCION' | 'FACULTAD' | 'PROGRAMA'

export type AcademicScope = {
  id_ambito: number
  tipo: AcademicScopeType
  codigo: string
  nombre: string
  ambito_padre_id: number | null
}

export type CreateUserPayload = {
  nombre: string
  email: string
  temporaryPassword: string
  rolId: number
  ambitoId: number
}

export const requiredScopeByRole: Record<RoleCode, AcademicScopeType> = {
  ADMIN: 'INSTITUCION',
  AUTORIDAD_CENTRAL: 'INSTITUCION',
  DIRECTOR: 'PROGRAMA',
  DECANO: 'FACULTAD',
}

export const scopeTypeLabels: Record<AcademicScopeType, string> = {
  INSTITUCION: 'institucional',
  FACULTAD: 'de facultad',
  PROGRAMA: 'de programa o carrera',
}

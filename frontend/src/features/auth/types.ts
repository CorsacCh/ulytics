export type RoleCode = 'ADMIN' | 'DIRECTOR' | 'DECANO' | 'AUTORIDAD_CENTRAL'

export type AuthUser = {
  id: number
  nombre: string
  email: string
  activo: boolean
  debeCambiarPassword: boolean
  ultimoAcceso: string | null
  rol: {
    id: number
    codigo: RoleCode
    nombre: string
  }
  ambito: {
    id: number
    tipo: 'INSTITUCION' | 'FACULTAD' | 'PROGRAMA'
    codigo: string
    nombre: string
  }
  permisos: string[]
}

const rolePaths: Record<RoleCode, string> = {
  ADMIN: '/admin',
  DIRECTOR: '/director',
  DECANO: '/decanatura',
  AUTORIDAD_CENTRAL: '/autoridad',
}

export function roleHomePath(role: RoleCode) {
  return rolePaths[role]
}

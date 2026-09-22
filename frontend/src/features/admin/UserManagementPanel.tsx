import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
} from 'react'
import { ApiError } from '../auth/api'
import { useAuth } from '../auth/AuthContext'
import {
  createAdminUser,
  listAcademicScopes,
  listAdminRoles,
  listAdminUsers,
  listAmbitosCatalog,
  updateAdminUserStatus,
} from './api'
import {
  requiredScopeByRole,
  scopeTypeLabels,
  type AcademicScope,
  type AdminRole,
  type AdminUser,
  type AmbitosCatalog,
  type CreateUserPayload,
} from './types'

type FormState = {
  nombre: string
  email: string
  temporaryPassword: string
  rolId: string
  ambitoId: string
}

const emptyForm: FormState = {
  nombre: '',
  email: '',
  temporaryPassword: '',
  rolId: '',
  ambitoId: '',
}

function requestErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return 'No fue posible comunicarse con el servidor.'

  const details = error.details as {
    fields?: Array<{ message?: string }>
  } | undefined
  const fieldMessages = details?.fields
    ?.map((field) => field.message)
    .filter((message): message is string => Boolean(message))

  return fieldMessages?.length
    ? `${error.message} ${fieldMessages.join(' ')}`
    : error.message
}

export function UserManagementPanel() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [scopes, setScopes] = useState<AcademicScope[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null)
  const canCreateUsers = currentUser?.permisos.includes('USUARIOS_CREAR') ?? false
  const canChangeUserStatus = currentUser?.permisos.includes('USUARIOS_CAMBIAR_ESTADO') ?? false

  async function loadData() {
    setLoading(true)
    setError('')
    setUsers([])
    setRoles([])
    setScopes([])

    try {
      const [usersResponse, rolesResponse, scopesResponse] = await Promise.all([
        listAdminUsers(),
        listAdminRoles(),
        listAcademicScopes(),
      ])
      setUsers(usersResponse.users)
      setRoles(rolesResponse.roles)
      setScopes(scopesResponse.scopes)
    } catch (requestError) {
      setError(requestErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function showSuccess(message: string) {
    setError('')
    setSuccess(message)
    window.setTimeout(() => setSuccess(''), 3500)
  }

  async function handleStatusChange(user: AdminUser) {
    if (!canChangeUserStatus || updatingUserId !== null) return

    const action = user.activo ? 'deshabilitar' : 'habilitar'
    if (user.activo && !window.confirm(`¿Deseas deshabilitar a ${user.nombre}?`)) return

    setUpdatingUserId(user.id)
    setError('')
    try {
      const { user: updatedUser } = await updateAdminUserStatus(user.id, !user.activo)
      setUsers((current) => current.map((item) => (
        item.id === updatedUser.id ? updatedUser : item
      )))
      showSuccess(`Usuario ${action === 'habilitar' ? 'habilitado' : 'deshabilitado'} correctamente.`)
    } catch (requestError) {
      setError(requestErrorMessage(requestError))
    } finally {
      setUpdatingUserId(null)
    }
  }

  function handleCreated(user: AdminUser) {
    setUsers((current) => [...current, user].sort((left, right) => (
      left.nombre.localeCompare(right.nombre, 'es')
    )))
    setDialogOpen(false)
    showSuccess('Usuario creado correctamente. Deberá cambiar su contraseña en el primer ingreso.')
  }

  return (
    <section className="rounded-xl border border-[#b2b2b2] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#878787]">Acceso y roles</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-[#1d1d1b]">Usuarios y permisos</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-[#B8C5D6] px-3 py-2 text-sm font-semibold text-[#003366] hover:bg-[#F5F7FA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          {canCreateUsers && (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              disabled={loading || roles.length === 0}
              className="flex items-center gap-2 rounded-lg bg-[#ffc82e] px-3 py-2 text-sm font-semibold text-[#1d1d1b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="size-4" />
              Nuevo usuario
            </button>
          )}
        </div>
      </div>

      <p className="mb-5 text-sm text-[#556B7B]">
        Administra quién puede acceder a la plataforma y qué información puede consultar.
      </p>

      {error && (
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Cerrar error"><X className="size-4" /></button>
        </div>
      )}

      {success && (
        <div role="status" className="mb-5 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span className="flex-1">{success}</span>
          <button type="button" onClick={() => setSuccess('')} aria-label="Cerrar mensaje"><X className="size-4" /></button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#D9E5F0] text-xs uppercase tracking-wider text-[#556B7B]">
              <th className="pb-3">Usuario</th>
              <th className="pb-3">Rol</th>
              <th className="pb-3">Ámbito</th>
              <th className="pb-3">Estado</th>
              <th className="pb-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="py-10 text-center text-[#556B7B]">Cargando usuarios…</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={5} className="py-10 text-center text-[#556B7B]">No hay usuarios registrados.</td></tr>
            )}
            {!loading && users.map((user) => (
              <tr key={user.id} className="border-b border-[#D9E5F0]/80">
                <td className="py-4 pr-4">
                  <p className="font-semibold text-[#001A4D]">{user.nombre}</p>
                  <p className="text-xs text-[#556B7B]">{user.email}</p>
                </td>
                <td className="py-4 pr-4">{user.rol.nombre}</td>
                <td className="py-4 pr-4 text-[#556B7B]">{user.ambito.nombre}</td>
                <td className="py-4 pr-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    user.activo
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.activo ? 'Activo' : 'Deshabilitado'}
                  </span>
                </td>
                <td className="py-4 text-right">
                  {canChangeUserStatus ? (
                    <button
                      type="button"
                      onClick={() => void handleStatusChange(user)}
                      disabled={updatingUserId !== null}
                      className="font-semibold text-[#003366] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updatingUserId === user.id
                        ? 'Guardando…'
                        : user.activo ? 'Deshabilitar' : 'Habilitar'}
                    </button>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialogOpen && canCreateUsers && (
        <CreateUserDialog
          roles={roles}
          scopes={scopes}
          onClose={() => setDialogOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </section>
  )
}

function CreateUserDialog({
  roles,
  scopes,
  onClose,
  onCreated,
}: {
  roles: AdminRole[]
  scopes: AcademicScope[]
  onClose: () => void
  onCreated: (user: AdminUser) => void
}) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [catalogo, setCatalogo] = useState<AmbitosCatalog>({ carreras: [], facultades: [] })
  const [catalogoCargando, setCatalogoCargando] = useState(true)
  const [catalogoError, setCatalogoError] = useState('')

  // Al abrir el modal se cargan las carreras y facultades reales de la base de datos.
  useEffect(() => {
    let activo = true
    setCatalogoCargando(true)
    setCatalogoError('')

    listAmbitosCatalog()
      .then((response) => { if (activo) setCatalogo(response) })
      .catch(() => { if (activo) setCatalogoError('No fue posible cargar el catálogo de carreras y facultades.') })
      .finally(() => { if (activo) setCatalogoCargando(false) })

    return () => { activo = false }
  }, [])

  const selectedRole = roles.find((role) => role.id_rol === Number(form.rolId))
  const expectedScopeType = selectedRole ? requiredScopeByRole[selectedRole.codigo] : null
  const compatibleScopes = useMemo(() => {
    if (!selectedRole) return []
    return scopes.filter((scope) => scope.tipo === expectedScopeType)
  }, [scopes, selectedRole, expectedScopeType])

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'rolId' ? { ambitoId: '' } : {}),
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const email = form.email.trim().toLowerCase()
    if (!/^[^@\s]+@uach\.cl$/i.test(email)) {
      setError('El correo debe pertenecer exactamente al dominio @uach.cl.')
      return
    }

    const passwordErrors = passwordPolicyErrors(form.temporaryPassword)
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(' '))
      return
    }

    if (!selectedRole || !form.ambitoId) {
      setError('Debes seleccionar un rol y un ámbito compatible.')
      return
    }

    const payload: CreateUserPayload = {
      nombre: form.nombre.trim(),
      email,
      temporaryPassword: form.temporaryPassword,
      rolId: selectedRole.id_rol,
    }

    // El backend resuelve (o crea) el ámbito académico a partir de la carrera o facultad.
    if (expectedScopeType === 'PROGRAMA') payload.car_codigo = form.ambitoId
    else if (expectedScopeType === 'FACULTAD') payload.id_macrounidad = form.ambitoId
    else payload.ambitoId = Number(form.ambitoId)

    setSubmitting(true)
    try {
      const { user } = await createAdminUser(payload)
      onCreated(user)
    } catch (requestError) {
      setError(requestErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  // DIRECTOR elige una carrera y DECANO una facultad (valores del catálogo real);
  // los demás roles eligen directamente un ámbito académico existente.
  const scopeOptions = expectedScopeType === 'PROGRAMA'
    ? catalogo.carreras.map((carrera) => ({ value: carrera.car_codigo, label: carrera.nombre }))
    : expectedScopeType === 'FACULTAD'
      ? catalogo.facultades.map((facultad) => ({ value: facultad.id_macrounidad, label: facultad.nombre }))
      : compatibleScopes.map((scope) => ({ value: String(scope.id_ambito), label: scope.nombre }))
  const noCompatibleScopes = Boolean(
    selectedRole && !catalogoCargando && scopeOptions.length === 0,
  )

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#001A4D]/45 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="new-user-title" className="my-auto w-full max-w-lg rounded-xl border border-[#D9E5F0] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#2D7C5E]">Acceso a ULYTICS</p>
            <h2 id="new-user-title" className="mt-1 text-xl font-bold text-[#003366]">Nuevo usuario</h2>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} aria-label="Cerrar" className="rounded-md p-1 text-[#556B7B] hover:bg-[#F5F7FA]">
            <X className="size-5" />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <TextField label="Nombre completo" value={form.nombre} onChange={(value) => updateField('nombre', value)} autoComplete="name" minLength={2} maxLength={120} />
          <TextField label="Correo institucional" value={form.email} onChange={(value) => updateField('email', value)} type="email" autoComplete="email" placeholder="nombre@uach.cl" maxLength={180} />

          <label className="block text-sm font-semibold text-[#001A4D]">
            Contraseña temporal
            <span className="mt-2 flex items-center rounded-lg border border-[#C8D5E2] bg-white px-3 focus-within:border-[#003366] focus-within:ring-2 focus-within:ring-[#003366]/10">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.temporaryPassword}
                onChange={(event) => updateField('temporaryPassword', event.target.value)}
                autoComplete="new-password"
                required
                maxLength={128}
                className="w-full bg-transparent py-2.5 font-normal outline-none"
              />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="p-1 text-[#556B7B]">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </span>
            <span className="mt-2 block text-xs font-normal leading-5 text-[#556B7B]">Mínimo 12 caracteres, con mayúscula, minúscula y número.</span>
          </label>

          <label className="block text-sm font-semibold text-[#001A4D]">
            Rol
            <select
              value={form.rolId}
              onChange={(event) => updateField('rolId', event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-[#C8D5E2] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10"
            >
              <option value="">Selecciona un rol</option>
              {roles.map((role) => <option key={role.id_rol} value={role.id_rol}>{role.nombre}</option>)}
            </select>
          </label>

          <label className="block text-sm font-semibold text-[#001A4D]">
            Ámbito académico
            <select
              value={form.ambitoId}
              onChange={(event) => updateField('ambitoId', event.target.value)}
              required
              disabled={!selectedRole || noCompatibleScopes || catalogoCargando}
              className="mt-2 w-full rounded-lg border border-[#C8D5E2] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10 disabled:cursor-not-allowed disabled:bg-[#F5F7FA]"
            >
              <option value="">
                {!selectedRole
                  ? 'Primero selecciona un rol'
                  : catalogoCargando
                    ? 'Cargando carreras y facultades…'
                    : 'Selecciona un ámbito'}
              </option>
              {scopeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          {catalogoError && (
            <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
              {catalogoError}
            </div>
          )}

          {noCompatibleScopes && expectedScopeType && (
            <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
              {expectedScopeType === 'INSTITUCION'
                ? `No existen ámbitos ${scopeTypeLabels[expectedScopeType]} cargados. Deben registrarse antes de crear un usuario con este rol.`
                : `No hay ${expectedScopeType === 'PROGRAMA' ? 'carreras' : 'facultades'} cargadas. Primero carga el archivo Excel de reportería.`}
            </div>
          )}

          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={submitting} className="rounded-lg border border-[#B8C5D6] px-4 py-2.5 text-sm font-semibold text-[#003366] disabled:opacity-60">Cancelar</button>
            <button type="submit" disabled={submitting || noCompatibleScopes || catalogoCargando} className="rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#001A4D] disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Creando usuario…' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  ...inputProps
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email'
} & Pick<InputHTMLAttributes<HTMLInputElement>, 'autoComplete' | 'minLength' | 'maxLength' | 'placeholder'>) {
  return (
    <label className="block text-sm font-semibold text-[#001A4D]">
      {label}
      <input
        {...inputProps}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="mt-2 w-full rounded-lg border border-[#C8D5E2] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10"
      />
    </label>
  )
}

function passwordPolicyErrors(password: string) {
  const errors: string[] = []
  if (password.length < 12) errors.push('La contraseña debe contener al menos 12 caracteres.')
  if (!/[a-záéíóúñ]/u.test(password)) errors.push('Debe incluir una minúscula.')
  if (!/[A-ZÁÉÍÓÚÑ]/u.test(password)) errors.push('Debe incluir una mayúscula.')
  if (!/\d/.test(password)) errors.push('Debe incluir un número.')
  return errors
}

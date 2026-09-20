import { useState, type FormEvent } from 'react'
import { Building2, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { ApiError } from './api'
import { roleHomePath } from './types'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const user = await login(email, password)
      navigate(
        user.debeCambiarPassword ? '/cambiar-contrasena' : roleHomePath(user.rol.codigo),
        { replace: true },
      )
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'No fue posible comunicarse con el servidor.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-[#F5F7FA] lg:grid-cols-[minmax(360px,0.8fr)_1.2fr]">
      <section className="relative hidden overflow-hidden bg-[#003366] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-36 -top-36 size-[420px] rounded-full border-[80px] border-white/5" />
        <div className="relative flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#D4AF37] text-[#003366]">
            <Building2 className="size-6" />
          </div>
          <div>
            <p className="text-xl font-bold">ULYTICS</p>
            <p className="text-xs text-[#B8C5D6]">Universidad Austral de Chile</p>
          </div>
        </div>
        <div className="relative max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#D4AF37]">Reportería académica</p>
          <h1 className="mt-5 text-4xl font-bold leading-tight xl:text-5xl">
            Información para apoyar decisiones académicas.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[#D9E5F0]">
            Consulta indicadores de progresión académica y curricular según tu rol y ámbito autorizado.
          </p>
        </div>
        <p className="relative text-xs text-[#9FB2C7]">Acceso exclusivo para personal autorizado</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#D4AF37] text-[#003366]">
              <Building2 className="size-5" />
            </div>
            <div><p className="font-bold text-[#003366]">ULYTICS</p><p className="text-xs text-[#556B7B]">Universidad Austral de Chile</p></div>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2D7C5E]">Bienvenido</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#003366]">Iniciar sesión</h2>
          <p className="mt-3 text-sm leading-6 text-[#556B7B]">Utiliza tu correo institucional y la contraseña asignada.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-[#001A4D]">
              Correo institucional
              <span className="mt-2 flex items-center gap-3 rounded-lg border border-[#C8D5E2] bg-white px-3 focus-within:border-[#003366] focus-within:ring-2 focus-within:ring-[#003366]/10">
                <Mail className="size-4 shrink-0 text-[#70879B]" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nombre@uach.cl"
                  autoComplete="username"
                  required
                  className="w-full bg-transparent py-3 font-normal outline-none placeholder:text-[#9BA8B8]"
                />
              </span>
              <span className="mt-2 block text-xs font-normal text-[#70879B]">Solo se permiten cuentas @uach.cl</span>
            </label>

            <label className="block text-sm font-semibold text-[#001A4D]">
              Contraseña
              <span className="mt-2 flex items-center gap-3 rounded-lg border border-[#C8D5E2] bg-white px-3 focus-within:border-[#003366] focus-within:ring-2 focus-within:ring-[#003366]/10">
                <LockKeyhole className="size-4 shrink-0 text-[#70879B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full bg-transparent py-3 font-normal outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="rounded-md p-1 text-[#70879B] hover:text-[#003366]"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>

            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#D4AF37] px-4 py-3 text-sm font-bold text-[#001A4D] shadow-sm transition-colors hover:bg-[#C9A42E] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-5 text-[#70879B]">
            Si tienes problemas de acceso, contacta al administrador de ULYTICS.
          </p>
        </div>
      </section>
    </main>
  )
}

import { useMemo, useState, type FormEvent } from 'react'
import { Building2, Check, KeyRound, LogOut, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { ApiError } from './api'
import { roleHomePath } from './types'

function passwordRules(password: string) {
  return [
    { label: 'Al menos 12 caracteres', valid: password.length >= 12 },
    { label: 'Una letra mayúscula', valid: /[A-ZÁÉÍÓÚÑ]/u.test(password) },
    { label: 'Una letra minúscula', valid: /[a-záéíóúñ]/u.test(password) },
    { label: 'Un número', valid: /\d/.test(password) },
  ]
}

export function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const rules = useMemo(() => passwordRules(newPassword), [newPassword])
  const valid = rules.every((rule) => rule.valid) && newPassword === confirmation

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!valid) {
      setError('La nueva contraseña no cumple todos los requisitos.')
      return
    }

    setSubmitting(true)
    try {
      const refreshedUser = await changePassword(currentPassword, newPassword)
      navigate(roleHomePath(refreshedUser.rol.codigo), { replace: true })
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
    <main className="min-h-screen bg-[#F5F7FA] px-5 py-8 sm:py-14">
      <div className="mx-auto max-w-xl">
        <header className="mb-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#D4AF37] text-[#003366]">
              <Building2 className="size-5" />
            </div>
            <div><p className="font-bold text-[#003366]">ULYTICS</p><p className="text-xs text-[#556B7B]">Primer ingreso</p></div>
          </div>
          <button type="button" onClick={() => void logout()} className="flex items-center gap-2 text-sm font-semibold text-[#556B7B] hover:text-[#003366]">
            <LogOut className="size-4" /> Salir
          </button>
        </header>

        <section className="rounded-2xl border border-[#D9E5F0] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#003366]/10 text-[#003366]">
            <ShieldCheck className="size-6" />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#2D7C5E]">Protección de la cuenta</p>
          <h1 className="mt-2 text-2xl font-bold text-[#003366] sm:text-3xl">Crea una contraseña personal</h1>
          <p className="mt-3 text-sm leading-6 text-[#556B7B]">
            Hola, {user?.nombre}. Por seguridad debes reemplazar la contraseña temporal antes de ingresar a la plataforma.
          </p>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <PasswordField label="Contraseña temporal" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
            <PasswordField label="Nueva contraseña" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
            <PasswordField label="Confirmar nueva contraseña" value={confirmation} onChange={setConfirmation} autoComplete="new-password" />

            <div className="grid gap-2 rounded-lg bg-[#F5F7FA] p-4 sm:grid-cols-2">
              {rules.map((rule) => (
                <p key={rule.label} className={`flex items-center gap-2 text-xs ${rule.valid ? 'font-semibold text-[#2D7C5E]' : 'text-[#70879B]'}`}>
                  <span className={`flex size-4 items-center justify-center rounded-full ${rule.valid ? 'bg-[#2D7C5E] text-white' : 'border border-[#B8C5D6]'}`}>
                    {rule.valid && <Check className="size-3" />}
                  </span>
                  {rule.label}
                </p>
              ))}
            </div>

            {confirmation && newPassword !== confirmation && <p className="text-xs font-semibold text-red-600">Las contraseñas no coinciden.</p>}
            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <button type="submit" disabled={submitting || !valid || !currentPassword} className="w-full rounded-lg bg-[#D4AF37] px-4 py-3 text-sm font-bold text-[#001A4D] transition-colors hover:bg-[#C9A42E] disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Guardando…' : 'Guardar contraseña e ingresar'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

function PasswordField({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (value: string) => void; autoComplete: string }) {
  return (
    <label className="block text-sm font-semibold text-[#001A4D]">
      {label}
      <span className="mt-2 flex items-center gap-3 rounded-lg border border-[#C8D5E2] px-3 focus-within:border-[#003366] focus-within:ring-2 focus-within:ring-[#003366]/10">
        <KeyRound className="size-4 text-[#70879B]" />
        <input type="password" value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} required maxLength={128} className="w-full bg-transparent py-3 font-normal outline-none" />
      </span>
    </label>
  )
}

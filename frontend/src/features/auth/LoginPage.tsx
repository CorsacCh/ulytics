import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';

import logoSACyP from '../../shared/assets/branding/logo_SACyP.jpg';
import logoUACh from '../../shared/assets/branding/logo_UACh.svg';
import logoULYTICS from '../../shared/assets/branding/logo_ULYTICS.jpeg';

// Lógica de seguridad del equipo
import { useAuth } from './AuthContext';
import { ApiError } from './api';
import { roleHomePath } from './types';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Estados combinados
  const [mostrarClave, setMostrarClave] = useState(false);
  const [mostrarError, setMostrarError] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMostrarError(false);
    setSubmitting(true);

    // Extraemos los datos de tu formulario
    const formData = new FormData(event.currentTarget);
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const password = formData.get('password') as string;

    try {
      const user = await login(email, password);
      // Redirección inteligente según el rol o si es su primer ingreso
      navigate(
        user.debeCambiarPassword ? '/cambiar-contrasena' : roleHomePath(user.rol.codigo),
        { replace: true }
      );
    } catch (error) {
      setMostrarError(true);
      setMensajeError(
        error instanceof ApiError
          ? error.message
          : 'No fue posible comunicarse con el servidor.'
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(400px,0.88fr)_1.12fr]">
      {/* Panel Izquierdo - Azul Marino */}
      <section className="relative hidden min-h-screen overflow-hidden bg-[#0F172A] px-10 py-10 text-white lg:flex lg:flex-col xl:px-16">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_48%,rgba(255,184,0,0.04)_48%,rgba(255,184,0,0.04)_49%,transparent_49%,transparent_100%)] bg-[length:28px_28px]" />
        
        <div className="relative flex items-center gap-3">
          <img src={logoULYTICS} alt="ULYTICS" className="h-12 w-auto rounded-lg object-contain shadow-lg shadow-black/20" />
        </div>

        <div className="relative mt-auto max-w-xl pb-10">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-[#FFB800]">
            Universidad Austral de Chile
          </p>
          <h1 className="max-w-lg text-4xl font-bold leading-[1.08] tracking-tight xl:text-6xl text-white">
            Información que impulsa el progreso académico.
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-slate-300">
            Una plataforma institucional para transformar datos en decisiones que acompañan las trayectorias de nuestras y nuestros estudiantes.
          </p>
          
          <div className="mt-10 flex items-center gap-3 text-sm text-slate-200">
            <span className="flex size-8 items-center justify-center rounded-full border border-[#FFB800]/30 bg-[#FFB800]/10 text-[#FFB800]">
              <ShieldCheck className="size-4" />
            </span>
            Acceso seguro y confidencial
          </div>
          
          <div className="mt-14 flex items-center gap-5">
            <img src={logoUACh} alt="Universidad Austral de Chile" className="h-12 w-auto max-w-[130px] object-contain brightness-0 invert opacity-80" />
            <img src={logoSACyP} alt="SACyP" className="h-10 w-auto max-w-[120px] rounded bg-white object-contain p-1" />
          </div>
        </div>
      </section>

      {/* Panel Derecho - Formulario */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[460px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src={logoULYTICS} alt="ULYTICS" className="h-12 w-auto rounded-lg object-contain" />
          </div>

          <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-9">
            <div className="mb-8">
              <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <UserRound className="size-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Consola institucional
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
                Bienvenido a ULYTICS
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Ingresa con tus credenciales institucionales para continuar.
              </p>
            </div>

            {mostrarError && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {mensajeError}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Correo Electrónico
                <span className="relative mt-2 block">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input 
                    id="email" 
                    name="email" 
                    type="email" 
                    required 
                    autoComplete="username" 
                    placeholder="usuario@uach.cl" 
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/20" 
                  />
                </span>
              </label>

              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Contraseña
                <span className="relative mt-2 block">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input 
                    id="password" 
                    name="password" 
                    type={mostrarClave ? 'text' : 'password'} 
                    required 
                    autoComplete="current-password" 
                    placeholder="••••••••" 
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/20" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setMostrarClave(!mostrarClave)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-[#FFB800] focus:outline-none focus:ring-2 focus:ring-[#FFB800]/30" 
                    aria-label={mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {mostrarClave ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#FFB800] text-sm font-bold text-slate-900 shadow-md shadow-[#FFB800]/20 transition-all hover:bg-[#F0AD00] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Ingresando...' : 'Iniciar Sesión'}
                {!submitting && <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />}
              </button>
            </form>

            <div className="mt-7 border-t border-slate-200 pt-5 text-center">
              <p className="text-xs leading-5 text-slate-500">
                Plataforma de uso exclusivo para autoridades académicas
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

import { ChevronLeft, LayoutDashboard, BarChart3, Settings, Users, FileText, LogOut, BookOpen, Clock, type LucideIcon } from 'lucide-react'
import ulyticsLogo from '../assets/branding/logo2_ULYTICS.jpeg'
import type { AuthUser } from '../../features/auth/types';

// Opciones de menu academico
export type Section = 
  | 'Home' 
  | 'Progresión analítica' 
  | 'Progresión curricular' 
  | 'Historial de descargas'
  | 'Dashboard' 
  | 'Períodos académicos' 
  | 'Cargas de datos' 
  | 'Usuarios y permisos' 
  | 'Reportes' 
  | 'Configuración'

type SidebarLink = {
  label: Section
  icon: LucideIcon
}

// Opciones para DIRECTOR/DECANO/AUTORIDAD
const academicLinks: SidebarLink[] = [
  { label: 'Home', icon: LayoutDashboard },
  { label: 'Progresión analítica', icon: BarChart3 },
  { label: 'Progresión curricular', icon: BookOpen },
  { label: 'Historial de descargas', icon: Clock },
]

// Opciones para ADMIN
const adminLinks: SidebarLink[] = [
  { label: 'Home', icon: LayoutDashboard },
  { label: 'Períodos académicos', icon: BarChart3 },
  { label: 'Cargas de datos', icon: FileText },
  { label: 'Usuarios y permisos', icon: Users },
  { label: 'Configuración', icon: Settings },
]

// Roles de perfiles
type SidebarProps = {
  section: Section
  open: boolean
  onToggle: () => void
  onNavigate: (section: Section) => void
  user: AuthUser
  onLogout: () => void
}

export function Sidebar({ section, open, onToggle, onNavigate, user, onLogout }: SidebarProps) {
  const links = user.rol.codigo === 'ADMIN' ? adminLinks : academicLinks;
  const title = 'ULYTICS';

  return (
    <aside 
      className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-[#004d99]/40 bg-[#0A192F] backdrop-blur-xl text-white shadow-xl transition-all duration-300 lg:sticky lg:top-0 ${
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Cabecera con Logo */}
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-[#004d99]/50 px-5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-[#00162e] p-1 shadow-inner">
            <img 
              src={ulyticsLogo} 
              alt="Logo ULYTICS" 
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <span className="text-xl font-black tracking-wider text-white drop-shadow-sm">{title}</span>
        </div>

        <button 
          type="button" 
          onClick={onToggle} 
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-[#D4AF37] lg:hidden" 
          aria-label={!open ? 'Expandir menú' : 'Contraer menú'}
        >
          <ChevronLeft className="size-5" />
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-6" aria-label="Navegación principal">
        {links.map(({ label, icon: Icon }) => {
          const isActive = section === label;
          return (
            <button
              key={label}
              onClick={() => { onNavigate(label); if (open) onToggle(); }}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[#FFB800] text-[#001a4d] shadow-md font-bold'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="size-[18px] shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="border-t border-[#004d99] px-4 py-4 flex-shrink-0">
        <div className="min-w-0 rounded-lg bg-[#002B57] p-3">
          <p className="truncate text-sm font-semibold text-white">{user.nombre}</p>
          <p className="mt-0.5 truncate text-xs text-[#B8C5D6]">{user.rol.nombre}</p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-semibold text-[#B8C5D6] transition-colors hover:bg-[#004d99] hover:text-white"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
      {/* Pie de la barra lateral */}
      <div className="shrink-0 border-t border-[#004d99]/50 bg-black/20 px-5 py-4 text-xs leading-relaxed text-slate-300">
        <p className="font-semibold text-white">Universidad Austral de Chile</p>
        <p className="text-[11px] text-slate-400">Sistema de Reportería Académica</p>
      </div>
    </aside>
  );
}
import { Building2, ChevronLeft, LayoutDashboard, BarChart3, Settings, Users, FileText, LogOut } from 'lucide-react'
import type { AuthUser } from '../../features/auth/types'

export type Section = 'Dashboard' | 'Períodos académicos' | 'Cargas de datos' | 'Usuarios y permisos' | 'Reportes' | 'Configuración'

type SidebarLink = {
  label: Section
  icon: typeof LayoutDashboard
}

const adminLinks: SidebarLink[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Períodos académicos', icon: BarChart3 },
  { label: 'Cargas de datos', icon: FileText },
  { label: 'Usuarios y permisos', icon: Users },
  { label: 'Configuración', icon: Settings },
]

const dashboardOnlyLinks: SidebarLink[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
]

type SidebarProps = {
  section: Section
  open: boolean
  onToggle: () => void
  onNavigate: (section: Section) => void
  user: AuthUser
  onLogout: () => void
}

export function Sidebar({ section, open, onToggle, onNavigate, user, onLogout }: SidebarProps) {
  const links = user.rol.codigo === 'ADMIN' ? adminLinks : dashboardOnlyLinks

  return (
    <aside className={`fixed left-0 top-0 flex h-screen flex-col bg-[#003366] text-white shadow-lg transition-[width] duration-300 z-50 lg:relative lg:shadow-none ${open ? 'w-72' : 'w-0 lg:w-72'} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 border-b border-[#004d99] px-5 py-6 flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37] text-[#003366]" aria-hidden="true">
            <Building2 className="size-5" />
          </div>
          <p className="min-w-max text-lg font-semibold leading-tight">ULYTICS</p>
        </div>
        <button type="button" onClick={onToggle} className="rounded-md p-2 text-[#B8C5D6] transition-colors hover:bg-[#004d99] hover:text-[#D4AF37] lg:hidden" aria-label={!open ? 'Expandir menú' : 'Contraer menú'}>
          <ChevronLeft className="size-5" />
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-2 px-3 py-6 overflow-y-auto" aria-label="Navegación administrativa">
        {links.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => { onNavigate(label); if (open) onToggle(); }}
            className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-colors whitespace-nowrap ${
              section === label
                ? 'bg-[#D4AF37] text-[#003366]'
                : 'text-[#B8C5D6] hover:bg-[#004d99] hover:text-[#D4AF37]'
            }`}
          >
            <Icon className="size-[18px] shrink-0" />
            <span>{label}</span>
          </button>
        ))}
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
    </aside>
  )
}

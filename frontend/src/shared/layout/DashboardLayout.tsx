import type { ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'
import { Sidebar, type Section } from "../components/Sidebar";

type DashboardLayoutProps = {
  section: Section
  open: boolean
  onToggle: () => void
  onNavigate: (section: Section) => void
  children: ReactNode
}

export function DashboardLayout({ section, open, onToggle, onNavigate, children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <main className="font-sans min-h-screen bg-[#F5F7FA] text-[#001a4d] flex">
      <Sidebar
        section={section}
        open={open}
        onToggle={onToggle}
        onNavigate={onNavigate}
        user={user}
        onLogout={() => void logout()}
      />
      <div className="flex-1 w-full lg:w-auto overflow-hidden flex flex-col">
        {!open && (
          <button
            type="button"
            onClick={onToggle}
            className="fixed left-4 top-4 z-40 rounded-lg bg-[#003366] p-2.5 text-white shadow-lg lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>
        )}
        <section className="flex-1 overflow-y-auto bg-[#F5F7FA]">{children}</section>
      </div>
    </main>
  )
}

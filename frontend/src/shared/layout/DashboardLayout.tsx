import type { ReactNode } from 'react'
import { Sidebar, type Section } from "../components/Sidebar";

type DashboardLayoutProps = {
  section: Section
  open: boolean
  onToggle: () => void
  onNavigate: (section: Section) => void
  children: ReactNode
}

export function DashboardLayout({ section, open, onToggle, onNavigate, children }: DashboardLayoutProps) {
  return (
    <main className="font-sans min-h-screen bg-[#F5F7FA] text-[#001a4d] flex">
      <Sidebar section={section} open={open} onToggle={onToggle} onNavigate={onNavigate} />
      <div className="flex-1 w-full lg:w-auto overflow-hidden flex flex-col">
        <section className="flex-1 overflow-y-auto bg-[#F5F7FA]">{children}</section>
      </div>
    </main>
  )
}
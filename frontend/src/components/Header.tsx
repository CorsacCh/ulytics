import { Bell, FileText } from 'lucide-react'
import RoleSwitcher from './RoleSwitcher'

export default function Header({ period, onPeriodChange, onGenerateReport }) {
  return (
    <header className="flex flex-col gap-4 border-b border-[#b2b2b2] bg-[#ffffff] px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#00693e]">Panel institucional</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1d1d1b]">Facultad de Ciencias de la Ingeniería</h1>
        <p className="mt-1 text-sm text-[#878787]">Visión global de Progresión y Retención</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <RoleSwitcher />
        <label className="flex items-center gap-2 rounded-lg border border-[#b2b2b2] bg-[#f7f7f7] px-3 py-2 text-sm"><span className="text-xs text-[#878787]">Periodo:</span><select value={period} onChange={(event) => onPeriodChange(event.target.value)} className="bg-transparent font-semibold text-[#1d1d1b] outline-none" aria-label="Seleccionar periodo"><option>2026</option><option>2025</option></select></label>
        <button type="button" onClick={onGenerateReport} className="inline-flex items-center gap-2 rounded-lg bg-[#ffc82e] px-3 py-2 text-sm font-bold text-[#1d1d1b] transition-colors hover:bg-[#eab525]"><FileText className="size-4" /> Generar Informe (PDF)</button>
        <button type="button" className="rounded-lg border border-[#b2b2b2] p-2 text-[#878787] hover:bg-[#f7f7f7]" aria-label="Notificaciones"><Bell className="size-4" /></button>
      </div>
    </header>
  )
}

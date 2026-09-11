import { ChevronDown } from 'lucide-react'

export default function RoleSwitcher() {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-[#b2b2b2] bg-[#f7f7f7] px-3 py-2 text-sm">
      <span className="text-xs text-[#878787]">Perfil</span>
      <select className="bg-transparent font-semibold text-[#1d1d1b] outline-none" defaultValue="Decano" aria-label="Seleccionar perfil">
        <option>Decano</option>
        <option>Autoridad Central</option>
        <option>Director de Carrera</option>
      </select>
      <ChevronDown className="size-3.5 text-[#878787]" />
    </label>
  )
}

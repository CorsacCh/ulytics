import type { LucideIcon } from 'lucide-react'

type KpiCardProps = {
  label: string
  value: string
  description: string
  positive: boolean
  icon: LucideIcon
  variant?: 'compact' | 'spacious'
}

export function KpiCard({ label, value, description, positive, icon: Icon, variant = 'compact' }: KpiCardProps) {
  const isSpacious = variant === 'spacious'

  return (
    <article className={`rounded-${isSpacious ? 'xl' : 'lg'} border border-[#E2E8F0] bg-[#ffffff] ${isSpacious ? 'p-5' : 'p-4'} shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`${isSpacious ? 'text-sm' : 'text-xs uppercase tracking-widest'} font-semibold text-[#878787]`}>{label}</p>
        <Icon className={`size-5 ${isSpacious && !positive ? 'text-[#EF4444]' : isSpacious ? 'text-[#00693e]' : 'text-[#FFB800]'}`} />
      </div>
      <p className={`${isSpacious ? 'mt-5 text-3xl' : 'mt-3 text-2xl'} font-bold ${isSpacious ? 'tracking-tight' : ''} text-[#1E293B]`}>{value}</p>
      <p className={`mt-${isSpacious ? '2 flex items-center gap-1' : '1'} text-xs font-semibold ${positive || !isSpacious ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
        {isSpacious && !positive && <span aria-hidden="true">↓</span>}
        {description}
      </p>
    </article>
  )
}

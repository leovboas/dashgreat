export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#f97316', '#14b8a6', '#6366f1', '#84cc16',
  '#ef4444', '#a855f7',
]

export function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y?.slice(2)}`
}

interface TooltipPayloadItem {
  dataKey: string
  value: number
  fill?: string
  stroke?: string
}

interface TooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

export function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const visible = payload.filter((p) => p.value > 0).sort((a, b) => b.value - a.value)
  if (!visible.length) return null

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-xl px-4 py-3 min-w-[160px] pointer-events-none">
      <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
        {label ? fmtDate(String(label)) : ''}
      </p>
      {visible.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs py-0.5">
          <span className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: p.fill ?? p.stroke }}
            />
            <span className="text-gray-600 truncate max-w-[150px]" title={p.dataKey}>
              {capitalize(p.dataKey)}
            </span>
          </span>
          <span className="font-bold text-gray-900 tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function SeriesToggle({
  keys,
  colors,
  active,
  onToggle,
}: {
  keys: string[]
  colors: string[]
  active: Set<string>
  onToggle: (key: string) => void
}) {
  if (keys.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-4">
      {keys.map((key, i) => {
        const on = active.has(key)
        const color = colors[i % colors.length]!
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            title={key}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all duration-150 font-medium max-w-[200px]"
            style={
              on
                ? { background: color + '22', borderColor: color, color }
                : { background: '#f9fafb', borderColor: '#e5e7eb', color: '#9ca3af' }
            }
          >
            <span
              className="w-2 h-2 rounded-full shrink-0 transition-colors"
              style={{ background: on ? color : '#d1d5db' }}
            />
            <span className="truncate">{capitalize(key)}</span>
          </button>
        )
      })}
    </div>
  )
}

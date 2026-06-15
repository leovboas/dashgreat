import { useState, useEffect, useRef } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface Props {
  label: string
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
  disabled?: boolean
  /** Maps option value → status string (e.g. 'ACTIVE' | 'PAUSED') to show colored dot */
  statusMap?: Record<string, string>
}

function StatusDot({ status }: { status?: string }) {
  if (!status) return null
  const isActive = status === 'ENABLED' || status === 'ACTIVE'
  return (
    <span
      className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
      title={isActive ? 'Ativa' : (status === 'PAUSED' || status === 'DISABLED') ? 'Pausada' : status}
    />
  )
}

export default function MultiSelect({ label, options, selected, onChange, disabled, statusMap }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const count = selected.length
  const isDisabled = disabled || options.length === 0

  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v])
  }

  return (
    <div ref={ref} className="relative">
      <button
        disabled={isDisabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-xs border rounded-lg px-2.5 py-1.5 whitespace-nowrap transition-colors
          ${count > 0 ? 'border-[#0D2F9F] bg-blue-50 text-[#0D2F9F]' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}
          disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <span className="font-medium">{label}</span>
        {count > 0 && (
          <span className="bg-[#0D2F9F] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            {count}
          </span>
        )}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''} ${count > 0 ? 'text-[#0D2F9F]' : 'text-gray-400'}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-44 max-h-64 flex flex-col">
          {count > 0 && (
            <button
              onClick={() => { onChange([]); setOpen(false) }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 px-3 py-2 border-b border-gray-100 shrink-0"
            >
              <X size={11} /> Limpar seleção
            </button>
          )}
          <div className="overflow-y-auto">
            {options.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="w-3.5 h-3.5 accent-[#0D2F9F] shrink-0"
                />
                {statusMap && <StatusDot status={statusMap[opt]} />}
                <span className="text-xs text-gray-700 truncate max-w-48">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

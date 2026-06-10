import { useMemo } from 'react'
import type { ParsedLead } from '../../utils/parseLeads'

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface Props {
  leads: ParsedLead[]
}

export default function LeadsHeatmapChart({ leads }: Props) {
  const { matrix, maxCount, hasData } = useMemo(() => {
    const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
    let hasData = false

    for (const lead of leads) {
      if (lead.date && lead.hour >= 0) {
        // Use noon to avoid DST / timezone boundary issues
        const dayOfWeek = new Date(lead.date + 'T12:00:00').getDay()
        matrix[dayOfWeek][lead.hour]++
        hasData = true
      }
    }

    const maxCount = Math.max(...matrix.flat())
    return { matrix, maxCount, hasData }
  }, [leads])

  if (!hasData) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Heatmap — Hora do Dia</h3>
        <p className="text-sm text-gray-400 text-center py-6">
          Nenhum lead com dado de horário no período selecionado.
        </p>
      </div>
    )
  }

  function cellBg(count: number): string {
    if (count === 0 || maxCount === 0) return '#f8fafc'
    const t = count / maxCount
    const alpha = 0.12 + t * 0.88
    return `rgba(59, 130, 246, ${alpha.toFixed(2)})`
  }

  function cellText(count: number): string {
    if (count === 0 || maxCount === 0) return 'transparent'
    return count / maxCount > 0.45 ? '#ffffff' : '#1e40af'
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Heatmap — Hora do Dia</h3>
      <div className="overflow-x-auto">
        <div style={{ minWidth: 580 }}>
          {/* Hour column headers */}
          <div className="flex mb-1" style={{ paddingLeft: 36 }}>
            {HOURS.map((h) => (
              <div
                key={h}
                className="flex-1 text-center text-gray-400 font-medium"
                style={{ fontSize: 10, minWidth: 0 }}
              >
                {h % 3 === 0 ? String(h).padStart(2, '0') : ''}
              </div>
            ))}
          </div>

          {/* Rows: one per day of week */}
          {DAYS_PT.map((day, dayIdx) => (
            <div key={day} className="flex items-center mb-0.5 gap-0.5">
              <div
                className="text-gray-500 font-medium shrink-0 text-right pr-2"
                style={{ width: 32, fontSize: 11 }}
              >
                {day}
              </div>
              {HOURS.map((h) => {
                const count = matrix[dayIdx]![h]!
                return (
                  <div
                    key={h}
                    className="flex-1 rounded-sm flex items-center justify-center font-medium transition-colors"
                    style={{
                      minWidth: 0,
                      height: 26,
                      background: cellBg(count),
                      color: cellText(count),
                      fontSize: 9,
                    }}
                    title={`${day} ${String(h).padStart(2, '0')}:00 — ${count} lead${count !== 1 ? 's' : ''}`}
                  >
                    {count > 0 ? count : ''}
                  </div>
                )
              })}
            </div>
          ))}

          {/* Hour totals row */}
          <div className="flex items-center mt-1 gap-0.5" style={{ paddingLeft: 36 }}>
            {HOURS.map((h) => {
              const total = matrix.reduce((sum, row) => sum + (row[h] ?? 0), 0)
              return (
                <div
                  key={h}
                  className="flex-1 text-center text-gray-400"
                  style={{ minWidth: 0, fontSize: 9 }}
                >
                  {total > 0 ? total : ''}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 justify-end">
            <span className="text-xs text-gray-400">Menos</span>
            {[0.12, 0.35, 0.55, 0.75, 1].map((t) => (
              <div
                key={t}
                className="w-5 h-4 rounded-sm"
                style={{ background: `rgba(59,130,246,${t})` }}
              />
            ))}
            <span className="text-xs text-gray-400">Mais</span>
          </div>
        </div>
      </div>
    </div>
  )
}

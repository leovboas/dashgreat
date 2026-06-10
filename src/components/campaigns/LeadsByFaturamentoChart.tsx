import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ParsedLead } from '../../utils/parseLeads'
import { buildDailySeriesByKey } from '../../utils/parseLeads'
import { PALETTE, fmtDate, CustomTooltip, SeriesToggle } from './ChartUtils'

interface Props {
  leads: ParsedLead[]
}

export default function LeadsByFaturamentoChart({ leads }: Props) {
  const hasFaturamento = leads.some((l) => l.faturamento)
  const rawSeries = useMemo(() => buildDailySeriesByKey(leads, 'faturamento'), [leads])
  const ranges: string[] = rawSeries.length > 0 ? (rawSeries[0]!.keys as string[]) : []

  const [active, setActive] = useState<Set<string>>(() => new Set(ranges))

  useMemo(() => {
    setActive(new Set(ranges))
  }, [ranges.join('|')])  // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(key: string) {
    setActive((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  if (!hasFaturamento) return null

  if (rawSeries.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          Leads por Dia — por Faturamento
        </h3>
        <p className="text-sm text-gray-400 text-center py-10">
          Nenhum lead com data de conversão no período selecionado.
        </p>
      </div>
    )
  }

  const visibleRanges = ranges.filter((r) => active.has(r))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Leads por Dia — por Faturamento
      </h3>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={rawSeries} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
          <defs>
            {ranges.map((range, i) => (
              <linearGradient key={range} id={`grad-fat-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.5} />
                <stop offset="95%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDate}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
          />
          {visibleRanges.map((range) => {
            const i = ranges.indexOf(range)
            return (
              <Area
                key={range}
                type="monotone"
                dataKey={range}
                stackId="1"
                stroke={PALETTE[i % PALETTE.length]}
                fill={`url(#grad-fat-${i})`}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            )
          })}
        </AreaChart>
      </ResponsiveContainer>

      <SeriesToggle keys={ranges} colors={PALETTE} active={active} onToggle={toggle} />
    </div>
  )
}

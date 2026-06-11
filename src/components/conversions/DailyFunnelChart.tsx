import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  ComposedChart,
  Line,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { DailyFunnelPoint } from '../../utils/computeMetrics'
import type { ParsedLead } from '../../utils/parseLeads'

interface ChartPoint {
  date: string
  leads: number | null
  mqls: number | null
  cpmql: number | null
}

interface Props {
  dailyFunnel: DailyFunnelPoint[]
  filteredLeads: ParsedLead[]
}

function fmtDate(d: string) {
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <p className="text-gray-500 font-medium mb-1.5">{fmtDate(label)}</p>
      {payload.map((p: { name: string; value: number | null; color: string }) => (
        p.value != null && (
          <div key={p.name} className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-gray-600">{p.name}:</span>
            <span className="font-semibold text-gray-800">
              {p.name === 'CPMQL' ? fmtBRL(p.value) : p.value}
            </span>
          </div>
        )
      ))}
    </div>
  )
}

export default function DailyFunnelChart({ dailyFunnel, filteredLeads }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  // Group filtered leads by date
  const leadsByDate: Record<string, number> = {}
  for (const l of filteredLeads) {
    if (l.date) leadsByDate[l.date] = (leadsByDate[l.date] ?? 0) + 1
  }

  // Merge all dates
  const allDates = new Set([
    ...dailyFunnel.map((p) => p.date),
    ...Object.keys(leadsByDate),
  ])

  const data: ChartPoint[] = [...allDates].sort().map((date) => {
    const fp = dailyFunnel.find((p) => p.date === date)
    const mqls = fp?.mqls ?? 0
    const spend = fp?.spend ?? 0
    const leads = leadsByDate[date] ?? 0
    return {
      date,
      leads: leads > 0 ? leads : null,
      mqls: mqls > 0 ? mqls : null,
      cpmql: mqls > 0 && spend > 0 ? Math.round(spend / mqls) : null,
    }
  })

  // Summary totals for the header pills
  const totalLeads = filteredLeads.length
  const totalMQLs = dailyFunnel.reduce((s, p) => s + p.mqls, 0)
  const totalSpend = dailyFunnel.reduce((s, p) => s + p.spend, 0)
  const avgCPMQL = totalMQLs > 0 ? totalSpend / totalMQLs : null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-gray-50 transition-colors"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-700">Leads, MQLs e CPMQL por dia</h3>
          {collapsed && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-full">
                {totalLeads} Leads
              </span>
              <span className="text-xs bg-blue-50 text-[#0C2F9F] font-medium px-2 py-0.5 rounded-full">
                {totalMQLs} MQLs
              </span>
              {avgCPMQL != null && (
                <span className="text-xs bg-amber-50 text-amber-700 font-medium px-2 py-0.5 rounded-full">
                  CPMQL {fmtBRL(avgCPMQL)}
                </span>
              )}
            </div>
          )}
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors ml-2 shrink-0">
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* Chart body */}
      {!collapsed && (
        <div className="px-2 pb-4">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDate}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="count"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <YAxis
                yAxisId="cost"
                orientation="right"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
              <Line
                yAxisId="count"
                type="linear"
                dataKey="leads"
                name="Leads"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                connectNulls={false}
              >
                <LabelList
                  dataKey="leads"
                  position="top"
                  style={{ fontSize: 9, fill: '#a5b4fc' }}
                />
              </Line>
              <Line
                yAxisId="count"
                type="linear"
                dataKey="mqls"
                name="MQLs"
                stroke="#0C2F9F"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#0C2F9F', strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                connectNulls={false}
              >
                <LabelList
                  dataKey="mqls"
                  position="bottom"
                  style={{ fontSize: 9, fill: '#93c5fd' }}
                />
              </Line>
              <Line
                yAxisId="cost"
                type="linear"
                dataKey="cpmql"
                name="CPMQL"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={{ r: 2, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                connectNulls={false}
              >
                <LabelList
                  dataKey="cpmql"
                  position="top"
                  formatter={(v: number) => `${Math.round(v / 1000)}k`}
                  style={{ fontSize: 9, fill: '#fcd34d' }}
                />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

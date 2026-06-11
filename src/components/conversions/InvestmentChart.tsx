import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { DailySpend } from '../../hooks/useConversionsData'
import { CHANNELS, CHANNEL_COLORS, type Channel } from '../../utils/channelNorm'

function fmtDate(date: string) {
  const [, m, d] = date.split('-')
  return `${d}/${m}`
}

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

interface TooltipProps {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((a, b) => a + (b.value || 0), 0)
  const sorted = [...payload].filter((p) => p.value > 0).sort((a, b) => b.value - a.value)
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs min-w-40">
      <p className="font-semibold text-gray-700 mb-2">{label && fmtDate(label)}</p>
      {sorted.map((p) => (
        <div key={p.name} className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium text-gray-700">{fmtBRL(p.value)}</span>
        </div>
      ))}
      <div className="flex justify-between gap-4 mt-1.5 pt-1.5 border-t border-gray-100 font-semibold text-gray-700">
        <span>Total</span>
        <span>{fmtBRL(total)}</span>
      </div>
    </div>
  )
}

interface Props {
  data: DailySpend[]
  activeChannels: string[]
}

export default function InvestmentChart({ data, activeChannels }: Props) {
  const visibleChannels = (activeChannels.length > 0 ? activeChannels : CHANNELS) as Channel[]
  const activeData = visibleChannels.filter((ch) => data.some((d) => (d[ch] as number) > 0))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Investimento Diário por Canal</h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">Sem dados de investimento no período.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              {activeData.map((ch) => (
                <linearGradient key={ch} id={`grad-inv-${ch}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHANNEL_COLORS[ch]} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={CHANNEL_COLORS[ch]} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={fmtDate}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 'auto']}
              tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            {activeData.map((ch) => (
              <Area
                key={ch}
                type="monotone"
                dataKey={ch}
                stackId="1"
                stroke={CHANNEL_COLORS[ch]}
                fill={`url(#grad-inv-${ch})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                name={ch}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

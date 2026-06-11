import { ArrowRight } from 'lucide-react'
import type { FunnelCounts } from '../../hooks/useConversionsData'

function fmt(n: number) {
  return n.toLocaleString('pt-BR')
}

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function pct(a: number, b: number): string {
  if (b === 0) return '—'
  return ((a / b) * 100).toFixed(1) + '%'
}

function Card({
  label,
  value,
  sub,
  color = 'text-blue-600',
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

function pacingColor(_ritmo: number): string {
  return 'text-[#1a1a1a]'
}

interface Props {
  totalSpend: number
  totalLeads: number
  funnel: FunnelCounts
  totalMRR: number
  cpl: number | null
  cpa: number | null
  pacingDeveria?: number | null
  pacingBudget?: number
}

export default function KPICards({ totalSpend, totalLeads, funnel, totalMRR, cpl, cpa, pacingDeveria, pacingBudget }: Props) {
  const ticketMedio = funnel.won > 0 ? totalMRR / funnel.won : null
  const ritmo = pacingDeveria && pacingDeveria > 0 ? (totalSpend / pacingDeveria) * 100 : null

  const stages = [
    { label: 'Leads', value: totalLeads, color: 'text-[#1a1a1a]' },
    { label: 'MQLs', value: funnel.mql, color: 'text-[#1a1a1a]' },
    { label: 'SQLs', value: funnel.sql, color: 'text-[#1a1a1a]' },
    { label: 'Oportunidades', value: funnel.opportunity, color: 'text-[#1a1a1a]' },
    { label: 'Reuniões', value: funnel.meeting, color: 'text-[#1a1a1a]' },
    { label: 'Ganhos', value: funnel.won, color: 'text-[#1a1a1a]' },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Investimento with pacing */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Investimento Total</span>
          <span className="text-2xl font-bold text-[#1a1a1a]">{fmtBRL(totalSpend)}</span>
          {pacingBudget && pacingBudget > 0 && pacingDeveria != null ? (
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-xs text-gray-400">
                Deveríamos: <span className="font-medium text-gray-600">{fmtBRL(pacingDeveria)}</span>
              </span>
              {ritmo !== null && (
                <span className={`text-xs font-semibold ${pacingColor(ritmo)}`}>
                  Ritmo: {ritmo.toFixed(1)}%
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-300">Configure verba no Pacing ↓</span>
          )}
        </div>
        <Card label="CPA" value={cpa !== null ? fmtBRL(cpa) : '—'} sub="Invest. ÷ Vendas" color="text-[#1a1a1a]" />
        <Card label="MRR Total" value={fmtBRL(totalMRR)} color="text-[#1a1a1a]" />
        <Card label="Ticket Médio" value={ticketMedio !== null ? fmtBRL(ticketMedio) : '—'} sub="MRR ÷ Vendas" color="text-[#1a1a1a]" />
        <Card label="CPMQL Geral" value={cpl !== null ? fmtBRL(cpl) : '—'} sub="Invest. ÷ MQLs" color="text-[#1a1a1a]" />
      </div>

      {/* Row 2: Funnel pipeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center w-full">
          {stages.map((stage, i) => (
            <div key={stage.label} className="flex items-center flex-1">
              {i > 0 && (
                <div className="flex flex-col items-center shrink-0 px-1">
                  <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
                    {pct(stage.value, stages[i - 1].value)}
                  </span>
                  <ArrowRight size={14} className="text-gray-300 mt-0.5" />
                </div>
              )}
              <div className="flex flex-col items-center text-center flex-1 min-w-0">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide whitespace-nowrap mb-1">
                  {stage.label}
                </span>
                <span className={`text-2xl font-bold ${stage.color}`}>{fmt(stage.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

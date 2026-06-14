import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { ChannelMetrics } from '../../hooks/useConversionsData'
import { CHANNEL_COLORS } from '../../utils/channelNorm'

function fmtBRL(n: number) {
  if (n === 0) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function fmtN(n: number) {
  if (n === 0) return '—'
  return n.toLocaleString('pt-BR')
}

function ratio(invest: number, count: number): string {
  if (count === 0 || invest === 0) return '—'
  return (invest / count).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function ticketMedio(mrr: number, won: number): string {
  if (won === 0 || mrr === 0) return '—'
  return (mrr / won).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

type SortKey = 'spend' | 'mqls' | 'cpmql' | 'sqls' | 'cpsql' | 'opportunities' | 'meetings' | 'won' | 'cpa' | 'mrr' | 'ticket'

function sortVal(r: ChannelMetrics, key: SortKey): number {
  switch (key) {
    case 'spend': return r.spend
    case 'mqls': return r.mqls
    case 'cpmql': return r.mqls > 0 ? r.spend / r.mqls : 0
    case 'sqls': return r.sqls
    case 'cpsql': return r.sqls > 0 ? r.spend / r.sqls : 0
    case 'opportunities': return r.opportunities
    case 'meetings': return r.meetings
    case 'won': return r.won
    case 'cpa': return r.won > 0 ? r.spend / r.won : 0
    case 'mrr': return r.mrr
    case 'ticket': return r.won > 0 ? r.mrr / r.won : 0
  }
}

const COL_KEYS: { label: string; key: SortKey | null }[] = [
  { label: 'Canal', key: null },
  { label: 'Investimento', key: 'spend' },
  { label: 'MQLs', key: 'mqls' },
  { label: 'CPMQL', key: 'cpmql' },
  { label: 'SQLs', key: 'sqls' },
  { label: 'CPSQL', key: 'cpsql' },
  { label: 'Oport.', key: 'opportunities' },
  { label: 'Reuniões', key: 'meetings' },
  { label: 'Vendas', key: 'won' },
  { label: 'CPA', key: 'cpa' },
  { label: 'MRR', key: 'mrr' },
  { label: 'Ticket Médio', key: 'ticket' },
]

interface Props {
  byChannel: ChannelMetrics[]
  activeChannels: string[]
}

export default function ChannelTable({ byChannel, activeChannels }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('spend')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const baseRows = byChannel.filter((r) => activeChannels.length === 0 || activeChannels.includes(r.channel))

  const rows = [...baseRows].sort((a, b) => {
    const diff = sortVal(a, sortKey) - sortVal(b, sortKey)
    return sortDir === 'asc' ? diff : -diff
  })

  const total: ChannelMetrics = baseRows.reduce(
    (acc, r) => ({
      channel: 'Total' as never,
      spend: acc.spend + r.spend,
      mqls: acc.mqls + r.mqls,
      sqls: acc.sqls + r.sqls,
      opportunities: acc.opportunities + r.opportunities,
      meetings: acc.meetings + r.meetings,
      won: acc.won + r.won,
      mrr: acc.mrr + r.mrr,
    }),
    { channel: 'Total' as never, spend: 0, mqls: 0, sqls: 0, opportunities: 0, meetings: 0, won: 0, mrr: 0 },
  )

  function Row({ r, isTotal = false }: { r: ChannelMetrics; isTotal?: boolean }) {
    const color = CHANNEL_COLORS[r.channel as keyof typeof CHANNEL_COLORS]
    return (
      <tr className={isTotal ? 'bg-gray-50 font-semibold border-t-2 border-gray-200' : 'hover:bg-gray-50'}>
        <td className="px-3 py-2.5 whitespace-nowrap">
          <div className="flex items-center gap-2">
            {!isTotal && (
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color ?? '#9CA3AF' }} />
            )}
            <span className={isTotal ? 'text-gray-800' : 'text-gray-700'}>{r.channel}</span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-right text-gray-700">{fmtBRL(r.spend)}</td>
        <td className="px-3 py-2.5 text-right text-gray-700">{fmtN(r.mqls)}</td>
        <td className="px-3 py-2.5 text-right text-gray-500 text-xs">{ratio(r.spend, r.mqls)}</td>
        <td className="px-3 py-2.5 text-right text-gray-700">{fmtN(r.sqls)}</td>
        <td className="px-3 py-2.5 text-right text-gray-500 text-xs">{ratio(r.spend, r.sqls)}</td>
        <td className="px-3 py-2.5 text-right text-gray-700">{fmtN(r.opportunities)}</td>
        <td className="px-3 py-2.5 text-right text-gray-700">{fmtN(r.meetings)}</td>
        <td className="px-3 py-2.5 text-right text-gray-700">{fmtN(r.won)}</td>
        <td className="px-3 py-2.5 text-right text-gray-500 text-xs">{ratio(r.spend, r.won)}</td>
        <td className="px-3 py-2.5 text-right text-gray-700">{fmtBRL(r.mrr)}</td>
        <td className="px-3 py-2.5 text-right text-[#1a1a1a] font-medium text-xs">{ticketMedio(r.mrr, r.won)}</td>
      </tr>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-gray-700">Performance por Canal</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
              {COL_KEYS.map(({ label, key }) => (
                <th
                  key={label}
                  className={`px-3 py-2 font-medium select-none ${label === 'Canal' ? 'text-left' : 'text-right'} ${key ? 'cursor-pointer hover:text-gray-600' : ''}`}
                  onClick={key ? () => handleSort(key) : undefined}
                >
                  <span className="inline-flex items-center gap-0.5 justify-end w-full">
                    {label !== 'Canal' && key && sortKey === key && (
                      sortDir === 'asc'
                        ? <ChevronUp size={11} className="text-blue-500 shrink-0" />
                        : <ChevronDown size={11} className="text-blue-500 shrink-0" />
                    )}
                    <span className={sortKey === key ? 'text-blue-500' : ''}>{label}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r) => (
              <Row key={r.channel} r={r} />
            ))}
            <Row r={total} isTotal />
          </tbody>
        </table>
      </div>
    </div>
  )
}

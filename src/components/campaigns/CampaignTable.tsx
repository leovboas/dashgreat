import { ExternalLink } from 'lucide-react'
import type { ParsedLead } from '../../utils/parseLeads'
import { groupBy, allFaturamentoRanges } from '../../utils/parseLeads'

interface Props {
  leads: ParsedLead[]
  totalLeads: number
}

export default function CampaignTable({ leads, totalLeads }: Props) {
  const grouped = groupBy(leads, 'utmCampaign')
  const ranges = allFaturamentoRanges(leads)

  if (grouped.size === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <SectionHeader />
        <p className="text-sm text-gray-400 text-center py-8">
          Nenhuma campanha (utmCampaign) encontrada nos leads do período.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <SectionHeader />
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-2 pr-4 font-semibold min-w-[160px]">Campanha</th>
              <th className="pb-2 pr-4 font-semibold min-w-[180px]">URLs das páginas</th>
              <th className="pb-2 pr-4 font-semibold text-right">Leads</th>
              <th className="pb-2 pr-4 font-semibold text-right">% do Total</th>
              {ranges.map((r) => (
                <th key={r} className="pb-2 pr-4 font-semibold text-right whitespace-nowrap max-w-[140px]">
                  <span className="block truncate" title={r}>{r}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...grouped.entries()].map(([campaign, rows]) => {
              const pct = totalLeads > 0 ? ((rows.length / totalLeads) * 100).toFixed(1) : '0'
              return (
                <tr key={campaign} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="py-2 pr-4 text-gray-800 font-medium max-w-[200px]">
                    <span className="block truncate" title={campaign}>{campaign}</span>
                  </td>
                  <td className="py-2 pr-4 max-w-[220px]">
                    <PageUrls rows={rows} />
                  </td>
                  <td className="py-2 pr-4 text-right font-bold text-gray-700">{rows.length}</td>
                  <td className="py-2 pr-4 text-right">
                    <span className="inline-block bg-blue-50 text-[#0D2F9F] text-xs font-semibold px-2 py-0.5 rounded-full">
                      {pct}%
                    </span>
                  </td>
                  {ranges.map((r) => {
                    const count = rows.filter((l) => l.faturamento === r).length
                    const rangePct = rows.length > 0 ? ((count / rows.length) * 100).toFixed(0) : '0'
                    return (
                      <td key={r} className="py-2 pr-4 text-right text-gray-600">
                        {count > 0 ? (
                          <span>
                            {count}{' '}
                            <span className="text-gray-400 text-xs">({rangePct}%)</span>
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SectionHeader() {
  return (
    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
      Performance por Campanha
    </h3>
  )
}

function PageUrls({ rows }: { rows: ParsedLead[] }) {
  const urls = [...new Set(rows.map((r) => r.pageUrl).filter(Boolean))]
  if (urls.length === 0) return <span className="text-gray-300 text-xs">—</span>
  return (
    <div className="flex flex-col gap-0.5">
      {urls.map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-[#0D2F9F] hover:underline truncate max-w-[210px]"
          title={url}
        >
          <ExternalLink size={10} className="shrink-0" />
          <span className="truncate">{url.replace(/^https?:\/\//, '')}</span>
        </a>
      ))}
    </div>
  )
}

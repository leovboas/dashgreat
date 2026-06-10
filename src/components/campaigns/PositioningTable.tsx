import type { ParsedLead } from '../../utils/parseLeads'
import { groupBy } from '../../utils/parseLeads'

interface Props {
  leads: ParsedLead[]
}

/** Returns the most frequent campaign among a list of leads */
function topCampaign(rows: ParsedLead[]): string {
  if (rows.length === 0) return '—'
  const counts: Record<string, number> = {}
  for (const l of rows) {
    const c = l.utmCampaign || '(não informado)'
    counts[c] = (counts[c] ?? 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]![0]
}

export default function PositioningTable({ leads }: Props) {
  const grouped = groupBy(leads, 'utmTerm')

  if (grouped.size === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <SectionHeader />
        <p className="text-sm text-gray-400 text-center py-8">
          Nenhum posicionamento (utmTerm) encontrado nos leads do período.
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
              <th className="pb-2 pr-4 font-semibold">Posicionamento (utmTerm)</th>
              <th className="pb-2 pr-4 font-semibold">Campanha Associada</th>
              <th className="pb-2 pr-4 font-semibold text-right">Total de Leads</th>
            </tr>
          </thead>
          <tbody>
            {[...grouped.entries()].map(([term, rows]) => (
              <tr key={term} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="py-2 pr-4 text-gray-800 font-medium max-w-[240px]">
                  <span className="block truncate" title={term}>{term}</span>
                </td>
                <td className="py-2 pr-4 text-gray-500 max-w-[200px]">
                  <span
                    className="inline-block bg-purple-50 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full truncate max-w-full"
                    title={topCampaign(rows)}
                  >
                    {topCampaign(rows)}
                  </span>
                </td>
                <td className="py-2 pr-4 text-right font-bold text-gray-700">{rows.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SectionHeader() {
  return (
    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
      Performance por Posicionamento
    </h3>
  )
}

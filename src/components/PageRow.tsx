import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, Loader2 } from 'lucide-react'
import type { PageData } from '../hooks/useDashboard'

interface Props {
  data: PageData
}

export default function PageRow({ data }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { summary, report, leads, loadingReport, loadingLeads } = data

  const leadsCount = leads?.retorno?.quantidade ?? 0
  const taxa = report?.relatorios.taxa_conversao ?? 0
  const taxa7d = report?.relatorios.taxa_conversao_7_dias ?? 0

  const statusColor =
    summary.status === 'publicado'
      ? 'bg-green-100 text-green-700'
      : summary.status === 'rascunho'
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-gray-100 text-gray-500'

  const leadRows = leads?.retorno?.paginas?.leads ?? []

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header row */}
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 truncate">{summary.titulo}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
              {summary.status}
            </span>
          </div>
          {summary.link.publico && (
            <a
              href={summary.link.publico}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
            >
              {summary.link.publico} <ExternalLink size={10} />
            </a>
          )}
        </div>

        <div className="hidden sm:grid grid-cols-4 gap-6 text-center shrink-0">
          <Stat label="Visitas" total={summary.visitas.total} dias7={summary.visitas['7_dias']} />
          <Stat label="Impressões" total={summary.impressoes.total} dias7={summary.impressoes['7_dias']} />
          <Stat label="Conversões" total={summary.conversoes.total} dias7={summary.conversoes['7_dias']} />
          <Stat label="Taxa conv." total={`${taxa.toFixed(1)}%`} dias7={`${taxa7d.toFixed(1)}%`} />
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <span className="text-sm font-semibold text-purple-600">{leadsCount} leads</span>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          <div className="grid grid-cols-2 sm:hidden gap-3 mb-4">
            <Stat label="Visitas" total={summary.visitas.total} dias7={summary.visitas['7_dias']} />
            <Stat label="Impressões" total={summary.impressoes.total} dias7={summary.impressoes['7_dias']} />
            <Stat label="Conversões" total={summary.conversoes.total} dias7={summary.conversoes['7_dias']} />
            <Stat label="Taxa conv." total={`${taxa.toFixed(1)}%`} dias7={`${taxa7d.toFixed(1)}%`} />
          </div>

          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Leads capturados</h4>
          {loadingLeads ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 size={14} className="animate-spin" /> Carregando leads...
            </div>
          ) : leadRows.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum lead encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-200">
                    {leadRows[0]?.map((f) => (
                      <th key={f.id} className="pb-2 pr-4 font-semibold">
                        {f.titulo}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leadRows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      {row.map((f) => (
                        <td key={f.id} className="py-1.5 pr-4 text-gray-700">
                          {f.valor}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {loadingReport && (
            <div className="flex items-center gap-2 text-gray-400 text-sm mt-3">
              <Loader2 size={14} className="animate-spin" /> Carregando relatório...
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  total,
  dias7,
}: {
  label: string
  total: number | string
  dias7: number | string
}) {
  return (
    <div className="text-center">
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="font-bold text-gray-700">{total}</div>
      <div className="text-xs text-gray-400">7d: {dias7}</div>
    </div>
  )
}

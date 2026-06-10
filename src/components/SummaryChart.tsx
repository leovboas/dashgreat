import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { PageData } from '../hooks/useDashboard'

interface Props {
  pages: PageData[]
}

export default function SummaryChart({ pages }: Props) {
  const data = pages
    .filter((p) => p.summary.visitas.total > 0 || p.summary.conversoes.total > 0)
    .slice(0, 10)
    .map((p) => ({
      name: p.summary.titulo.length > 18 ? p.summary.titulo.slice(0, 18) + '…' : p.summary.titulo,
      Visitas: p.summary.visitas['7_dias'],
      Conversões: p.summary.conversoes['7_dias'],
      Leads: p.leads?.retorno?.quantidade ?? 0,
    }))

  if (data.length === 0) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Desempenho por Página (últimos 7 dias)
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Visitas" fill="#60a5fa" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Conversões" fill="#34d399" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Leads" fill="#a78bfa" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

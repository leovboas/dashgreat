interface Props {
  label: string
  value: number | string
  sub?: string
  color?: string
  icon?: React.ReactNode
}

export default function MetricCard({ label, value, sub, color = 'text-[#0D2F9F]', icon }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        {icon && <span className={`${color} opacity-80`}>{icon}</span>}
      </div>
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

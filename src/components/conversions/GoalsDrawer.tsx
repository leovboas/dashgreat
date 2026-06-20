import { useState } from 'react'
import { X, Save, Loader2, Target } from 'lucide-react'
import type { GoalsConfig } from '../../utils/goals'

interface Props {
  goals: GoalsConfig
  syncing: boolean
  onSave: (g: GoalsConfig) => void
  onClose: () => void
}

function Field({
  label,
  hint,
  value,
  onChange,
  prefix,
  suffix,
}: {
  label: string
  hint: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <p className="text-[11px] text-gray-400 leading-tight">{hint}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        {prefix && <span className="text-xs text-gray-400">{prefix}</span>}
        <input
          type="number"
          min={0}
          value={value === 0 ? '' : value}
          placeholder="—"
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className="w-28 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D2F9F] focus:border-transparent"
        />
        {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
      </div>
    </div>
  )
}

export default function GoalsDrawer({ goals, syncing, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<GoalsConfig>({ ...goals })

  function set(key: keyof GoalsConfig, value: number) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 z-50 w-[340px] bg-white shadow-xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <Target size={15} className="text-[#0D2F9F]" />
              <h2 className="text-sm font-semibold text-gray-800">Metas do Período</h2>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Defina 0 para desativar uma meta</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-5 py-5 flex flex-col gap-5">
          {/* Custo */}
          <div>
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Custo</h3>
            <Field
              label="CPMQL Meta"
              hint="Meta máxima de custo por MQL. Verde quando abaixo da meta."
              value={draft.cpmql}
              onChange={(v) => set('cpmql', v)}
              prefix="R$"
            />
          </div>

          <div className="h-px bg-gray-100" />

          {/* Funil */}
          <div>
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Funil</h3>
            <div className="flex flex-col gap-4">
              <Field
                label="Meta de MQLs"
                hint="Número de leads qualificados alvo no período."
                value={draft.mqls}
                onChange={(v) => set('mqls', v)}
              />
              <Field
                label="Meta de SQLs"
                hint="Número de oportunidades qualificadas pelo time comercial."
                value={draft.sqls}
                onChange={(v) => set('sqls', v)}
              />
              <Field
                label="Meta de Oportunidades"
                hint="Número de oportunidades no pipeline."
                value={draft.opportunities}
                onChange={(v) => set('opportunities', v)}
              />
              <Field
                label="Meta de Reuniões"
                hint="Número de reuniões realizadas alvo."
                value={draft.meetings}
                onChange={(v) => set('meetings', v)}
              />
              <Field
                label="Meta de Ganhos"
                hint="Número de vendas fechadas alvo no período."
                value={draft.won}
                onChange={(v) => set('won', v)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={() => onSave(draft)}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 bg-[#0D2F9F] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#0a2580] transition-colors disabled:opacity-50"
          >
            {syncing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {syncing ? 'Salvando...' : 'Salvar metas'}
          </button>
        </div>
      </div>
    </>
  )
}

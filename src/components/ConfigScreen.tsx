import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import type { Config } from '../types/greatpages'

interface Props {
  initial: Config | null
  onSave: (config: Config) => void
}

export default function ConfigScreen({ initial, onSave }: Props) {
  const [form, setForm] = useState<Config>(
    initial ?? {
      token: '',
      id_usuario: '',
      id_projeto: '',
      cacheTtlMinutes: 10,
    },
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.token || !form.id_usuario || !form.id_projeto) return
    onSave(form)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600 text-white rounded-xl p-2">
            <Settings2 size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">GreatPages Dashboard</h1>
            <p className="text-sm text-gray-400">Configure suas credenciais de acesso</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field
            label="Token da API"
            placeholder="Seu X-GreatPages-Token"
            value={form.token}
            type="password"
            onChange={(v) => setForm((f) => ({ ...f, token: v }))}
          />
          <Field
            label="ID do Usuário"
            placeholder="id_usuario"
            value={form.id_usuario}
            onChange={(v) => setForm((f) => ({ ...f, id_usuario: v }))}
          />
          <Field
            label="ID do Projeto"
            placeholder="id_projeto"
            value={form.id_projeto}
            onChange={(v) => setForm((f) => ({ ...f, id_projeto: v }))}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">
              Cache TTL: <span className="font-bold text-blue-600">{form.cacheTtlMinutes} min</span>
            </label>
            <input
              type="range"
              min={1}
              max={60}
              value={form.cacheTtlMinutes}
              onChange={(e) => setForm((f) => ({ ...f, cacheTtlMinutes: Number(e.target.value) }))}
              className="accent-blue-600"
            />
            <p className="text-xs text-gray-400">
              Os dados serão buscados da API apenas quando o cache expirar.
            </p>
          </div>

          <button
            type="submit"
            disabled={!form.token || !form.id_usuario || !form.id_projeto}
            className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Acessar Dashboard
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  placeholder,
  value,
  type = 'text',
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  type?: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
        required
      />
    </div>
  )
}

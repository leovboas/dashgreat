import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import type { Config } from '../types/greatpages'
import { hashPassword } from '../utils/hash'

interface Props {
  existingConfig: Config | null
  onSave: (config: Config, passwordHash: string) => void
}

export default function ConfigScreen({ existingConfig, onSave }: Props) {
  const [form, setForm] = useState<Config>(
    existingConfig ?? { token: '', id_usuario: '', id_projeto: '', cacheTtlMinutes: 10 },
  )
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const credentialsReady = existingConfig
    ? true
    : !!(form.token && form.id_usuario && form.id_projeto)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!credentialsReady) return
    setPwdError('')
    if (password.length < 4) {
      setPwdError('A senha deve ter ao menos 4 caracteres')
      return
    }
    if (password !== confirmPwd) {
      setPwdError('As senhas não coincidem')
      return
    }
    setSubmitting(true)
    const hash = await hashPassword(password)
    onSave(form, hash)
  }

  const canSubmit = credentialsReady && !!(password && confirmPwd)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600 text-white rounded-xl p-2">
            <Settings2 size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">GreatPages Dashboard</h1>
            <p className="text-sm text-gray-400">
              {existingConfig ? 'Defina uma senha de acesso' : 'Configure suas credenciais de acesso'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!existingConfig && (
            <>
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
            </>
          )}

          <div className={existingConfig ? '' : 'border-t border-gray-100 pt-3 mt-1'}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Senha de acesso
            </p>
            <div className="flex flex-col gap-3">
              <Field
                label="Senha"
                placeholder="Mínimo 4 caracteres"
                value={password}
                type="password"
                onChange={(v) => { setPassword(v); setPwdError('') }}
              />
              <Field
                label="Confirmar senha"
                placeholder="Repita a senha"
                value={confirmPwd}
                type="password"
                onChange={(v) => { setConfirmPwd(v); setPwdError('') }}
              />
              {pwdError && <p className="text-sm text-red-500 -mt-1">{pwdError}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {submitting ? 'Salvando...' : 'Configurar e Acessar'}
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

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { hashPassword } from '../utils/hash'

interface Props {
  // Env-var mode: compare plain text
  envPassword?: string
  // localStorage mode: compare SHA-256 hash
  storedHash?: string
  onLogin: () => void
  onReset?: () => void
}

export default function LoginScreen({ envPassword, storedHash, onLogin, onReset }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    let correct = false
    if (envPassword !== undefined) {
      correct = password === envPassword
    } else if (storedHash) {
      const hash = await hashPassword(password)
      correct = hash === storedHash
    }

    if (correct) {
      onLogin()
    } else {
      setError('Senha incorreta')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600 text-white rounded-xl p-2">
            <Lock size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">GreatPages Dashboard</h1>
            <p className="text-sm text-gray-400">Digite sua senha para acessar</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              placeholder="••••••••"
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
              autoFocus
              required
            />
          </div>

          {error && <p className="text-sm text-red-500 -mt-1">{error}</p>}

          <button
            type="submit"
            disabled={!password || loading}
            className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        {onReset && (
          <button
            onClick={onReset}
            className="mt-6 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Redefinir acesso
          </button>
        )}
      </div>
    </div>
  )
}

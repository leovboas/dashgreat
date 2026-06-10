import { useState, useEffect } from 'react'
import { RefreshCw, Settings2, LogOut, Clock, AlertCircle, Loader2 } from 'lucide-react'
import type { Config } from './types/greatpages'
import { useDashboard } from './hooks/useDashboard'
import ConfigScreen from './components/ConfigScreen'
import MetricCard from './components/MetricCard'
import PageRow from './components/PageRow'
import SummaryChart from './components/SummaryChart'
import CampaignsSection from './components/campaigns/CampaignsSection'
import { clearAllCache } from './api/cache'

const STORAGE_KEY = 'gp_config'

type Tab = 'overview' | 'campaigns'

function loadConfig(): Config | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveConfig(config: Config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export default function App() {
  const [config, setConfig] = useState<Config | null>(loadConfig)
  const [showConfig, setShowConfig] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { pages, loading, error, cacheAgeSeconds, lastRefreshed, refresh } = useDashboard(config)

  useEffect(() => {
    if (config) saveConfig(config)
  }, [config])

  function handleSaveConfig(c: Config) {
    clearAllCache()
    setConfig(c)
    setShowConfig(false)
  }

  function handleLogout() {
    clearAllCache()
    localStorage.removeItem(STORAGE_KEY)
    setConfig(null)
  }

  if (!config || showConfig) {
    return <ConfigScreen initial={config} onSave={handleSaveConfig} />
  }

  // Aggregate totals
  const totals = pages.reduce(
    (acc, p) => ({
      visitas: acc.visitas + p.summary.visitas.total,
      visitas7d: acc.visitas7d + p.summary.visitas['7_dias'],
      conversoes: acc.conversoes + p.summary.conversoes.total,
      conversoes7d: acc.conversoes7d + p.summary.conversoes['7_dias'],
      leads: acc.leads + (p.leads?.retorno?.quantidade ?? 0),
    }),
    { visitas: 0, visitas7d: 0, conversoes: 0, conversoes7d: 0, leads: 0 },
  )

  const taxaGeral =
    totals.visitas > 0 ? ((totals.conversoes / totals.visitas) * 100).toFixed(1) : '0.0'

  const cacheLabel =
    cacheAgeSeconds !== null
      ? cacheAgeSeconds < 60
        ? `Cache: ${cacheAgeSeconds}s atrás`
        : `Cache: ${Math.floor(cacheAgeSeconds / 60)}min atrás`
      : null

  const loadingLeads = pages.some((p) => p.loadingLeads)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white rounded-xl p-1.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
            </div>
            <span className="font-bold text-gray-800 text-lg">GreatPages Dashboard</span>
          </div>

          <div className="flex items-center gap-2">
            {cacheLabel && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                <Clock size={11} /> {cacheLabel}
              </span>
            )}
            {lastRefreshed && (
              <span className="hidden md:flex items-center gap-1 text-xs text-gray-400">
                Atualizado: {lastRefreshed.toLocaleTimeString('pt-BR')}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              onClick={() => setShowConfig(true)}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Configurações"
            >
              <Settings2 size={16} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        {pages.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 border-t border-gray-100">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
              Visão Geral
            </TabButton>
            <TabButton
              active={activeTab === 'campaigns'}
              onClick={() => setActiveTab('campaigns')}
              loading={loadingLeads}
            >
              Origem &amp; Campanhas
            </TabButton>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Global loading state */}
        {loading && pages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 size={32} className="animate-spin text-blue-400" />
            <span>Carregando dados das páginas...</span>
          </div>
        )}

        {pages.length > 0 && (
          <>
            {/* ── Visão Geral ── */}
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <MetricCard
                    label="Visitas totais"
                    value={totals.visitas.toLocaleString('pt-BR')}
                    sub={`${totals.visitas7d.toLocaleString('pt-BR')} nos últimos 7 dias`}
                    color="text-blue-600"
                  />
                  <MetricCard
                    label="Conversões"
                    value={totals.conversoes.toLocaleString('pt-BR')}
                    sub={`${totals.conversoes7d.toLocaleString('pt-BR')} nos últimos 7 dias`}
                    color="text-emerald-600"
                  />
                  <MetricCard
                    label="Taxa de conversão"
                    value={`${taxaGeral}%`}
                    sub="Total acumulado"
                    color="text-orange-500"
                  />
                  <MetricCard
                    label="Leads gerados"
                    value={totals.leads.toLocaleString('pt-BR')}
                    sub={`em ${pages.length} páginas`}
                    color="text-purple-600"
                  />
                </div>

                <SummaryChart pages={pages} />

                <div>
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Páginas ({pages.length})
                  </h2>
                  <div className="flex flex-col gap-3">
                    {pages.map((p) => (
                      <PageRow key={p.summary.id} data={p} />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Origem & Campanhas ── */}
            {activeTab === 'campaigns' && (
              <>
                {loadingLeads && (
                  <div className="flex items-center gap-2 text-sm text-gray-400 bg-amber-50 border border-amber-100 px-4 py-3 rounded-xl">
                    <Loader2 size={14} className="animate-spin text-amber-500 shrink-0" />
                    Carregando leads de algumas páginas... os dados abaixo podem estar incompletos.
                  </div>
                )}
                <CampaignsSection pages={pages} />
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
  loading,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  loading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
      {loading && <Loader2 size={11} className="animate-spin text-gray-400" />}
    </button>
  )
}

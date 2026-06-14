import { useState, useMemo, useEffect, useRef } from 'react'
import { RefreshCw, Loader2, AlertCircle, Info } from 'lucide-react'
import { useConversionsData } from '../../hooks/useConversionsData'
import { CHANNELS, normalizeCrmChannel } from '../../utils/channelNorm'
import { parseAllLeads, filterLeads } from '../../utils/parseLeads'
import { computeMetrics, extractFilterOptions } from '../../utils/computeMetrics'
import type { PageData } from '../../hooks/useDashboard'
import KPICards from './KPICards'
import FunnelChart from './FunnelChart'
import DailyLeadsChart from './DailyLeadsChart'
import DailyFunnelChart from './DailyFunnelChart'
import ChannelTable from './ChannelTable'
import AdTable from './AdTable'
import InvestmentChart from './InvestmentChart'
import PacingSection from './PacingSection'
import MultiSelect from './MultiSelect'

function currentMonthRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  return {
    from: `${y}-${m}-01`,
    to: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
  }
}

interface Props {
  pages: PageData[]
}

export default function ConversionsSection({ pages }: Props) {
  const [dateFrom, setDateFrom] = useState(() => currentMonthRange().from)
  const [dateTo, setDateTo] = useState(() => currentMonthRange().to)

  // Existing channel filter (buttons)
  const [activeChannels, setActiveChannels] = useState<string[]>([])

  // New strategic filters
  const [selCampaigns, setSelCampaigns] = useState<string[]>([])
  const [selAdSets, setSelAdSets] = useState<string[]>([])
  const [selAds, setSelAds] = useState<string[]>([])
  const [selPages, setSelPages] = useState<string[]>([])
  const [selRevenue, setSelRevenue] = useState<string[]>([])
  const [selSegments, setSelSegments] = useState<string[]>([])

  // Fetch raw data
  const { loading, error, rawWindsorRows, rawEvents, reload } = useConversionsData(dateFrom, dateTo)

  // Auto-initialize revenue filter: select all except low-revenue tiers
  const lastInitedEventsRef = useRef<typeof rawEvents | null>(null)
  useEffect(() => {
    if (rawEvents.length === 0 || rawEvents === lastInitedEventsRef.current) return
    lastInitedEventsRef.current = rawEvents
    const { revenue: allRevenue } = extractFilterOptions(rawEvents)
    const EXCLUDED = ['até 40 mil', 'até 30 mil']
    const defaults = allRevenue.filter(
      (r) => !EXCLUDED.some((ex) => r.toLowerCase().includes(ex)),
    )
    setSelRevenue(defaults)
  }, [rawEvents])

  // Auto-initialize LP filter: pre-select pages with [ADS] prefix
  const pagesInitializedRef = useRef(false)

  // Build page name map from GreatPages data
  const pageNameMap = useMemo(
    () => new Map(pages.map((p) => [p.summary.id, p.summary.titulo])),
    [pages],
  )

  // Filter options (cascade: adsets depend on selected campaigns, ads on selected adsets)
  const filterOptions = useMemo(
    () => extractFilterOptions(rawEvents, selCampaigns, selAdSets),
    [rawEvents, selCampaigns, selAdSets],
  )

  // Page options with names resolved
  const pageOptions = useMemo(
    () =>
      filterOptions.pages.map((id) => ({
        id,
        label: pageNameMap.get(id) ?? id,
      })),
    [filterOptions.pages, pageNameMap],
  )

  useEffect(() => {
    if (pagesInitializedRef.current || pageOptions.length === 0) return
    const adsPages = pageOptions.filter((p) => p.label.startsWith('[ADS]')).map((p) => p.id)
    if (adsPages.length > 0) {
      pagesInitializedRef.current = true
      setSelPages(adsPages)
    }
  }, [pageOptions])

  // Compute all metrics from raw data + current filters
  const metrics = useMemo(
    () =>
      computeMetrics(rawWindsorRows, rawEvents, {
        channels: activeChannels,
        campaigns: selCampaigns,
        adSets: selAdSets,
        ads: selAds,
        pages: selPages,
        revenue: selRevenue,
        segments: selSegments,
      }),
    [rawWindsorRows, rawEvents, activeChannels, selCampaigns, selAdSets, selAds, selPages, selRevenue, selSegments],
  )

  const { totalSpend, funnelCounts, totalMRR, byChannel, byAd, dailySpend, dailyFunnel, investmentPartial } = metrics

  // GreatPages leads filtered by date + active filters
  const filteredLeadsList = useMemo(() => {
    let leads = filterLeads(parseAllLeads(pages), { dateFrom, dateTo })
    if (activeChannels.length > 0) {
      leads = leads.filter((l) => activeChannels.includes(normalizeCrmChannel(undefined, l.utmSource)))
    }
    if (selCampaigns.length > 0) {
      leads = leads.filter((l) => selCampaigns.includes(l.campaign))
    }
    if (selAdSets.length > 0) {
      leads = leads.filter((l) => selAdSets.includes(l.adSet))
    }
    if (selAds.length > 0) {
      leads = leads.filter((l) => selAds.includes(l.ad))
    }
    return leads
  }, [pages, dateFrom, dateTo, activeChannels, selCampaigns, selAdSets, selAds])

  const totalLeads = filteredLeadsList.length

  // Derived KPIs
  const filteredCpmql = funnelCounts.mql > 0 && totalSpend > 0 ? totalSpend / funnelCounts.mql : null
  const filteredCpa = funnelCounts.won > 0 ? totalSpend / funnelCounts.won : null

  // Pacing for investimento card
  const { pacingDeveria, pacingBudget } = useMemo(() => {
    try {
      const raw = localStorage.getItem('gp_budget_config')
      const budgets: Record<string, number> = raw ? JSON.parse(raw) : {}
      const totalBudget = CHANNELS.reduce((s, ch) => s + (budgets[ch] ?? 0), 0)
      if (totalBudget === 0) return { pacingDeveria: null, pacingBudget: 0 }
      const from = new Date(dateFrom + 'T12:00:00')
      const to = new Date(dateTo + 'T12:00:00')
      const today = new Date()
      today.setHours(12, 0, 0, 0)
      const effectiveTo = to < today ? to : today
      const elapsed = Math.max(1, Math.round((effectiveTo.getTime() - from.getTime()) / 86_400_000) + 1)
      const total = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate()
      return { pacingDeveria: totalBudget * (elapsed / total), pacingBudget: totalBudget }
    } catch {
      return { pacingDeveria: null, pacingBudget: 0 }
    }
  }, [dateFrom, dateTo])

  // Check if any strategic filter is active
  const hasStrategicFilters =
    selCampaigns.length > 0 || selAdSets.length > 0 || selAds.length > 0 ||
    selPages.length > 0 || selRevenue.length > 0 || selSegments.length > 0

  // Empty state: no CRM events match the filters
  const isEmpty =
    !loading &&
    hasStrategicFilters &&
    funnelCounts.mql === 0 &&
    funnelCounts.sql === 0 &&
    funnelCounts.opportunity === 0 &&
    funnelCounts.meeting === 0 &&
    funnelCounts.won === 0

  function toggleChannel(ch: string) {
    setActiveChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    )
  }

  // When campaign changes, reset dependent filters
  function handleCampaignChange(v: string[]) {
    setSelCampaigns(v)
    setSelAdSets([])
    setSelAds([])
  }

  function handleAdSetChange(v: string[]) {
    setSelAdSets(v)
    setSelAds([])
  }

  const missingWindsor = !import.meta.env.VITE_WINDSOR_API_KEY
  const missingSupabase = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

  return (
    <div className="flex flex-col gap-5">
      {/* Config warnings */}
      {(missingWindsor || missingSupabase) && (
        <div className="flex flex-col gap-2">
          {missingWindsor && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm">
              <AlertCircle size={15} className="shrink-0" />
              <span>
                <strong>Windsor não configurado.</strong> Adicione{' '}
                <code className="bg-amber-100 px-1 rounded">VITE_WINDSOR_API_KEY</code> nas variáveis de ambiente.
              </span>
            </div>
          )}
          {missingSupabase && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm">
              <AlertCircle size={15} className="shrink-0" />
              <span>
                <strong>Supabase não configurado.</strong> Adicione{' '}
                <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> e{' '}
                <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
        {/* Row 1: Period + Channel + Refresh */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">Período</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-xs text-gray-400">até</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="w-px h-5 bg-gray-200 hidden sm:block" />

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 font-medium mr-1">Canal</span>
            <button
              onClick={() => setActiveChannels([])}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeChannels.length === 0
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {CHANNELS.map((ch) => (
              <button
                key={ch}
                onClick={() => toggleChannel(ch)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeChannels.includes(ch)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>

          <div className="ml-auto">
            <button
              onClick={reload}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>

        {/* Row 2: Strategic filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 font-medium mr-1">Filtros</span>
          <MultiSelect
            label="Campanha"
            options={filterOptions.campaigns}
            selected={selCampaigns}
            onChange={handleCampaignChange}
          />
          <MultiSelect
            label="Conjunto"
            options={filterOptions.adSets}
            selected={selAdSets}
            onChange={handleAdSetChange}
            disabled={filterOptions.adSets.length === 0}
          />
          <MultiSelect
            label="Anúncio"
            options={filterOptions.ads}
            selected={selAds}
            onChange={setSelAds}
            disabled={filterOptions.ads.length === 0}
          />
          <MultiSelect
            label="Landing Page"
            options={pageOptions.map((p) => p.label)}
            selected={selPages.map((id) => pageNameMap.get(id) ?? id)}
            onChange={(labels) =>
              setSelPages(labels.map((l) => pageOptions.find((p) => p.label === l)?.id ?? l))
            }
            disabled={pageOptions.length === 0}
          />
          <MultiSelect
            label="Faturamento"
            options={filterOptions.revenue}
            selected={selRevenue}
            onChange={setSelRevenue}
            disabled={filterOptions.revenue.length === 0}
          />
          <MultiSelect
            label="Segmento"
            options={filterOptions.segments}
            selected={selSegments}
            onChange={setSelSegments}
            disabled={filterOptions.segments.length === 0}
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 bg-blue-50 border border-blue-100 px-4 py-3 rounded-xl">
          <Loader2 size={14} className="animate-spin text-blue-400 shrink-0" />
          Carregando dados de Windsor e Supabase...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Investment partial warning */}
      {investmentPartial && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm">
          <Info size={15} className="shrink-0" />
          <span>
            Filtro de <strong>Landing Page</strong>, <strong>Faturamento</strong> ou <strong>Segmento</strong> ativo sem filtro de Campanha —{' '}
            <strong>Investimento exibe o total do período</strong> (não filtrável no Windsor).
          </span>
        </div>
      )}

      {/* Empty state */}
      {isEmpty ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <p className="text-sm font-medium text-gray-500">Nenhum resultado para os filtros selecionados.</p>
          <p className="text-xs text-gray-400 mt-1">Ajuste os filtros ou selecione outro período.</p>
        </div>
      ) : (
        <>
          <KPICards
            totalSpend={totalSpend}
            totalLeads={totalLeads}
            funnel={funnelCounts}
            totalMRR={totalMRR}
            cpl={filteredCpmql}
            cpa={filteredCpa}
            pacingDeveria={pacingDeveria}
            pacingBudget={pacingBudget}
            byChannel={byChannel}
            loading={loading}
            loadingLeads={pages.some((p) => p.loadingLeads)}
          />

          <DailyLeadsChart filteredLeads={filteredLeadsList} />

          <DailyFunnelChart dailyFunnel={dailyFunnel} filteredLeads={filteredLeadsList} />

          <InvestmentChart data={dailySpend} activeChannels={activeChannels} dateFrom={dateFrom} dateTo={dateTo} />

          <FunnelChart funnel={funnelCounts} />

          <ChannelTable byChannel={byChannel} activeChannels={activeChannels} />

          <AdTable byAd={byAd} />

          <PacingSection byChannel={byChannel} dateFrom={dateFrom} dateTo={dateTo} />
        </>
      )}
    </div>
  )
}

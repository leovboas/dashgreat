import { useState, useEffect, useCallback } from 'react'
import type { Config, PageSummary, PageReport, LeadsResponse } from '../types/greatpages'
import { listPages, getPageReport, getPageLeads } from '../api/greatpages'
import { getCacheAge } from '../api/cache'

export interface PageData {
  summary: PageSummary
  report: PageReport | null
  leads: LeadsResponse | null
  loadingReport: boolean
  loadingLeads: boolean
}

export interface DashboardState {
  pages: PageData[]
  loading: boolean
  error: string | null
  cacheAgeSeconds: number | null
  lastRefreshed: Date | null
}

export function useDashboard(config: Config | null) {
  const [state, setState] = useState<DashboardState>({
    pages: [],
    loading: false,
    error: null,
    cacheAgeSeconds: null,
    lastRefreshed: null,
  })

  const load = useCallback(
    async (forceRefresh = false) => {
      if (!config) return
      setState((s) => ({ ...s, loading: true, error: null }))

      try {
        const pagesRes = await listPages(config, forceRefresh)
        const summaries = pagesRes.retorno?.paginas ?? []

        const cacheKey = `pages_${config.id_usuario}_${config.id_projeto}`
        const age = getCacheAge(cacheKey)

        // Initialize pages with summaries, no reports/leads yet
        const initial: PageData[] = summaries.map((p) => ({
          summary: p,
          report: null,
          leads: null,
          loadingReport: true,
          loadingLeads: true,
        }))

        setState({
          pages: initial,
          loading: false,
          error: null,
          cacheAgeSeconds: age,
          lastRefreshed: new Date(),
        })

        // Load reports and leads in parallel per page
        summaries.forEach(async (page) => {
          const [reportRes, leadsRes] = await Promise.allSettled([
            getPageReport(config, page.id, forceRefresh),
            getPageLeads(config, page.id, forceRefresh),
          ])

          setState((prev) => ({
            ...prev,
            pages: prev.pages.map((pd) => {
              if (pd.summary.id !== page.id) return pd
              return {
                ...pd,
                report: reportRes.status === 'fulfilled' ? (reportRes.value.retorno?.paginas?.[0] ?? null) : null,
                leads: leadsRes.status === 'fulfilled' ? leadsRes.value : null,
                loadingReport: false,
                loadingLeads: false,
              }
            }),
          }))
        })
      } catch (err) {
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : 'Erro desconhecido',
        }))
      }
    },
    [config],
  )

  useEffect(() => {
    if (config) load()
  }, [config, load])

  return { ...state, refresh: () => load(true) }
}

import { useState, useEffect, useCallback } from 'react'
import { fetchWindsorData, type WindsorRow } from '../api/windsor'
import { fetchEvents, type SupabaseEvent } from '../api/supabase'

// Re-export types so existing component imports still work
export type { FunnelCounts, ChannelMetrics, DailySpend } from '../utils/computeMetrics'

interface RawState {
  loading: boolean
  error: string | null
  rawWindsorRows: WindsorRow[]
  rawEvents: SupabaseEvent[]
}

export function useConversionsData(
  dateFrom: string,
  dateTo: string,
  _totalLeadsFromGP?: number,
): RawState & { reload: () => void } {
  const [state, setState] = useState<RawState>({
    loading: false,
    error: null,
    rawWindsorRows: [],
    rawEvents: [],
  })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const [rawWindsorRows, rawEvents] = await Promise.all([
        fetchWindsorData(dateFrom, dateTo).catch(() => [] as WindsorRow[]),
        fetchEvents(dateFrom, dateTo).catch(() => [] as SupabaseEvent[]),
      ])
      setState({ loading: false, error: null, rawWindsorRows, rawEvents })
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Erro ao carregar dados',
      }))
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, reload: load }
}

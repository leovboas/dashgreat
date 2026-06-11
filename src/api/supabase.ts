export interface SupabaseEvent {
  event_type: string
  deal_id: string
  event_date: string | null
  event_ts: string | null
  payload: {
    deal?: {
      platform?: string
      utmCampaign?: string
      potentialNewMRR?: number | string
      pagina?: string
      revenue?: string
      revenueNormalization?: { normalizedValue?: string }
      segment?: string
    }
    utmSource?: string
    /** Top-level fallbacks (some events store these outside deal) */
    pagina?: string
    revenue?: string
    segment?: string
  } | null
}

const PAGE_SIZE = 1000

export async function fetchEvents(dateFrom: string, dateTo: string): Promise<SupabaseEvent[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) return []

  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  }

  const base = `${supabaseUrl}/rest/v1/events`
  const qs = `select=event_type,deal_id,event_date,payload&event_date=gte.${dateFrom}&event_date=lte.${dateTo}`

  // First request: get total count + first page (no ORDER to avoid seq scan timeout)
  const first = await fetch(`${base}?${qs}`, {
    headers: { ...headers, Range: `0-${PAGE_SIZE - 1}`, 'Range-Unit': 'items', Prefer: 'count=exact' },
  })
  if (!first.ok) {
    const text = await first.text()
    throw new Error(`Supabase error ${first.status}: ${text.slice(0, 200)}`)
  }

  const firstData: SupabaseEvent[] = await first.json()
  const contentRange = first.headers.get('content-range') ?? ''
  const total = Number(contentRange.split('/')[1]) || firstData.length

  if (total <= PAGE_SIZE) return firstData

  // Fetch remaining pages in parallel
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => {
      const from = (i + 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      return fetch(`${base}?${qs}`, {
        headers: { ...headers, Range: `${from}-${to}`, 'Range-Unit': 'items', Prefer: 'count=none' },
      }).then((r) => (r.ok ? (r.json() as Promise<SupabaseEvent[]>) : Promise.resolve([] as SupabaseEvent[])))
    }),
  )

  return [firstData, ...rest].flat()
}

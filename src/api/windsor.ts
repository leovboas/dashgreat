export interface WindsorRow {
  date: string
  datasource: string
  source: string
  campaign: string
  adset_name: string
  ad_name: string
  spend: number
  clicks: number
}

const WINDSOR_FIELDS = ['date', 'datasource', 'source', 'campaign', 'adset_name', 'ad_name', 'spend', 'clicks']

function parseResponse(text: string): WindsorRow[] {
  text = text.trim()
  if (!text) return []
  try {
    const parsed = JSON.parse(text)
    // { "data": [...] } wrapper
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.data)) return parsed.data
    // Plain array
    if (Array.isArray(parsed)) return parsed
    return []
  } catch {
    // NDJSON fallback (one JSON object per line)
    try {
      return text.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l))
    } catch {
      return []
    }
  }
}

export async function fetchWindsorData(dateFrom: string, dateTo: string): Promise<WindsorRow[]> {
  const apiKey = import.meta.env.VITE_WINDSOR_API_KEY
  if (!apiKey) return []

  const params = new URLSearchParams({
    api_key: apiKey,
    date_from: dateFrom,
    date_to: dateTo,
    fields: WINDSOR_FIELDS.join(','),
  })

  // Windsor uses `select_accounts`, not `account_ids`
  const accountIds = import.meta.env.VITE_WINDSOR_ACCOUNT_IDS
  if (accountIds?.trim()) params.set('select_accounts', accountIds.trim())

  const res = await fetch(`/api/windsor/all?${params}`)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Windsor API ${res.status}: ${body.slice(0, 200)}`)
  }
  const text = await res.text()
  return parseResponse(text)
}

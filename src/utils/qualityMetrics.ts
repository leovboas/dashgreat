import type { WindsorRow } from '../api/windsor'
import { normalizeWindsorChannel } from './channelNorm'

// ── Code extraction helpers (mirrors computeMetrics.ts) ──

function extractCampaignCode(name: string): string {
  if (!name) return ''
  const m = name.match(/\b([A-Za-z]+\d+)\b/)
  return m ? m[1]! : ''
}

function extractAdSetCode(name: string): string {
  if (!name) return ''
  const m = name.match(/([A-Za-z]+\d+C\d+)/i)
  return m ? m[1]! : extractCampaignCode(name)
}

function extractAdCode(name: string): string {
  if (!name) return ''
  const m = name.match(/([A-Za-z]+\d+C\d+AD\d+)/i)
  return m ? m[1]! : extractAdSetCode(name)
}

function resolvedAdCode(row: WindsorRow): string {
  return (
    extractAdCode(row.ad_name ?? '') ||
    extractAdSetCode(row.adset_name ?? '') ||
    extractCampaignCode(row.campaign ?? '')
  )
}

// ── Filter helpers ──

export interface WindsorAdFilters {
  channels?: string[]
  campaigns?: string[]
  adSets?: string[]
  ads?: string[]
  onlyActive?: boolean
}

export function applyWindsorFilters(rows: WindsorRow[], filters: WindsorAdFilters): WindsorRow[] {
  const { channels = [], campaigns = [], adSets = [], ads = [], onlyActive = false } = filters
  let filtered = rows

  if (onlyActive) {
    const active = (s?: string | null) => s === 'ENABLED' || s === 'ACTIVE'
    filtered = filtered.filter((r) => active(r.campaign_status) && active(r.status))
  }
  if (campaigns.length > 0) {
    filtered = filtered.filter((r) => campaigns.includes(extractCampaignCode(r.campaign ?? '')))
  }
  if (adSets.length > 0) {
    filtered = filtered.filter((r) => adSets.includes(extractAdSetCode(r.adset_name ?? '')))
  }
  if (ads.length > 0) {
    filtered = filtered.filter((r) => ads.includes(resolvedAdCode(r)))
  }
  if (channels.length > 0) {
    filtered = filtered.filter((r) =>
      channels.includes(normalizeWindsorChannel(r.datasource, r.source)),
    )
  }

  return filtered
}

// ── Quality metrics types ──

export interface QualityMetrics {
  impressions: number | null
  frequency: number | null // weighted avg by impressions
  cpm: number | null       // recomputed: totalSpend / totalImpressions * 1000

  ctr: number | null       // % — link CTR for Meta, clicks CTR for Google
  linkClicks: number | null
  cpc: number | null

  landingPageViews: number | null
  costPerLpView: number | null

  thruplay: number | null
  hookRate: number | null  // video_p25 / impressions * 100
  holdRate75: number | null // video_p75 / impressions * 100
  videoP100: number | null

  hasVideoData: boolean
  hasMetaData: boolean
  hasGoogleData: boolean
  allEmpty: boolean // no meaningful quality metrics (e.g. TikTok-only)
  totalSpend: number
}

// ── Main computation ──

export function computeQualityMetrics(rows: WindsorRow[]): QualityMetrics {
  let totalSpend = 0

  let totalImpressions = 0; let hasImpressions = false
  let metaImpressions = 0; let googleImpressions = 0

  // Frequency weighted by impressions
  let freqWeighted = 0; let freqImpSum = 0; let hasFrequency = false

  // Clicks (canonical per channel)
  let metaLinkClicks = 0; let hasMetaLinkClicks = false
  let googleClicks = 0

  // LP views
  let totalLpViews = 0; let hasLpViews = false

  // Video
  let totalThruplay = 0; let hasThruplay = false
  let totalVideoP25 = 0; let hasVideoP25 = false
  let totalVideoP75 = 0; let hasVideoP75 = false
  let totalVideoP100 = 0; let hasVideoP100 = false

  for (const row of rows) {
    const ch = normalizeWindsorChannel(row.datasource, row.source)
    totalSpend += Number(row.spend) || 0

    const imp = row.impressions != null ? Number(row.impressions) : null
    if (imp !== null) {
      hasImpressions = true
      totalImpressions += imp
      if (ch === 'Meta') metaImpressions += imp
      else if (ch === 'Google') googleImpressions += imp
    }

    // Frequency (weighted avg)
    const freq = row.frequency != null ? Number(row.frequency) : null
    if (freq !== null && imp !== null && imp > 0) {
      hasFrequency = true
      freqWeighted += freq * imp
      freqImpSum += imp
    }

    // Clicks
    if (ch === 'Meta') {
      const lc = row.link_clicks != null ? Number(row.link_clicks) : null
      if (lc !== null) { hasMetaLinkClicks = true; metaLinkClicks += lc }
    } else if (ch === 'Google') {
      googleClicks += Number(row.clicks) || 0
    }

    // LP views
    const lpv = row.actions_landing_page_view != null ? Number(row.actions_landing_page_view) : null
    if (lpv !== null) { hasLpViews = true; totalLpViews += lpv }

    // Video
    const thru = row.video_thruplay_watched_actions_video_view != null ? Number(row.video_thruplay_watched_actions_video_view) : null
    if (thru !== null) { hasThruplay = true; totalThruplay += thru }

    const p25 = row.video_p25_watched_actions_video_view != null ? Number(row.video_p25_watched_actions_video_view) : null
    if (p25 !== null) { hasVideoP25 = true; totalVideoP25 += p25 }

    const p75 = row.video_p75_watched_actions_video_view != null ? Number(row.video_p75_watched_actions_video_view) : null
    if (p75 !== null) { hasVideoP75 = true; totalVideoP75 += p75 }

    const p100 = row.video_p100_watched_actions_video_view != null ? Number(row.video_p100_watched_actions_video_view) : null
    if (p100 !== null) { hasVideoP100 = true; totalVideoP100 += p100 }
  }

  const hasMetaData = metaImpressions > 0
  const hasGoogleData = googleImpressions > 0

  const impressions = hasImpressions ? totalImpressions : null
  const frequency = hasFrequency && freqImpSum > 0 ? freqWeighted / freqImpSum : null
  const cpm = impressions && impressions > 0 && totalSpend > 0
    ? (totalSpend / impressions) * 1000
    : null

  // CTR & linkClicks: choose canonical clicks per channel
  let ctr: number | null = null
  let linkClicks: number | null = null

  const totalCanonical = (hasMetaData ? metaLinkClicks : 0) + (hasGoogleData ? googleClicks : 0)

  if (hasMetaData && !hasGoogleData) {
    linkClicks = hasMetaLinkClicks ? metaLinkClicks : null
    ctr = hasMetaLinkClicks && metaImpressions > 0
      ? (metaLinkClicks / metaImpressions) * 100
      : null
  } else if (hasGoogleData && !hasMetaData) {
    linkClicks = googleClicks > 0 ? googleClicks : null
    ctr = googleImpressions > 0 ? (googleClicks / googleImpressions) * 100 : null
  } else if (hasMetaData && hasGoogleData) {
    linkClicks = totalCanonical
    ctr = impressions && impressions > 0 ? (totalCanonical / impressions) * 100 : null
  }

  const cpc = totalCanonical > 0 ? totalSpend / totalCanonical : null

  const landingPageViews = hasLpViews ? totalLpViews : null
  const costPerLpView = hasLpViews && totalLpViews > 0 ? totalSpend / totalLpViews : null

  const hasVideoData = hasVideoP25 || hasThruplay
  const thruplay = hasThruplay ? totalThruplay : null
  const hookRate = hasVideoP25 && impressions && impressions > 0
    ? (totalVideoP25 / impressions) * 100
    : null
  const holdRate75 = hasVideoP75 && impressions && impressions > 0
    ? (totalVideoP75 / impressions) * 100
    : null
  const videoP100 = hasVideoP100 ? totalVideoP100 : null

  const allEmpty =
    frequency === null && ctr === null && linkClicks === null &&
    landingPageViews === null && !hasVideoData

  return {
    impressions,
    frequency,
    cpm,
    ctr,
    linkClicks,
    cpc,
    landingPageViews,
    costPerLpView,
    thruplay,
    hookRate,
    holdRate75,
    videoP100,
    hasVideoData,
    hasMetaData,
    hasGoogleData,
    allEmpty,
    totalSpend,
  }
}

// ── Delta helpers ──

export function computeDelta(current: number | null, prev: number | null): number | null {
  if (current === null || prev === null || prev === 0) return null
  return ((current - prev) / Math.abs(prev)) * 100
}

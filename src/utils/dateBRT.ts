/** BRT = UTC-3, fixed (Brazil stopped DST in 2019) */
const BRT_OFFSET_MS = 3 * 60 * 60 * 1000

function brtNow(): Date {
  return new Date(Date.now() - BRT_OFFSET_MS)
}

/** Returns YYYY-MM-DD for today in BRT */
export function todayBRT(): string {
  return brtNow().toISOString().slice(0, 10)
}

/** Returns YYYY-MM-DD for yesterday in BRT */
export function yesterdayBRT(): string {
  const d = brtNow()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** Returns YYYY-MM-DD for n days ago in BRT */
export function daysAgoBRT(n: number): string {
  const d = brtNow()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

/** Returns { from, to } for the current month in BRT */
export function currentMonthBRT(): { from: string; to: string } {
  const d = brtNow()
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() // 0-based
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const mm = String(m + 1).padStart(2, '0')
  return {
    from: `${y}-${mm}-01`,
    to: `${y}-${mm}-${String(lastDay).padStart(2, '0')}`,
  }
}

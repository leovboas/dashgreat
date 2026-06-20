export interface GoalsConfig {
  cpmql: number       // target max CPMQL (R$) — 0 = not set
  mqls: number        // target MQL count
  sqls: number        // target SQL count
  opportunities: number
  meetings: number
  won: number         // target wins (ganhos)
}

export const DEFAULT_GOALS: GoalsConfig = {
  cpmql: 0,
  mqls: 0,
  sqls: 0,
  opportunities: 0,
  meetings: 0,
  won: 0,
}

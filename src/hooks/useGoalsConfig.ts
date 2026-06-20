import { useState, useEffect } from 'react'
import { loadRemoteSetting, saveRemoteSetting } from '../api/supabase'
import { DEFAULT_GOALS, type GoalsConfig } from '../utils/goals'

const STORAGE_KEY = 'gp_goals_config'

function loadLocal(): GoalsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_GOALS
    return { ...DEFAULT_GOALS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_GOALS
  }
}

export function useGoalsConfig() {
  const [goals, setGoals] = useState<GoalsConfig>(loadLocal)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    loadRemoteSetting<GoalsConfig>('goals_config').then((remote) => {
      if (remote) {
        const merged = { ...DEFAULT_GOALS, ...remote }
        setGoals(merged)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      }
    })
  }, [])

  async function saveGoals(next: GoalsConfig) {
    setGoals(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSyncing(true)
    await saveRemoteSetting('goals_config', next)
    setSyncing(false)
  }

  return { goals, saveGoals, syncing }
}

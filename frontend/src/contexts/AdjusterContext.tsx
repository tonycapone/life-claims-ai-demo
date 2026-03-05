import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AdjusterUser } from '../types/adjuster'

interface AdjusterContextValue {
  token: string | null
  adjuster: AdjusterUser | null
  setAuth: (token: string, adjuster: AdjusterUser) => void
  clearAuth: () => void
}

const AdjusterContext = createContext<AdjusterContextValue | null>(null)

export function AdjusterProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('adjuster_token'))
  const [adjuster, setAdjuster] = useState<AdjusterUser | null>(() => {
    try {
      const stored = localStorage.getItem('adjuster_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (token) localStorage.setItem('adjuster_token', token)
    else localStorage.removeItem('adjuster_token')
  }, [token])

  useEffect(() => {
    if (adjuster) localStorage.setItem('adjuster_user', JSON.stringify(adjuster))
    else localStorage.removeItem('adjuster_user')
  }, [adjuster])

  function setAuth(newToken: string, newAdjuster: AdjusterUser) {
    setToken(newToken)
    setAdjuster(newAdjuster)
  }

  function clearAuth() {
    setToken(null)
    setAdjuster(null)
  }

  return (
    <AdjusterContext.Provider value={{ token, adjuster, setAuth, clearAuth }}>
      {children}
    </AdjusterContext.Provider>
  )
}

export function useAdjusterContext() {
  const ctx = useContext(AdjusterContext)
  if (!ctx) throw new Error('useAdjusterContext must be used within AdjusterProvider')
  return ctx
}

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { AdjusterUser } from '../types/adjuster'

interface AdjusterContextType {
  token: string | null
  adjuster: AdjusterUser | null
  setAuth: (token: string, adjuster: AdjusterUser) => void
  logout: () => void
}

const AdjusterContext = createContext<AdjusterContextType | null>(null)

export function AdjusterProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('adjuster_token'))
  const [adjuster, setAdjuster] = useState<AdjusterUser | null>(() => {
    try { return JSON.parse(localStorage.getItem('adjuster_user') || 'null') }
    catch { return null }
  })

  const setAuth = (t: string, a: AdjusterUser) => {
    localStorage.setItem('adjuster_token', t)
    localStorage.setItem('adjuster_user', JSON.stringify(a))
    setToken(t); setAdjuster(a)
  }

  const logout = () => {
    localStorage.removeItem('adjuster_token')
    localStorage.removeItem('adjuster_user')
    setToken(null); setAdjuster(null)
  }

  return (
    <AdjusterContext.Provider value={{ token, adjuster, setAuth, logout }}>
      {children}
    </AdjusterContext.Provider>
  )
}

export function useAdjusterAuth() {
  const ctx = useContext(AdjusterContext)
  if (!ctx) throw new Error('useAdjusterAuth must be used within AdjusterProvider')
  return ctx
}

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { ClaimDraft } from '../types/claim'

interface ClaimContextType {
  draft: ClaimDraft
  setDraft: (patch: Partial<ClaimDraft>) => void
  clearDraft: () => void
}

const ClaimContext = createContext<ClaimContextType | null>(null)

const STORAGE_KEY = 'claim_draft'

export function ClaimProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<ClaimDraft>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
    catch { return {} }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  }, [draft])

  const setDraft = (patch: Partial<ClaimDraft>) =>
    setDraftState(prev => ({ ...prev, ...patch }))

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY)
    setDraftState({})
  }

  return (
    <ClaimContext.Provider value={{ draft, setDraft, clearDraft }}>
      {children}
    </ClaimContext.Provider>
  )
}

export function useClaim() {
  const ctx = useContext(ClaimContext)
  if (!ctx) throw new Error('useClaim must be used within ClaimProvider')
  return ctx
}

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { ClaimDraft } from '../types/claim'

interface ClaimContextValue {
  draft: ClaimDraft
  setDraft: (updates: Partial<ClaimDraft>) => void
  clearDraft: () => void
}

const ClaimContext = createContext<ClaimContextValue | null>(null)

const STORAGE_KEY = 'claim_draft'

export function ClaimProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<ClaimDraft>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  }, [draft])

  function setDraft(updates: Partial<ClaimDraft>) {
    setDraftState((prev) => ({ ...prev, ...updates }))
  }

  function clearDraft() {
    setDraftState({})
    localStorage.removeItem(STORAGE_KEY)
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

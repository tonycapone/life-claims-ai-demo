import { useState } from 'react'
import api from '../utils/api'
import type { Claim } from '../types/claim'
import type { AdjusterAction, ClaimQueueItem, LoginResponse, CommunicationDraft } from '../types/adjuster'

export function useAdjusterLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function login(username: string, password: string): Promise<LoginResponse | null> {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/adjuster/login', { username, password })
      return res.data
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Invalid credentials')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { login, loading, error }
}

export function useClaimQueue() {
  const [loading, setLoading] = useState(false)
  const [claims, setClaims] = useState<ClaimQueueItem[]>([])

  async function fetchQueue(filters?: { status?: string; risk_level?: string; assigned_to?: string }) {
    setLoading(true)
    try {
      const res = await api.get('/adjuster/claims', { params: filters })
      setClaims(res.data)
    } finally {
      setLoading(false)
    }
  }

  return { fetchQueue, claims, loading }
}

export function useClaimDetail() {
  const [loading, setLoading] = useState(false)
  const [claim, setClaim] = useState<Claim | null>(null)

  async function fetchClaim(id: string) {
    setLoading(true)
    try {
      const res = await api.get(`/adjuster/claims/${id}`)
      setClaim(res.data)
    } finally {
      setLoading(false)
    }
  }

  return { fetchClaim, claim, setClaim, loading }
}

export function useClaimAction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function takeAction(claimId: string, action: AdjusterAction): Promise<Claim | null> {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post(`/adjuster/claims/${claimId}/action`, action)
      return res.data
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Action failed')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { takeAction, loading, error }
}

export function useDraftCommunication() {
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState<CommunicationDraft | null>(null)

  async function fetchDraft(claimId: string, draftType: string) {
    setLoading(true)
    try {
      const res = await api.post('/adjuster/draft', { claim_id: claimId, draft_type: draftType })
      setDraft(res.data)
      return res.data
    } finally {
      setLoading(false)
    }
  }

  return { fetchDraft, draft, loading }
}

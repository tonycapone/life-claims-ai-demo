import { useState } from 'react'
import api from '../utils/api'
import type { ClaimQueueItem, LoginResponse, AdjusterAction, CommunicationDraft } from '../types/adjuster'
import type { Claim, ContestabilityAnalysis } from '../types/claim'

export function useAdjusterLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const login = async (username: string, password: string): Promise<LoginResponse | null> => {
    setLoading(true); setError(null)
    try { const { data } = await api.post('/adjuster/login', { username, password }); return data }
    catch (e: any) { setError(e.response?.data?.detail || 'Invalid credentials'); return null }
    finally { setLoading(false) }
  }
  return { login, loading, error }
}

export function useClaimQueue() {
  const [loading, setLoading] = useState(false)
  const [claims, setClaims] = useState<ClaimQueueItem[]>([])
  const fetchQueue = async (filters?: { status?: string; risk_level?: string }) => {
    setLoading(true)
    try { const { data } = await api.get('/adjuster/claims', { params: filters }); setClaims(data) }
    catch {} finally { setLoading(false) }
  }
  return { claims, fetchQueue, loading }
}

export function useClaimDetail() {
  const [loading, setLoading] = useState(false)
  const [claim, setClaim] = useState<Claim | null>(null)
  const fetchClaim = async (id: string) => {
    setLoading(true)
    try { const { data } = await api.get(`/adjuster/claims/${id}`); setClaim(data) }
    catch {} finally { setLoading(false) }
  }
  return { claim, fetchClaim, loading }
}

export function useClaimAction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const act = async (claimId: string, action: AdjusterAction): Promise<Claim | null> => {
    setLoading(true); setError(null)
    try { const { data } = await api.post(`/adjuster/claims/${claimId}/action`, action); return data }
    catch (e: any) { setError('Action failed'); return null } finally { setLoading(false) }
  }
  return { act, loading, error }
}

export function useDraftCommunication() {
  const [loading, setLoading] = useState(false)
  const draft = async (claimId: string, draftType: string): Promise<CommunicationDraft | null> => {
    setLoading(true)
    try { const { data } = await api.post('/adjuster/draft', { claim_id: claimId, draft_type: draftType }); return data }
    catch { return null } finally { setLoading(false) }
  }
  return { draft, loading }
}

export function useContestabilityAnalysis() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const analyze = async (claimId: string): Promise<ContestabilityAnalysis | null> => {
    setLoading(true); setError(null)
    try {
      const { data } = await api.post(`/adjuster/claims/${claimId}/contestability`)
      return data
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Contestability analysis failed')
      return null
    } finally { setLoading(false) }
  }
  return { analyze, loading, error }
}

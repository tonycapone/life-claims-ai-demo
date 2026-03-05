import { useState } from 'react'
import api from '../utils/api'
import type { Claim, ClaimDraft } from '../types/claim'
import type { PolicyLookupResult } from '../types/policy'

export function usePolicyLookup() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lookup = async (p: { policy_number?: string; insured_name?: string; insured_dob?: string; insured_ssn_last4?: string }): Promise<PolicyLookupResult | null> => {
    setLoading(true); setError(null)
    try { const { data } = await api.post('/claims/lookup', p); return data }
    catch (e: any) { setError(e.response?.data?.detail || 'Policy not found'); return null }
    finally { setLoading(false) }
  }
  return { lookup, loading, error }
}

export function useCreateClaim() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const create = async (draft: Partial<ClaimDraft>): Promise<Claim | null> => {
    setLoading(true); setError(null)
    try { const { data } = await api.post('/claims', draft); return data }
    catch (e: any) { setError(e.response?.data?.detail || 'Failed'); return null }
    finally { setLoading(false) }
  }
  return { create, loading, error }
}

export function useUpdateClaim() {
  const [loading, setLoading] = useState(false)
  const update = async (id: string, patch: Partial<ClaimDraft>): Promise<Claim | null> => {
    setLoading(true)
    try { const { data } = await api.put(`/claims/${id}`, patch); return data }
    catch { return null } finally { setLoading(false) }
  }
  return { update, loading }
}

export function useSubmitClaim() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submit = async (claimId: string): Promise<Claim | null> => {
    setLoading(true); setError(null)
    try { const { data } = await api.post(`/claims/${claimId}/submit`); return data }
    catch (e: any) { setError(e.response?.data?.detail || 'Failed'); return null }
    finally { setLoading(false) }
  }
  return { submit, loading, error }
}

export function useClaimStatus() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const check = async (claimNumber: string, email: string): Promise<Claim | null> => {
    setLoading(true); setError(null)
    try { const { data } = await api.get('/claims/status', { params: { claim_number: claimNumber, email } }); return data }
    catch (e: any) { setError(e.response?.data?.detail || 'Not found'); return null }
    finally { setLoading(false) }
  }
  return { check, loading, error }
}

export function useUploadDocument() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const upload = async (claimId: string, file: File): Promise<any> => {
    setLoading(true); setError(null)
    try {
      const form = new FormData(); form.append('file', file)
      const { data } = await api.post(`/claims/${claimId}/documents`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      return data
    } catch (e: any) { setError('Upload failed'); return null } finally { setLoading(false) }
  }
  return { upload, loading, error }
}

export function useVerifyIdentity() {
  const [loading, setLoading] = useState(false)
  const verify = async (claimId: string): Promise<boolean> => {
    setLoading(true)
    try { await api.post(`/claims/${claimId}/verify`); return true }
    catch { return false } finally { setLoading(false) }
  }
  return { verify, loading }
}

import { useState } from 'react'
import api from '../utils/api'
import type { Claim, ClaimDraft } from '../types/claim'

export function usePolicyLookup() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function lookup(params: { policy_number?: string; insured_name?: string; insured_dob?: string; insured_ssn_last4?: string }) {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/claims/lookup', params)
      return res.data
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Policy not found'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { lookup, loading, error }
}

export function useCreateClaim() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createClaim(draft: Partial<ClaimDraft>): Promise<Claim | null> {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/claims', draft)
      return res.data
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to create claim')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createClaim, loading, error }
}

export function useUpdateClaim() {
  const [loading, setLoading] = useState(false)

  async function updateClaim(id: string, data: Partial<ClaimDraft>): Promise<Claim | null> {
    setLoading(true)
    try {
      const res = await api.put(`/claims/${id}`, data)
      return res.data
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }

  return { updateClaim, loading }
}

export function useSubmitClaim() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitClaim(id: string): Promise<Claim | null> {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post(`/claims/${id}/submit`)
      return res.data
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to submit claim')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { submitClaim, loading, error }
}

export function useClaimStatus() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function getStatus(claimNumber: string, email: string): Promise<Claim | null> {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/claims/status', { params: { claim_number: claimNumber, email } })
      return res.data
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Claim not found')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { getStatus, loading, error }
}

export function useDocumentUpload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function uploadDocument(claimId: string, file: File) {
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post(`/claims/${claimId}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Upload failed')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { uploadDocument, loading, error }
}

export function useIdentityVerify() {
  const [loading, setLoading] = useState(false)

  async function verify(claimId: string) {
    setLoading(true)
    try {
      const res = await api.post(`/claims/${claimId}/verify`)
      return res.data
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }

  return { verify, loading }
}

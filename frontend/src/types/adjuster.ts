import type { Claim, RiskLevel } from './claim'

export type ActionType = 'approve' | 'deny' | 'escalate' | 'request_docs' | 'assign'

export interface AdjusterAction {
  action: ActionType
  notes?: string
  document_type?: string  // for request_docs
  assignee?: string       // for assign
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface CommunicationDraft {
  subject: string
  body: string
  type: 'acknowledgment' | 'document_request' | 'status_update' | 'approval' | 'denial' | 'medical_records_request'
}

export interface ClaimQueueItem {
  id: string
  claim_number: string
  beneficiary_name: string
  insured_name: string
  face_amount: number
  submitted_at: string
  policy_age_months: number
  status: Claim['status']
  risk_level?: RiskLevel
  contestability_alert: boolean
  assigned_adjuster?: string
  days_open: number
}

export interface AdjusterUser {
  username: string
  full_name: string
  email: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  adjuster: AdjusterUser
}

export type ClaimStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'pending_documents'
  | 'contestability_review'
  | 'siu_review'
  | 'approved'
  | 'paid'
  | 'denied'

export type RiskLevel = 'low' | 'medium' | 'high'

export type MannerOfDeath = 'natural' | 'accident' | 'undetermined'

export type PayoutMethod = 'lump_sum' | 'structured'

export interface ClaimDocument {
  id: string
  type: 'death_certificate' | 'beneficiary_id' | 'medical_records' | 'other'
  filename: string
  uploaded_at: string
  extracted_data?: DeathCertificateExtraction
}

export interface DeathCertificateExtraction {
  deceased_name?: string
  date_of_death?: string
  cause_of_death?: string
  manner_of_death?: string
  certifying_physician?: string
  jurisdiction?: string
  certificate_number?: string
}

export interface ContestabilityDiscrepancy {
  application_question: string
  applicant_answer: string
  medical_finding: string
  source_date: string
  severity: 'material' | 'minor'
  assessment: string
}

export interface ContestabilityAnalysis {
  discrepancies: ContestabilityDiscrepancy[]
  summary: string
  recommendation: string
  materiality_assessment: string
}

export interface Claim {
  id: string
  claim_number: string
  policy_number: string
  insured_name: string
  insured_dob?: string
  policy_issue_date?: string
  face_amount?: number
  beneficiary_name?: string
  beneficiary_email?: string
  beneficiary_phone?: string
  beneficiary_relationship?: string
  identity_verified: boolean
  date_of_death?: string
  cause_of_death?: string
  manner_of_death?: string
  death_certificate_extracted?: Record<string, string> | null
  payout_method?: PayoutMethod
  status: ClaimStatus
  risk_level?: RiskLevel
  risk_flags?: string[]
  contestability_alert: boolean
  contestability_analysis?: ContestabilityAnalysis | null
  months_since_issue?: number
  ai_summary?: string
  jurisdiction_state?: string
  assigned_adjuster?: string
  adjuster_notes?: string
  created_at: string
  updated_at?: string
}

export interface FNOLMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  widget?: 'policy_confirm' | 'review' | 'upload_cert'
}

// Draft claim state stored in ClaimContext across multi-step form
export interface ClaimDraft {
  policy_number?: string
  insured_name?: string
  insured_dob?: string
  insured_ssn_last4?: string
  beneficiary_name?: string
  beneficiary_email?: string
  beneficiary_phone?: string
  beneficiary_relationship?: string
  date_of_death?: string
  cause_of_death?: string
  manner_of_death?: MannerOfDeath
  death_in_us?: boolean
  payout_method?: PayoutMethod
  bank_routing?: string
  bank_account?: string
  bank_account_type?: 'checking' | 'savings'
  claim_id?: string
  claim_number?: string
  current_step?: number
  policy_verified?: boolean
  death_certificate_uploaded?: boolean
  death_certificate_skipped?: boolean
  death_certificate_extracted?: DeathCertificateExtraction
  chat_messages?: FNOLMessage[]
}

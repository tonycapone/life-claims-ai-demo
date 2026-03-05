export type PolicyType = 'term' | 'final_expense' | 'iul'
export type PolicyStatus = 'in_force' | 'lapsed' | 'cancelled'

export interface Beneficiary {
  name: string
  relationship: string
  percentage: number
}

export interface Policy {
  id: string
  policy_number: string
  insured_name: string
  insured_dob: string
  face_amount: number
  issue_date: string
  policy_type: PolicyType
  status: PolicyStatus
  beneficiaries: Beneficiary[]
}

export interface PolicyLookupResult {
  found: boolean
  policy_number?: string
  insured_name_masked?: string  // "J*** S*****"
  policy_type?: PolicyType
  status?: PolicyStatus
}

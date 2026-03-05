import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import PolicyLookup from './pages/PolicyLookup'
import BeneficiaryInfo from './pages/BeneficiaryInfo'
import DeathInfo from './pages/DeathInfo'
import DocumentUpload from './pages/DocumentUpload'
import IdentityVerify from './pages/IdentityVerify'
import PayoutPrefs from './pages/PayoutPrefs'
import ReviewSubmit from './pages/ReviewSubmit'
import Confirmation from './pages/Confirmation'
import ClaimStatus from './pages/ClaimStatus'
import AdjusterLogin from './pages/adjuster/Login'
import Queue from './pages/adjuster/Queue'
import ClaimDetail from './pages/adjuster/ClaimDetail'
import { useAdjusterContext } from './contexts/AdjusterContext'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAdjusterContext()
  if (!token) return <Navigate to="/adjuster/login" replace />
  return <>{children}</>
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/claim/lookup" element={<PolicyLookup />} />
        <Route path="/claim/beneficiary" element={<BeneficiaryInfo />} />
        <Route path="/claim/death-info" element={<DeathInfo />} />
        <Route path="/claim/documents" element={<DocumentUpload />} />
        <Route path="/claim/verify" element={<IdentityVerify />} />
        <Route path="/claim/payout" element={<PayoutPrefs />} />
        <Route path="/claim/review" element={<ReviewSubmit />} />
        <Route path="/claim/confirmation" element={<Confirmation />} />
        <Route path="/claim/status" element={<ClaimStatus />} />
        <Route path="/adjuster" element={<Navigate to="/adjuster/login" replace />} />
        <Route path="/adjuster/login" element={<AdjusterLogin />} />
        <Route path="/adjuster/queue" element={<RequireAuth><Queue /></RequireAuth>} />
        <Route path="/adjuster/claims/:id" element={<RequireAuth><ClaimDetail /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}

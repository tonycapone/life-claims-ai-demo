import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DemoScriptOverlay from './components/DemoScriptOverlay'
import DemoLanding from './pages/DemoLanding'
import PolicyLookup from './pages/PolicyLookup'
import BeneficiaryInfo from './pages/BeneficiaryInfo'
import DeathInfo from './pages/DeathInfo'
import DocumentUpload from './pages/DocumentUpload'
import IdentityVerify from './pages/IdentityVerify'
import PayoutPrefs from './pages/PayoutPrefs'
import ReviewSubmit from './pages/ReviewSubmit'
import Confirmation from './pages/Confirmation'
import FNOLChat from './pages/FNOLChat'
import ClaimStatus from './pages/ClaimStatus'
import AdjusterLogin from './pages/adjuster/AdjusterLogin'
import AdjusterQueue from './pages/adjuster/AdjusterQueue'
import AdjusterClaimDetail from './pages/adjuster/AdjusterClaimDetail'
import CarrierLogin from './pages/carrier/CarrierLogin'
import CarrierHome from './pages/carrier/CarrierHome'
import CarrierChat from './pages/carrier/CarrierChat'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <DemoScriptOverlay />
      <Routes>
        <Route path="/" element={<DemoLanding />} />
        <Route path="/claim/chat" element={<FNOLChat />} />
        <Route path="/claim/lookup" element={<PolicyLookup />} />
        <Route path="/claim/beneficiary" element={<BeneficiaryInfo />} />
        <Route path="/claim/death-info" element={<DeathInfo />} />
        <Route path="/claim/documents" element={<DocumentUpload />} />
        <Route path="/claim/verify" element={<IdentityVerify />} />
        <Route path="/claim/payout" element={<PayoutPrefs />} />
        <Route path="/claim/review" element={<ReviewSubmit />} />
        <Route path="/claim/confirmation" element={<Confirmation />} />
        <Route path="/claim/status" element={<ClaimStatus />} />
        <Route path="/carrier" element={<Navigate to="/carrier/login" replace />} />
        <Route path="/carrier/login" element={<CarrierLogin />} />
        <Route path="/carrier/home" element={<CarrierHome />} />
        <Route path="/carrier/chat" element={<CarrierChat />} />
        <Route path="/adjuster" element={<Navigate to="/adjuster/login" replace />} />
        <Route path="/adjuster/login" element={<AdjusterLogin />} />
        <Route path="/adjuster/queue" element={<AdjusterQueue />} />
        <Route path="/adjuster/claims/:id" element={<AdjusterClaimDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

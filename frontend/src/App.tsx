import { Toaster } from 'react-hot-toast'
import { ClaimProvider } from './contexts/ClaimContext'
import { AdjusterProvider } from './contexts/AdjusterContext'
import AppRoutes from './AppRoutes'

export default function App() {
  return (
    <ClaimProvider>
      <AdjusterProvider>
        <AppRoutes />
        <Toaster position="top-center" />
      </AdjusterProvider>
    </ClaimProvider>
  )
}

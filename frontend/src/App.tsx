import { ClaimProvider } from './contexts/ClaimContext'
import { AdjusterProvider } from './contexts/AdjusterContext'
import AppRoutes from './AppRoutes'

export default function App() {
  return (
    <ClaimProvider>
      <AdjusterProvider>
        <AppRoutes />
      </AdjusterProvider>
    </ClaimProvider>
  )
}

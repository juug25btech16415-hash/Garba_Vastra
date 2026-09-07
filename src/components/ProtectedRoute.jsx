import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const ADMIN_EMAIL = 'vritika110@gmail.com'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm font-medium text-ink/50 animate-pulse">Verifying authorization…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate replace to="/admin/login" />
  }

  if (user.email !== ADMIN_EMAIL) {
    return <Navigate replace to="/" />
  }

  return children ? children : <Outlet />
}

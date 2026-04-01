import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import { Spinner } from '../ui/index.jsx'

export default function AppLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d1a' }}>
        <Spinner />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0d0d1a', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  )
}
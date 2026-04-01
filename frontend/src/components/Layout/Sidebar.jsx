import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui/index.jsx'

const NAV = [
  { to: '/dashboard',   icon: '⊞', label: 'Dashboard',    adminOnly: false },
  { to: '/employees',   icon: '👥', label: 'Employés',     adminOnly: false },
  { to: '/attendance',  icon: '📅', label: 'Présences',    adminOnly: false },
  { to: '/payroll',     icon: '💳', label: 'Paie',         adminOnly: false },
  { to: '/recruitment', icon: '🎯', label: 'Recrutement',  adminOnly: false },
  { to: '/users',       icon: '🔑', label: 'Utilisateurs', adminOnly: true  },
]

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth()

  return (
    <aside style={{
      width: 230, minHeight: '100vh',
      background: '#0a0a16',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      padding: '24px 0', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 20px 28px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        marginBottom: 12,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'linear-gradient(135deg,#a78bfa,#818cf8)' }} />
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: 0.5 }}>Optimize HRM</span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1 }}>
        {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 20px', textDecoration: 'none',
              color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.5)',
              background: isActive ? 'rgba(120,60,200,0.15)' : 'transparent',
              borderRight: isActive ? '2px solid #a78bfa' : '2px solid transparent',
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 16 }}>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      {/* User info + Logout */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        marginTop: 12,
      }}>
        <Avatar name={`${user?.first_name || ''} ${user?.last_name || ''}`} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.first_name || user?.email}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase' }}>
            {user?.role}
          </div>
        </div>
        <button
          onClick={logout}
          title="Déconnexion"
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}
        >⇥</button>
      </div>
    </aside>
  )
}
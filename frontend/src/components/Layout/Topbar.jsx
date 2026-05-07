import React from 'react';  // ← Ajoutez ceci
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
// ... reste du code
const Topbar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path) => {
    if (path === '/attendance') {
      return location.pathname.startsWith('/attendance') || location.pathname.startsWith('/leave')
    }
    return location.pathname === path
  }

  const navItems = [
    { path: '/dashboard', label: '📊 Dashboard', icon: '📊' },
    { path: '/employees', label: '👥 Employés', icon: '👥' },
    { 
      path: '/attendance', 
      label: '🕐 Présences', 
      icon: '🕐',
      submenu: [
        { path: '/attendance', label: '📅 Pointage', icon: '⏰' },
        { path: '/leave/request', label: '🏖️ Demander congé', icon: '✏️' },
        { path: '/leave/list', label: '📋 Mes congés', icon: '📋' },
        { path: '/leave/calendar', label: '📆 Calendrier', icon: '📆' },
      ]
    },
    { path: '/payroll', label: '💰 Paie', icon: '💰' },
    { path: '/recruitment', label: '🎯 Recrutement', icon: '🎯' },
    { path: '/users', label: '👤 Utilisateurs', icon: '👤' },
  ]

  const [openSubmenu, setOpenSubmenu] = useState(null)

  return (
    <>
      {/* Topbar fixe */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        background: '#0a0a0f',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        zIndex: 100,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '28px' }}>🏢</div>
          <div style={{ fontWeight: 700, fontSize: '18px', color: '#fff' }}>
            RH Management
          </div>
        </div>

        {/* Navigation desktop */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {navItems.map((item) => (
            <div key={item.path} style={{ position: 'relative' }}>
              {item.submenu ? (
                <div
                  onMouseEnter={() => setOpenSubmenu(item.path)}
                  onMouseLeave={() => setOpenSubmenu(null)}
                >
                  <Link
                    to={item.path}
                    style={{
                      padding: '8px 16px',
                      color: isActive(item.path) ? '#3b82f6' : 'rgba(255,255,255,0.7)',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      display: 'inline-block',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                  >
                    {item.label}
                  </Link>
                  
                  {/* Sous-menu */}
                  {openSubmenu === item.path && (
                    <div style={{
                      position: 'absolute',
                      top: '40px',
                      left: 0,
                      background: '#13131f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '8px 0',
                      minWidth: '200px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      zIndex: 200
                    }}>
                      {item.submenu.map((sub) => (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          style={{
                            display: 'block',
                            padding: '10px 20px',
                            color: location.pathname === sub.path ? '#3b82f6' : 'rgba(255,255,255,0.7)',
                            textDecoration: 'none',
                            fontSize: '14px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          {sub.icon} {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path}
                  style={{
                    padding: '8px 16px',
                    color: isActive(item.path) ? '#3b82f6' : 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    display: 'inline-block',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            {user?.email || 'admin@entreprise.com'}
          </div>
          <button
            onClick={logout}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '6px 12px',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Espace pour compenser la topbar fixe */}
      <div style={{ height: '64px' }} />
    </>
  )
}

export default Topbar
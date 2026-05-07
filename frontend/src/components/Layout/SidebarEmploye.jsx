import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const SidebarEmploye = () => {
  const { user, logout } = useAuth()

  // Menu pour EMPLOYÉ seulement
  const employeeMenus = [
    { path: '/dashboard', label: '📊 Mon tableau de bord', icon: '📊' },
    { 
      label: '📅 Mes présences', 
      icon: '🕐',
      isSubmenu: true,
      subItems: [
        { path: '/attendance', label: '📍 Pointer', icon: '📍' },
        { path: '/attendance/history', label: '📋 Historique', icon: '📋' },
      ]
    },
    { 
      label: '🏖️ Mes congés', 
      icon: '🏖️',
      isSubmenu: true,
      subItems: [
        { path: '/leave/request', label: '✏️ Demander', icon: '✏️' },
        { path: '/leave/list', label: '📋 Mes demandes', icon: '📋' },
        { path: '/leave/calendar', label: '📆 Calendrier', icon: '📆' },
      ]
    },
    { path: '/payroll/employee', label: '💰 Ma paie', icon: '💰' },
    { path: '/recruitment/employee', label: '🎯 Offres internes', icon: '🎯' },
  ]

  const SubmenuItem = ({ item }) => {
    const [open, setOpen] = useState(false)

    return (
      <div style={{ marginBottom: '4px' }}>
        <div
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderRadius: '10px',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)',
            transition: 'all 0.2s',
            fontSize: '14px',
            fontWeight: 500
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
          <span style={{ fontSize: '12px', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            ▶
          </span>
        </div>
        
        {open && (
          <div style={{ marginLeft: '28px', marginTop: '4px' }}>
            {item.subItems.map((subItem) => (
              <NavLink
                key={subItem.path}
                to={subItem.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 16px',
                  marginBottom: '2px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                  color: isActive ? '#3b82f6' : 'rgba(255,255,255,0.6)',
                  textDecoration: 'none',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                })}
              >
                <span style={{ fontSize: '14px' }}>{subItem.icon}</span>
                <span>{subItem.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside style={{
      width: '280px',
      background: '#0a0a12',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto'
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '32px' }}>🏢</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '18px', color: '#fff' }}>RH Management</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Portail Employé</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0 16px' }}>
        {employeeMenus.map((item, index) => (
          item.isSubmenu ? (
            <SubmenuItem key={index} item={item} />
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                marginBottom: '4px',
                borderRadius: '10px',
                background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: isActive ? '#3b82f6' : 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                transition: 'all 0.2s',
                fontSize: '14px',
                fontWeight: 500
              })}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          )
        ))}
      </nav>

      {/* Footer avec informations utilisateur et déconnexion */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        marginTop: 'auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          marginBottom: '12px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'rgba(59,130,246,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            👤
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
              {user?.first_name || user?.email?.split('@')[0] || 'Employé'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              Employé
            </div>
          </div>
        </div>
        
        <button
          onClick={logout}
          style={{
            width: '100%',
            padding: '10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(239,68,68,0.15)'
            e.target.style.color = '#ef4444'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.05)'
            e.target.style.color = 'rgba(255,255,255,0.7)'
          }}
        >
          🚪 Déconnexion
        </button>
      </div>
    </aside>
  )
}

export default SidebarEmploye
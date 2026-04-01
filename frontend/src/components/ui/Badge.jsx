const VARIANTS = {
  active:     { bg: 'rgba(29,158,117,0.15)', color: '#1d9e75',  label: 'Actif'     },
  inactive:   { bg: 'rgba(100,100,100,0.15)',color: '#888',     label: 'Inactif'   },
  on_leave:   { bg: 'rgba(232,164,48,0.15)', color: '#e8a430',  label: 'Congé'     },
  terminated: { bg: 'rgba(232,93,36,0.15)',  color: '#e85d24',  label: 'Archivé'   },
  admin:      { bg: 'rgba(167,139,250,0.15)',color: '#a78bfa',  label: 'Admin'     },
  manager:    { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6',  label: 'Manager'   },
  employee:   { bg: 'rgba(100,100,100,0.15)',color: '#9ca3af',  label: 'Employé'   },
  cdi:        { bg: 'rgba(29,158,117,0.15)', color: '#1d9e75',  label: 'CDI'       },
  cdd:        { bg: 'rgba(232,164,48,0.15)', color: '#e8a430',  label: 'CDD'       },
  stage:      { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6',  label: 'Stage'     },
  freelance:  { bg: 'rgba(167,139,250,0.15)',color: '#a78bfa',  label: 'Freelance' },
}

export default function Badge({ type, custom }) {
  const v = VARIANTS[type] || {
    bg: 'rgba(100,100,100,0.15)', color: '#888', label: custom || type
  }
  return (
    <span style={{
      background: v.bg, color: v.color,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
      textTransform: 'uppercase', letterSpacing: '0.5px',
    }}>
      {v.label}
    </span>
  )
}
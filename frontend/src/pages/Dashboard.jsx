import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { employeesApi } from '../api/employeesApi'
import { useAuth } from '../context/AuthContext'
import { Card, Spinner } from '../components/ui/index.jsx'

const COLORS = ['#7c5cbf', '#1d9e75', '#e8a430', '#3b82f6', '#e85d24', '#a78bfa']

export default function Dashboard() {
  const { user, isAdmin, isManager } = useAuth()
  const navigate = useNavigate()

  // If user is employee (not admin or manager), redirect to attendance
  useEffect(() => {
    if (!isAdmin && !isManager) {
      navigate('/attendance', { replace: true })
    }
  }, [isAdmin, isManager, navigate])

  // If still loading or redirecting, show nothing or spinner
  if (!isAdmin && !isManager) {
    return <Spinner />
  }

  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    employeesApi.getStats()
      .then(({ data }) => setStats(data))
      .catch(() => setError('Impossible de charger les statistiques.'))
      .finally(() => setLoading(false))
  }, [])

  const kpis = [
    { label: 'Total employés',   value: stats?.total,        icon: '👥', color: '#7c5cbf' },
    { label: 'Actifs',           value: stats?.active,       icon: '✅', color: '#1d9e75' },
    { label: 'En congé',         value: stats?.on_leave,     icon: '🌴', color: '#e8a430' },
    { label: 'Nouvelles recrues', value: stats?.recent_hires, icon: '🎉', color: '#3b82f6', sub: '30 derniers jours' },
  ]

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>
          Tableau de bord
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '6px 0 0' }}>
          Bonjour, {user?.first_name || user?.email} — voici l'aperçu RH du jour.
        </p>
      </div>

      {loading && <Spinner />}
      {error   && <p style={{ color: '#f87171' }}>{error}</p>}

      {stats && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16, marginBottom: 28 }}>
            {kpis.map((k) => (
              <div
                key={k.label}
                style={{
                  background: '#13131f',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderLeft: `3px solid ${k.color}`,
                  borderRadius: 12, padding: '20px 22px',
                  display: 'flex', alignItems: 'center', gap: 16,
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/employees')}
              >
                <span style={{ fontSize: 28 }}>{k.icon}</span>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                    {k.value ?? '—'}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{k.label}</div>
                  {k.sub && <div style={{ fontSize: 11, color: k.color, marginTop: 2 }}>{k.sub}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Graphiques côte à côte */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

            {/* Bar chart — départements */}
            <Card>
              <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: '0 0 20px' }}>
                Employés par département
              </h3>
              {stats.by_department?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.by_department} margin={{ left: -20 }}>
                    <XAxis
                      dataKey="department"
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                      axisLine={false} tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    />
                    <Bar dataKey="count" fill="#7c5cbf" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 40 }}>Aucune donnée</p>
              )}
            </Card>

            {/* Pie chart — contrats */}
            <Card>
              <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: '0 0 20px' }}>
                Répartition par contrat
              </h3>
              {stats.by_contract?.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <ResponsiveContainer width="60%" height={180}>
                    <PieChart>
                      <Pie
                        data={stats.by_contract}
                        dataKey="count"
                        nameKey="contract_type"
                        cx="50%" cy="50%"
                        innerRadius={45} outerRadius={75}
                        paddingAngle={3}
                      >
                        {stats.by_contract.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1 }}>
                    {stats.by_contract.map((c, i) => (
                      <div key={c.contract_type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, textTransform: 'uppercase' }}>{c.contract_type}</span>
                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, marginLeft: 'auto' }}>{c.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 40 }}>Aucune donnée</p>
              )}
            </Card>
          </div>

          {/* Barre de progression par département */}
          <Card>
            <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: '0 0 20px' }}>
              Répartition détaillée des effectifs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {stats.by_department?.map((d, i) => {
                const pct = stats.total > 0 ? Math.round((d.count / stats.total) * 100) : 0
                return (
                  <div key={d.department}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{d.department}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                        {d.count} employé{d.count > 1 ? 's' : ''} — {pct}%
                      </span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6 }}>
                      <div style={{
                        background: COLORS[i % COLORS.length],
                        borderRadius: 4, height: '100%',
                        width: `${pct}%`, transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
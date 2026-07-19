import { useState, useEffect, useCallback } from 'react'
import { attendanceApi } from '../../api/attendanceApi'
import { employeesApi } from '../../api/employeesApi'
import { useAuth } from '../../context/AuthContext'
import LeaveSection from './LeaveSection.jsx'
import { Card, Spinner } from '../../components/ui/index.jsx'

// Styles réutilisables (déclarés avant utilisation)
const TD = { padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: 13, verticalAlign: 'middle' }
const FILTER_STYLE = {
  background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 12,
}

const STATUS_LABELS = {
  present:  { label: 'Présent',    color: '#1d9e75' },
  absent:   { label: 'Absent',     color: '#e85d24' },
  late:     { label: 'En retard',  color: '#e8a430' },
  half_day: { label: 'Mi-journée', color: '#3b82f6' },
  holiday:  { label: 'Congé',      color: '#a78bfa' },
}

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || { label: status, color: '#888' }
  return (
    <span style={{
      background: s.color + '25', color: s.color,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    }}>{s.label}</span>
  )
}

// Utilitaires pour convertir mois/année en dates
function getDateRange(month, year) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0) // dernier jour du mois
  return {
    date_from: start.toISOString().split('T')[0],
    date_to: end.toISOString().split('T')[0],
  }
}

// ── Vue admin : pointages du jour avec filtre employé ──────────────────────
function TodayAdminView({ refresh }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterEmpId, setFilterEmpId] = useState('')
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    employeesApi.getAll({ limit: 500, status: 'active' })
      .then(({ data }) => setEmployees(data.employees || []))
      .catch(() => {})
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    attendanceApi.getToday({ employee_id: filterEmpId || undefined })
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filterEmpId])

  useEffect(() => {
    load()
  }, [load, refresh])

  if (loading) return <Spinner />
  if (!data) return null

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ color: '#fff', margin: 0, fontSize: 14, fontWeight: 600 }}>
          Présences aujourd'hui — {new Date().toLocaleDateString('fr-FR')}
        </h3>
        <select
          value={filterEmpId}
          onChange={(e) => setFilterEmpId(e.target.value)}
          style={FILTER_STYLE}
        >
          <option value="">Tous les employés</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.full_name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Présents', value: data.present, color: '#1d9e75' },
          { label: 'Absents',  value: data.absent,  color: '#e85d24' },
          { label: 'En retard', value: data.late,   color: '#e8a430' },
        ].map((k) => (
          <div key={k.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '14px', textAlign: 'center' }}>
            <div style={{ color: k.color, fontSize: 24, fontWeight: 700 }}>{k.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {data.records.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Employé', 'Arrivée', 'Départ', 'Durée', 'Statut'].map(h => (
                <th key={h} style={{ padding: '0 12px 10px', color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.records.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={TD}>{r.employee_name || '—'}</td>
                <td style={TD}>{r.check_in ? new Date(r.check_in).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) : '—'}</td>
                <td style={TD}>{r.check_out ? new Date(r.check_out).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) : '—'}</td>
                <td style={TD}>{r.duration ? `${r.duration}h` : '—'}</td>
                <td style={TD}><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 20 }}>Aucun pointage aujourd'hui.</p>
      )}
    </Card>
  )
}

// ── Historique mensuel avec filtre employé ─────────────────────────────────
function MonthlyHistory() {
  const [records, setRecords] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [employeeId, setEmployeeId] = useState('')
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    employeesApi.getAll({ limit: 500, status: 'active' })
      .then(({ data }) => setEmployees(data.employees))
      .catch(() => {})
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    const { date_from, date_to } = getDateRange(month, year)
    Promise.all([
      attendanceApi.getAll({ date_from, date_to, employee_id: employeeId || undefined, limit: 100 }),
      attendanceApi.getStats({ month, year, employee_id: employeeId || undefined }),
    ])
      .then(([{ data: a }, { data: s }]) => {
        setRecords(a.records)
        setStats(s)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [month, year, employeeId])

  useEffect(() => { load() }, [load])

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ color: '#fff', margin: 0, fontSize: 14, fontWeight: 600 }}>Historique mensuel</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={FILTER_STYLE}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('fr', { month: 'long' })}</option>
            ))}
          </select>
          <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ width: 80, ...FILTER_STYLE }} />
          <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} style={FILTER_STYLE}>
            <option value="">Tous les employés</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Jours présents', value: stats.present, color: '#1d9e75' },
            { label: 'Absences',       value: stats.absent,  color: '#e85d24' },
            { label: 'Retards',        value: stats.late,    color: '#e8a430' },
            { label: 'Heures totales', value: `${stats.total_hours}h`, color: '#a78bfa' },
          ].map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ color: k.color, fontSize: 20, fontWeight: 700 }}>{k.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? <Spinner /> : records.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 20 }}>Aucun enregistrement pour cette période.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Employé', 'Date', 'Arrivée', 'Départ', 'Durée', 'Statut'].map(h => (
                <th key={h} style={{ padding: '0 12px 10px', color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={TD}>{r.employee_name}</td>
                <td style={TD}>{new Date(r.date).toLocaleDateString('fr-FR')}</td>
                <td style={TD}>{r.check_in ? new Date(r.check_in).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) : '—'}</td>
                <td style={TD}>{r.check_out ? new Date(r.check_out).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) : '—'}</td>
                <td style={TD}>{r.duration ? `${r.duration}h` : '—'}</td>
                <td style={TD}><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

// ── Page principale (réservée admin/manager) ───────────────────────────────
export default function AttendancePage() {
  const { isAdmin, isManager } = useAuth()
  const [tab, setTab] = useState('today')
  const [refresh, setRefresh] = useState(0)

  if (!isAdmin && !isManager) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#fff' }}>
        <h3>Accès non autorisé</h3>
        <p>Cette page est réservée aux administrateurs et managers.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200 }}>
      <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Présences & Congés</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 28 }}>
        Gérez les pointages, l'historique et les demandes de congé.
      </p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[
          { id: 'today',   label: '📅 Pointages du jour' },
          { id: 'history', label: '📊 Historique mensuel' },
          { id: 'leaves',  label: '🌴 Congés' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '9px 20px', borderRadius: 8, border: 'none',
              background: tab === t.id ? 'rgba(120,60,200,0.35)' : 'transparent',
              color: tab === t.id ? '#a78bfa' : 'rgba(255,255,255,0.5)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'today'   && <TodayAdminView refresh={refresh} />}
      {tab === 'history' && <MonthlyHistory />}
      {tab === 'leaves'  && <LeaveSection />}
    </div>
  )
}

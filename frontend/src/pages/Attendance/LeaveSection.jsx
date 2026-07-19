import { useState, useEffect, useCallback } from 'react'
import { attendanceApi } from '../../api/attendanceApi'
import { employeesApi } from '../../api/employeesApi'
import { Card, Button, Input, Select, Modal, ErrorBanner, Spinner } from '../../components/ui/index.jsx'

const TYPE_OPTIONS = [
  { value: 'annual', label: 'Congé annuel' },
  { value: 'sick', label: 'Congé maladie' },
  { value: 'exceptional', label: 'Congé exceptionnel' },
  { value: 'unpaid', label: 'Sans solde' },
  { value: 'maternity', label: 'Maternité' },
  { value: 'other', label: 'Autre' },
]

const TYPE_LABELS = Object.fromEntries(TYPE_OPTIONS.map(o => [o.value, o.label]))

const STATUS_STYLE = {
  pending:   { color: '#e8a430', bg: 'rgba(232,164,48,0.15)', label: 'En attente' },
  approved:  { color: '#1d9e75', bg: 'rgba(29,158,117,0.15)', label: 'Approuvé' },
  rejected:  { color: '#f87171', bg: 'rgba(232,93,36,0.15)',  label: 'Rejeté' },
  cancelled: { color: '#888',    bg: 'rgba(100,100,100,0.15)', label: 'Annulé' },
}

// ── Formulaire de création pour admin ──────────────────────────────────────
function AdminLeaveForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    employee_id: '',
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
  })
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    employeesApi.getAll({ limit: 500, status: 'active' })
      .then(({ data }) => setEmployees(data.employees || []))
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!form.employee_id || !form.start_date || !form.end_date) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    setLoading(true); setError('')
    try {
      await attendanceApi.createLeave(form) // L'API accepte employee_id pour admin
      onCreated()
    } catch (e) {
      const d = e.response?.data
      setError(typeof d === 'object' ? Object.values(d).flat().join(' | ') : 'Erreur.')
    } finally { setLoading(false) }
  }

  return (
    <Modal title="Ajouter une demande de congé (admin)" onClose={onClose} width={520}>
      <ErrorBanner message={error} />
      <Select
        label="Employé *"
        value={form.employee_id}
        onChange={(e) => setForm(p => ({ ...p, employee_id: e.target.value }))}
        options={employees.map(e => ({ value: e.id, label: `${e.full_name} (${e.employee_id})` }))}
      />
      <Select
        label="Type de congé"
        value={form.leave_type}
        onChange={(e) => setForm(p => ({ ...p, leave_type: e.target.value }))}
        options={TYPE_OPTIONS}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Input label="Date de début *" type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
        <Input label="Date de fin *"   type="date" value={form.end_date}   onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
      </div>
      <Input label="Motif" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Optionnel" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} loading={loading}>Créer la demande</Button>
      </div>
    </Modal>
  )
}

// ── Modal de décision ──────────────────────────────────────────────────────
function DecisionModal({ leave, onClose, onDecided }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const decide = async (decision) => {
    if (decision === 'rejected' && !reason.trim()) {
      setError('Le motif de rejet est obligatoire.')
      return
    }
    setLoading(true); setError('')
    try {
      await attendanceApi.decideLeave(leave.id, { decision, rejection_reason: reason })
      onDecided()
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur.')
    } finally { setLoading(false) }
  }

  return (
    <Modal title={`Décision — ${leave.employee_name}`} onClose={onClose} width={480}>
      <ErrorBanner message={error} />
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 8 }}>Détails</div>
        {[
          ['Type', TYPE_LABELS[leave.leave_type]],
          ['Période', `${new Date(leave.start_date).toLocaleDateString('fr-FR')} → ${new Date(leave.end_date).toLocaleDateString('fr-FR')}`],
          ['Durée', `${leave.days_count} jour(s)`],
          ['Motif', leave.reason || '—'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{k}</span>
            <span style={{ color: '#fff', fontSize: 13 }}>{v}</span>
          </div>
        ))}
      </div>
      <Input label="Motif de rejet" value={reason} onChange={e => setReason(e.target.value)} placeholder="Obligatoire si rejet" />
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <Button onClick={() => decide('approved')} loading={loading} style={{ flex: 1, background: 'linear-gradient(135deg,#1d9e75,#0f6e56)' }}>✓ Approuver</Button>
        <Button onClick={() => decide('rejected')} loading={loading} variant="danger" style={{ flex: 1 }}>✕ Rejeter</Button>
      </div>
    </Modal>
  )
}

// ── Section principale (admin only) ────────────────────────────────────────
export default function LeaveSection() {
  const [leaves, setLeaves] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [decision, setDecision] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterEmployeeId, setFilterEmployeeId] = useState('')
  const [employeesList, setEmployeesList] = useState([])

  // Charger la liste des employés pour les filtres
  useEffect(() => {
    employeesApi.getAll({ limit: 500, status: 'active' })
      .then(({ data }) => setEmployeesList(data.employees || []))
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      if (filterEmployeeId) params.employee_id = filterEmployeeId
      const [{ data: l }, { data: s }] = await Promise.all([
        attendanceApi.getLeaves(params),
        attendanceApi.getLeaveSummary({ employee_id: filterEmployeeId || undefined }),
      ])
      setLeaves(l.leaves)
      setSummary(s)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [filterStatus, filterEmployeeId])

  useEffect(() => { load() }, [load])

  const handleCancel = async (id) => {
    if (!window.confirm('Annuler cette demande ?')) return
    try {
      await attendanceApi.cancelLeave(id)
      load()
    } catch { alert('Erreur lors de l\'annulation.') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Résumé congés */}
      {summary && (
        <Card>
          <h3 style={{ color: '#fff', margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>
            Solde congés {summary.year} {filterEmployeeId ? `– ${employeesList.find(e => e.id === filterEmployeeId)?.full_name || ''}` : '(tous employés)'}
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(summary.approved_days).map(([type, days]) => (
              <div key={type} style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '10px 16px' }}>
                <div style={{ color: '#a78bfa', fontSize: 18, fontWeight: 700 }}>{days}j</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{TYPE_LABELS[type]}</div>
              </div>
            ))}
            {Object.keys(summary.approved_days).length === 0 && (
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Aucun congé approuvé.</span>
            )}
            {summary.pending_count > 0 && (
              <div style={{ background: 'rgba(232,164,48,0.1)', border: '1px solid rgba(232,164,48,0.2)', borderRadius: 8, padding: '10px 16px' }}>
                <div style={{ color: '#e8a430', fontSize: 18, fontWeight: 700 }}>{summary.pending_count}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>En attente</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Liste des demandes */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ color: '#fff', margin: 0, fontSize: 14, fontWeight: 600 }}>Demandes de congé</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={FILTER_STYLE}>
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvés</option>
              <option value="rejected">Rejetés</option>
              <option value="cancelled">Annulés</option>
            </select>
            <select value={filterEmployeeId} onChange={e => setFilterEmployeeId(e.target.value)} style={FILTER_STYLE}>
              <option value="">Tous les employés</option>
              {employeesList.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
            <Button onClick={() => setShowForm(true)}>+ Nouvelle demande</Button>
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : leaves.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🌴</div>
            <p>Aucune demande de congé</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Employé', 'Type', 'Période', 'Durée', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaves.map(l => {
                const s = STATUS_STYLE[l.status] || STATUS_STYLE.cancelled
                return (
                  <tr key={l.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={TD}>{l.employee_name}</td>
                    <td style={TD}>{TYPE_LABELS[l.leave_type]}</td>
                    <td style={TD}>
                      <div>{new Date(l.start_date).toLocaleDateString('fr-FR')}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>→ {new Date(l.end_date).toLocaleDateString('fr-FR')}</div>
                    </td>
                    <td style={TD}>{l.days_count}j</td>
                    <td style={TD}>
                      <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s.label}</span>
                    </td>
                    <td style={TD}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {l.status === 'pending' && (
                          <>
                            <button onClick={() => setDecision(l)} style={ACTION_BTN('#1d9e75')}>Décider</button>
                            <button onClick={() => handleCancel(l.id)} style={ACTION_BTN('#f87171')}>Annuler</button>
                          </>
                        )}
                        {l.status === 'rejected' && l.rejection_reason && (
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }} title={l.rejection_reason}>ℹ Motif</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      {showForm && (
        <AdminLeaveForm
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); load() }}
        />
      )}
      {decision && (
        <DecisionModal
          leave={decision}
          onClose={() => setDecision(null)}
          onDecided={() => { setDecision(null); load() }}
        />
      )}
    </div>
  )
}

const TD = { padding: '12px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 13, verticalAlign: 'middle' }
const FILTER_STYLE = {
  background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12,
}
const ACTION_BTN = (color) => ({
  background: `${color}20`, border: `1px solid ${color}40`, color,
  borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
})

import { useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/authApi'
import { employeesApi } from '../api/employeesApi'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import {
  Card, Button, Input, Select, Modal, ErrorBanner, Avatar, Spinner
} from '../components/ui/index.jsx'
import Badge from '../components/ui/Badge.jsx'

// ── Formulaire création de compte ─────────────────────────────────────────────
function CreateAccountModal({ onClose, onCreated }) {
  const [step, setStep]   = useState('choose') // 'choose' | 'linked' | 'standalone'
  const [employees, setEmployees] = useState([])
  const [form, setForm]   = useState({
    email: '', password: '', first_name: '', last_name: '',
    role: 'employee', employee_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [search, setSearch] = useState('')

  // Charger les employés sans compte
  useEffect(() => {
    if (step === 'linked') {
      employeesApi.getAll({ limit: 100, status: 'active' })
        .then(({ data }) => setEmployees(data.employees))
        .catch(() => {})
    }
  }, [step])

  const filteredEmps = employees.filter((e) =>
    !search || e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  )

  const selectEmployee = (emp) => {
    setForm((p) => ({
      ...p,
      email:      emp.email,
      first_name: emp.first_name,
      last_name:  emp.last_name,
      role:       'employee',
      employee_id: emp.id,
    }))
    setStep('form-linked')
  }

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.first_name) {
      setError('Email, mot de passe et prénom sont obligatoires.')
      return
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authApi.register({
        email:      form.email,
        password:   form.password,
        first_name: form.first_name,
        last_name:  form.last_name,
        role:       form.role,
      })
      onCreated()
    } catch (err) {
      const d = err.response?.data
      if (typeof d === 'object') {
        const msgs = Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' | ')
        setError(msgs)
      } else {
        setError('Une erreur est survenue.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Étape 1 : Choisir le type de compte ────────────────────────────────────
  if (step === 'choose') {
    return (
      <Modal title="Créer un compte utilisateur" onClose={onClose} width={520}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 24 }}>
          Quel type de compte souhaitez-vous créer ?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => setStep('linked')}
            style={CHOICE_BTN}
          >
            <span style={{ fontSize: 28 }}>👤</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Lié à un employé existant</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 3 }}>
                L'employé est déjà dans le système — on lui crée un accès
              </div>
            </div>
          </button>
          <button
            onClick={() => setStep('standalone')}
            style={CHOICE_BTN}
          >
            <span style={{ fontSize: 28 }}>🛡️</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Compte admin / manager</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 3 }}>
                Un gestionnaire RH ou un administrateur système
              </div>
            </div>
          </button>
        </div>
      </Modal>
    )
  }

  // ── Étape 2a : Sélectionner un employé ─────────────────────────────────────
  if (step === 'linked') {
    return (
      <Modal title="Sélectionner un employé" onClose={onClose} width={560}>
        <button onClick={() => setStep('choose')} style={BACK_BTN}>← Retour</button>
        <input
          style={{ ...SEARCH, marginBottom: 16 }}
          placeholder="Rechercher un employé..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredEmps.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 30 }}>
              Aucun employé trouvé
            </p>
          ) : filteredEmps.map((emp) => (
            <button key={emp.id} onClick={() => selectEmployee(emp)} style={EMP_ROW}>
              <Avatar name={emp.full_name} photoUrl={emp.photo_url} size={36} />
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{emp.full_name}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{emp.position} · {emp.department}</div>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{emp.employee_id}</span>
            </button>
          ))}
        </div>
      </Modal>
    )
  }

  // ── Étape 2b / 3 : Formulaire de compte ────────────────────────────────────
  const isLinked = step === 'form-linked'
  return (
    <Modal
      title={isLinked ? `Créer un accès pour ${form.first_name} ${form.last_name}` : 'Nouveau compte administrateur'}
      onClose={onClose}
      width={520}
    >
      <button onClick={() => setStep(isLinked ? 'linked' : 'choose')} style={BACK_BTN}>← Retour</button>
      <ErrorBanner message={error} />

      <Input label="Prénom *"        value={form.first_name} onChange={set('first_name')} disabled={isLinked} />
      <Input label="Nom"             value={form.last_name}  onChange={set('last_name')}  disabled={isLinked} />
      <Input label="Email *"         value={form.email}      onChange={set('email')} type="email" disabled={isLinked} />
      <Input
        label="Mot de passe temporaire *"
        value={form.password}
        onChange={set('password')}
        type="password"
        placeholder="Min. 8 caractères"
      />
      {!isLinked && (
        <Select
          label="Rôle"
          value={form.role}
          onChange={set('role')}
          options={[
            { value: 'admin',    label: 'Admin — accès total' },
            { value: 'manager',  label: 'Manager — gestion équipe' },
            { value: 'employee', label: 'Employé — accès limité' },
          ]}
        />
      )}

      {isLinked && (
        <div style={{ background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
          <p style={{ color: '#1d9e75', fontSize: 12, margin: 0 }}>
            ✓ Ce compte sera lié à la fiche employé. L'employé devra changer son mot de passe à la première connexion.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} loading={loading}>Créer le compte</Button>
      </div>
    </Modal>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function UsersPage() {
  const { isAdmin } = useAuth()
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch]   = useState('')

  // Seul l'admin peut accéder à cette page
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await authApi.getUsers()
      setUsers(data)
    } catch {
      setError('Impossible de charger les utilisateurs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [])

  const filtered = users.filter((u) =>
    !search ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(search.toLowerCase())
  )

  const roleCount = (role) => users.filter((u) => u.role === role).length

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>Comptes utilisateurs</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '4px 0 0' }}>
            Gérez les accès au portail HRM
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ Créer un compte</Button>
      </div>

      <ErrorBanner message={error} />

      {/* KPI rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Admins',    count: roleCount('admin'),    color: '#a78bfa' },
          { label: 'Managers',  count: roleCount('manager'),  color: '#3b82f6' },
          { label: 'Employés',  count: roleCount('employee'), color: '#1d9e75' },
        ].map((k) => (
          <div key={k.label} style={{
            background: '#13131f', border: '1px solid rgba(255,255,255,0.07)',
            borderLeft: `3px solid ${k.color}`, borderRadius: 12,
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>{k.count}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Barre de recherche */}
      <input
        style={{ ...SEARCH, maxWidth: 360, marginBottom: 20 }}
        placeholder="Rechercher par nom ou email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <p>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Utilisateur', 'Rôle', 'Statut', 'Créé le'].map((h) => (
                  <th key={h} style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={`${u.first_name || ''} ${u.last_name || ''}`} size={36} />
                      <div>
                        <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
                          {u.first_name} {u.last_name}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}><Badge type={u.role} /></td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      background: u.is_active ? 'rgba(29,158,117,0.15)' : 'rgba(100,100,100,0.15)',
                      color: u.is_active ? '#1d9e75' : '#888',
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    }}>
                      {u.is_active ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showCreate && (
        <CreateAccountModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load() }}
        />
      )}
    </div>
  )
}

// ── Styles locaux ─────────────────────────────────────────────────────────────
const CHOICE_BTN = {
  display: 'flex', alignItems: 'center', gap: 16,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12, padding: '18px 20px', cursor: 'pointer', width: '100%',
  transition: 'background 0.15s',
}
const EMP_ROW = {
  display: 'flex', alignItems: 'center', gap: 12,
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 10, padding: '12px 16px', cursor: 'pointer', width: '100%',
}
const BACK_BTN = {
  background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
  fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0,
}
const SEARCH = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
  padding: '10px 14px', color: '#fff', fontSize: 13,
  outline: 'none', boxSizing: 'border-box',
}
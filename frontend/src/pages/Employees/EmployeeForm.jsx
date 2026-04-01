import { useState } from 'react'
import { employeesApi } from '../../api/employeesApi'
import { Modal, Button, Input, Select, ErrorBanner } from '../../components/ui/index.jsx'

const DEPARTMENTS = ['Informatique','Ressources Humaines','Finance','Commercial','Marketing','Production','Logistique','Direction','Juridique','R&D']
const CONTRACTS   = [{ value:'cdi',label:'CDI' },{ value:'cdd',label:'CDD' },{ value:'stage',label:'Stage' },{ value:'freelance',label:'Freelance' }]
const GENDERS     = [{ value:'male',label:'Homme' },{ value:'female',label:'Femme' },{ value:'other',label:'Autre' }]
const STATUSES    = [{ value:'active',label:'Actif' },{ value:'inactive',label:'Inactif' },{ value:'on_leave',label:'En congé' },{ value:'terminated',label:'Archivé' }]

const EMPTY = {
  first_name:'', last_name:'', email:'', phone:'',
  department:'', position:'', hire_date:'',
  contract_type:'cdi', gender:'male', status:'active',
  base_salary:'', bank_account:'', address:'',
  birth_date:'', emergency_contact_name:'', emergency_contact_phone:'',
}

export default function EmployeeForm({ employee, onClose }) {
  const isEdit = !!employee
  const [form, setForm]     = useState(isEdit ? {
    ...EMPTY,
    ...employee,
    hire_date:  employee.hire_date  ? employee.hire_date.slice(0,10)  : '',
    birth_date: employee.birth_date ? employee.birth_date.slice(0,10) : '',
  } : EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [tab, setTab]         = useState('info') // 'info' | 'pro' | 'urgence'

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        base_salary: parseFloat(form.base_salary) || 0,
        hire_date:   form.hire_date  ? new Date(form.hire_date).toISOString()  : undefined,
        birth_date:  form.birth_date ? new Date(form.birth_date).toISOString() : undefined,
      }
      if (isEdit) {
        await employeesApi.update(employee.id, payload)
      } else {
        await employeesApi.create(payload)
      }
      onClose(true) // true = recharger la liste
    } catch (err) {
      const d = err.response?.data
      if (typeof d === 'object') {
        const msgs = Object.entries(d).map(([k,v]) => `${k}: ${Array.isArray(v)?v[0]:v}`).join(' | ')
        setError(msgs)
      } else {
        setError('Une erreur est survenue.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Onglets ────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'info', label: '👤 Infos perso.' },
    { id: 'pro',  label: '💼 Infos pro.'   },
    { id: 'more', label: '📋 Suppléments'  },
  ]

  return (
    <Modal
      title={isEdit ? `Modifier — ${employee.full_name}` : 'Nouvel employé'}
      onClose={() => onClose(false)}
      width={680}
    >
      <ErrorBanner message={error} />

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 4 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 6, border: 'none',
              background: tab === t.id ? 'rgba(120,60,200,0.3)' : 'transparent',
              color: tab === t.id ? '#a78bfa' : 'rgba(255,255,255,0.5)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Onglet infos personnelles ──────────────────────────────────────── */}
      {tab === 'info' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Input label="Prénom *"   value={form.first_name} onChange={set('first_name')} placeholder="Mohamed" />
          <Input label="Nom *"      value={form.last_name}  onChange={set('last_name')}  placeholder="Ben Ali" />
          <Input label="Email *"    value={form.email}      onChange={set('email')}       type="email" placeholder="m.benali@entreprise.tn" />
          <Input label="Téléphone"  value={form.phone}      onChange={set('phone')}       placeholder="+216 XX XXX XXX" />
          <Select label="Genre" value={form.gender} onChange={set('gender')} options={GENDERS} />
          <Input label="Date de naissance" value={form.birth_date} onChange={set('birth_date')} type="date" />
          <div style={{ gridColumn: '1/-1' }}>
            <Input label="Adresse" value={form.address} onChange={set('address')} placeholder="Rue, Ville, Gouvernorat" />
          </div>
        </div>
      )}

      {/* ── Onglet infos professionnelles ─────────────────────────────────── */}
      {tab === 'pro' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={LABEL}>Département *</label>
            <select style={SEL_STYLE} value={form.department} onChange={set('department')}>
              <option value="">— Sélectionner —</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <Input label="Poste / Intitulé *" value={form.position} onChange={set('position')} placeholder="Développeur Full-Stack" />
          <Input label="Date d'embauche *"  value={form.hire_date} onChange={set('hire_date')} type="date" />
          <Select label="Type de contrat" value={form.contract_type} onChange={set('contract_type')} options={CONTRACTS} />
          {isEdit && <Select label="Statut" value={form.status} onChange={set('status')} options={STATUSES} />}
          <Input label="Salaire de base (TND)" value={form.base_salary} onChange={set('base_salary')} type="number" placeholder="2500" />
          <Input label="RIB / Compte bancaire" value={form.bank_account} onChange={set('bank_account')} placeholder="20 XXX XXXXX XXXXXXXX XX" />
        </div>
      )}

      {/* ── Onglet suppléments ────────────────────────────────────────────── */}
      {tab === 'more' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Input label="Contact urgence — Nom"  value={form.emergency_contact_name}  onChange={set('emergency_contact_name')}  placeholder="Fatma Ben Ali" />
          <Input label="Contact urgence — Tél." value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')} placeholder="+216 XX XXX XXX" />
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <Button variant="secondary" onClick={() => onClose(false)}>Annuler</Button>
        <Button onClick={handleSubmit} loading={loading}>
          {isEdit ? 'Enregistrer les modifications' : 'Créer l\'employé'}
        </Button>
      </div>
    </Modal>
  )
}

const LABEL = { display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 6, fontWeight: 500 }
const SEL_STYLE = {
  width: '100%', background: '#1a1a2e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '10px 14px',
  color: '#fff', fontSize: 14,
  boxSizing: 'border-box', outline: 'none', marginBottom: 16,
}
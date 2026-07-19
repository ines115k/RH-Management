import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { employeesApi } from '../../api/employeesApi'
import { useAuth } from '../../context/AuthContext'
import { Spinner, Avatar, Button, ErrorBanner } from '../../components/ui/index.jsx'
import Badge from '../../components/ui/Badge.jsx'
import EmployeeForm from './EmployeeForm.jsx'

// ── Composant ligne de tableau ────────────────────────────────────────────────
function EmployeeRow({ emp, onEdit, onArchive, canManage }) {
  const navigate = useNavigate()
  return (
    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
        onClick={() => navigate(`/employees/${emp.id}`)}>
      <td style={TD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={emp.full_name} photoUrl={emp.photo_url} size={36} />
          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{emp.full_name}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{emp.employee_id}</div>
          </div>
        </div>
      </td>
      <td style={TD}>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{emp.position}</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{emp.department}</div>
      </td>
      <td style={TD}><Badge type={emp.contract_type} /></td>
      <td style={TD}><Badge type={emp.status} /></td>
      <td style={TD}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
          {emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('fr-FR') : '—'}
        </span>
      </td>
      {canManage && (
        <td style={TD} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => onEdit(emp)}
              style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}
            >Modifier</button>
            {emp.status !== 'terminated' && (
              <button
                onClick={() => onArchive(emp)}
                style={{ background: 'rgba(232,93,36,0.1)', border: '1px solid rgba(232,93,36,0.2)', color: '#f87171', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}
              >Archiver</button>
            )}
          </div>
        </td>
      )}
    </tr>
  )
}

const TD = { padding: '14px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 13, verticalAlign: 'middle' }
const TH = { padding: '0 16px 14px', color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left' }

// ── Page principale ───────────────────────────────────────────────────────────
export default function EmployeeList() {
  const { canManage } = useAuth()
  const [data, setData]       = useState({ employees: [], total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')
  const [filters, setFilters] = useState({ status: '', department: '', contract_type: '' })
  const [page, setPage]       = useState(1)
  const [showForm, setShowForm]     = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  // ── Charger les données ───────────────────────────────────────────────────
  const load = useCallback(async (p = 1, s = search, f = filters) => {
    setLoading(true)
    setError('')
    try {
      const params = { page: p, limit: 10, search: s, ...f }
      // Supprimer les filtres vides
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
      const { data: res } = await employeesApi.getAll(params)
      setData(res)
      setPage(p)
    } catch {
      setError('Impossible de charger la liste des employés.')
    } finally {
      setLoading(false)
    }
  }, [search, filters])

  useEffect(() => { load() }, [])

  // ── Recherche avec debounce ───────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => load(1, search, filters), 350)
    return () => clearTimeout(t)
  }, [search])

  const handleFilterChange = (key, val) => {
    const newF = { ...filters, [key]: val }
    setFilters(newF)
    load(1, search, newF)
  }

  // ── Archiver ──────────────────────────────────────────────────────────────
  const handleArchive = async (emp) => {
    if (!window.confirm(`Archiver ${emp.full_name} ?`)) return
    try {
      await employeesApi.delete(emp.id)
      load(page)
    } catch {
      alert('Erreur lors de l\'archivage.')
    }
  }

  // ── Ouvrir formulaire ─────────────────────────────────────────────────────
  const openCreate = () => { setEditTarget(null); setShowForm(true) }
  const openEdit   = (emp) => { setEditTarget(emp); setShowForm(true) }
  const closeForm  = (reload = false) => { setShowForm(false); setEditTarget(null); if (reload) load(page) }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1300 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>Employés</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '4px 0 0' }}>
            {data.total} employé{data.total > 1 ? 's' : ''} au total
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>+ Nouvel employé</Button>
        )}
      </div>

      <ErrorBanner message={error} />

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          style={SEARCH_STYLE}
          placeholder="Rechercher par nom, poste, département..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {[
          { key: 'status',        label: 'Statut',   opts: [['', 'Tous'],['active','Actif'],['inactive','Inactif'],['on_leave','Congé'],['terminated','Archivé']] },
          { key: 'contract_type', label: 'Contrat',  opts: [['', 'Tous'],['cdi','CDI'],['cdd','CDD'],['stage','Stage'],['freelance','Freelance']] },
        ].map(({ key, opts }) => (
          <select
            key={key}
            style={FILTER_STYLE}
            value={filters[key]}
            onChange={(e) => handleFilterChange(key, e.target.value)}
          >
            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <Spinner />
        ) : !data.employees || data.employees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <p>Aucun employé trouvé</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Employé', 'Poste / Département', 'Contrat', 'Statut', 'Embauché le', canManage && 'Actions'].filter(Boolean).map((h) => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.employees || []).map((emp) => (
                <EmployeeRow key={emp.id} emp={emp} onEdit={openEdit} onArchive={handleArchive} canManage={canManage} />
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && data.total > 10 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              Page {page} sur {data.pages}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={PAGE_BTN} disabled={page <= 1} onClick={() => load(page - 1)}>← Préc.</button>
              <button style={PAGE_BTN} disabled={page >= data.pages} onClick={() => load(page + 1)}>Suiv. →</button>
            </div>
          </div>
        )}
      </div>

      {/* Formulaire modal */}
      {showForm && (
        <EmployeeForm
          employee={editTarget}
          onClose={closeForm}
        />
      )}
    </div>
  )
}

const SEARCH_STYLE = {
  flex: 1, minWidth: 240,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '10px 14px',
  color: '#fff', fontSize: 13, outline: 'none',
}
const FILTER_STYLE = {
  background: '#1a1a2e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '10px 14px',
  color: '#fff', fontSize: 13, outline: 'none',
}
const PAGE_BTN = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '8px 16px',
  color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer',
}

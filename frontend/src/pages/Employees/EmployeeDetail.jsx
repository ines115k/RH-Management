import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { employeesApi } from '../../api/employeesApi'
import { useAuth } from '../../context/AuthContext'
import { Spinner, Avatar, Button, Card, ErrorBanner } from '../../components/ui/index.jsx'
import Badge from '../../components/ui/Badge.jsx'
import EmployeeForm from './EmployeeForm.jsx'

export default function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canManage } = useAuth()
  const photoInputRef = useRef()

  const [emp, setEmp]         = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [{ data: e }, { data: h }] = await Promise.all([
        employeesApi.getById(id),
        employeesApi.getHistory(id),
      ])
      setEmp(e)
      setHistory(h.history || [])
    } catch {
      setError('Employé introuvable.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadMsg('Envoi en cours...')
    try {
      const { data } = await employeesApi.uploadPhoto(id, file)
      setEmp((prev) => ({ ...prev, photo_url: data.photo_url }))
      setUploadMsg('Photo mise à jour !')
      setTimeout(() => setUploadMsg(''), 3000)
    } catch {
      setUploadMsg('Erreur lors de l\'envoi.')
    }
  }

  if (loading) return <div style={{ padding: 40 }}><Spinner /></div>
  if (error || !emp) return <div style={{ padding: 40 }}><ErrorBanner message={error || 'Employé introuvable.'} /></div>

  const infoRows = [
    ['Email',        emp.email],
    ['Téléphone',    emp.phone || '—'],
    ['Adresse',      emp.address || '—'],
    ['Genre',        emp.gender === 'male' ? 'Homme' : emp.gender === 'female' ? 'Femme' : 'Autre'],
    ['Naissance',    emp.birth_date ? new Date(emp.birth_date).toLocaleDateString('fr-FR') : '—'],
  ]
  const proRows = [
    ['ID Employé',   emp.employee_id],
    ['Département',  emp.department],
    ['Poste',        emp.position],
    ['Date d\'embauche', emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('fr-FR') : '—'],
    ['Salaire base', emp.base_salary ? `${emp.base_salary.toLocaleString('fr-FR')} TND` : '—'],
    ['RIB',          emp.bank_account || '—'],
  ]

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <button onClick={() => navigate('/employees')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}>
          ← Employés
        </button>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{emp.full_name}</span>
      </div>

      {/* Header fiche */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 28, background: '#13131f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
        {/* Photo + upload */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar name={emp.full_name} photoUrl={emp.photo_url} size={80} />
          {canManage && (
            <button
              onClick={() => photoInputRef.current?.click()}
              title="Changer la photo"
              style={{
                position: 'absolute', bottom: -4, right: -4,
                width: 26, height: 26, borderRadius: '50%',
                background: '#7c5cbf', border: '2px solid #13131f',
                color: '#fff', fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >📷</button>
          )}
          <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
          {uploadMsg && <div style={{ position: 'absolute', top: 90, left: 0, color: '#a78bfa', fontSize: 11, whiteSpace: 'nowrap' }}>{uploadMsg}</div>}
        </div>

        {/* Infos en-tête */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>{emp.full_name}</h2>
            <Badge type={emp.status} />
            <Badge type={emp.contract_type} />
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 4 }}>
            {emp.position} · {emp.department}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
            {emp.employee_id} · {emp.email}
          </div>
        </div>

        {canManage && (
          <Button onClick={() => setShowEdit(true)}>✏️ Modifier</Button>
        )}
      </div>

      {/* Détails en 2 colonnes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card>
          <h3 style={CARD_TITLE}>Informations personnelles</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {infoRows.map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 0', color: 'rgba(255,255,255,0.4)', fontSize: 12, width: '45%' }}>{k}</td>
                  <td style={{ padding: '10px 0', color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <h3 style={CARD_TITLE}>Informations professionnelles</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {proRows.map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 0', color: 'rgba(255,255,255,0.4)', fontSize: 12, width: '45%' }}>{k}</td>
                  <td style={{ padding: '10px 0', color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Historique des postes */}
      <Card>
        <h3 style={CARD_TITLE}>Historique des postes</h3>
        {history.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: 0 }}>
            Aucun changement de poste enregistré.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Poste actuel */}
            <div style={{ display: 'flex', gap: 16, paddingBottom: 20, position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#1d9e75', flexShrink: 0, marginTop: 3 }} />
                {history.length > 0 && <div style={{ width: 2, flex: 1, background: 'rgba(255,255,255,0.08)', marginTop: 4 }} />}
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{emp.position}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{emp.department} · Poste actuel</div>
              </div>
            </div>
            {/* Anciens postes */}
            {history.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: 20, position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', flexShrink: 0, marginTop: 3 }} />
                  {i < history.length - 1 && <div style={{ width: 2, flex: 1, background: 'rgba(255,255,255,0.08)', marginTop: 4 }} />}
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{h.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                    {h.department} · {new Date(h.start_date).toLocaleDateString('fr-FR')}
                    {h.end_date && ` → ${new Date(h.end_date).toLocaleDateString('fr-FR')}`}
                  </div>
                  {h.note && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2, fontStyle: 'italic' }}>{h.note}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showEdit && (
        <EmployeeForm
          employee={emp}
          onClose={(reload) => { setShowEdit(false); if (reload) load() }}
        />
      )}
    </div>
  )
}

const CARD_TITLE = { color: '#fff', fontSize: 14, fontWeight: 600, margin: '0 0 16px' }
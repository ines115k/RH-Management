import { useState, useEffect, useCallback } from 'react';
import { payrollApi } from '../../api/payrollApi';
import { employeesApi } from '../../api/employeesApi';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Modal, Select, Input, Spinner, Avatar } from '../../components/ui/index.jsx';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const STATUS_LABELS = {
  draft: { label: 'Brouillon', color: '#e8a430' },
  validated: { label: 'Validé', color: '#1d9e75' },
  paid: { label: 'Payé', color: '#a78bfa' },
};

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || { label: status, color: '#888' };
  return (
    <span style={{
      background: s.color + '25', color: s.color,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    }}>{s.label}</span>
  );
}

// ── Modal de génération ─────────────────────────────────────────────────────
function GenerateModal({ onClose, onGenerated }) {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employee_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    employeesApi.getAll({ limit: 500, status: 'active' })
      .then(({ data }) => setEmployees(data.employees))
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.employee_id) {
      setError('Veuillez sélectionner un employé.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await payrollApi.generate(form);
      onGenerated();
    } catch (err) {
      const msg = err.response?.data?.detail || Object.values(err.response?.data || {}).flat().join(' | ');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Générer un bulletin de paie" onClose={onClose} width={500}>
      {error && <div style={{ color: '#f87171', marginBottom: 16, fontSize: 13 }}>{error}</div>}
      <Select
        label="Employé *"
        value={form.employee_id}
        onChange={(e) => setForm(p => ({ ...p, employee_id: e.target.value }))}
        options={employees.map(e => ({ value: e.id, label: `${e.full_name} (${e.employee_id})` }))}
      />
      <Select
        label="Mois"
        value={form.month}
        onChange={(e) => setForm(p => ({ ...p, month: parseInt(e.target.value) }))}
        options={MONTHS.map((m, i) => ({ value: i+1, label: m }))}
      />
      <Input
        label="Année"
        type="number"
        value={form.year}
        onChange={(e) => setForm(p => ({ ...p, year: parseInt(e.target.value) }))}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} loading={loading}>Générer</Button>
      </div>
    </Modal>
  );
}

// ── Modal de détail ────────────────────────────────────────────────────────
function DetailModal({ payslip, onClose }) {
  if (!payslip) return null;
  const labelStyle = { color: 'rgba(255,255,255,0.6)', fontWeight: 500 };
  const valueStyle = { color: '#fff', fontWeight: 'normal' };
  return (
    <Modal title={`Bulletin - ${payslip.employee_name}`} onClose={onClose} width={600}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div><span style={labelStyle}>Mois / Année :</span> <span style={valueStyle}>{MONTHS[payslip.month-1]} {payslip.year}</span></div>
        <div><span style={labelStyle}>Statut :</span> <StatusBadge status={payslip.status} /></div>
        <div><span style={labelStyle}>Salaire de base :</span> <span style={valueStyle}>{payslip.base_salary.toLocaleString()} TND</span></div>
        <div><span style={labelStyle}>Heures travaillées :</span> <span style={valueStyle}>{payslip.worked_hours}h</span></div>
        <div><span style={labelStyle}>Primes :</span> <span style={valueStyle}>{payslip.bonus.toLocaleString()} TND</span></div>
        <div><span style={labelStyle}>Déductions :</span> <span style={valueStyle}>{payslip.deductions.toLocaleString()} TND</span></div>
        <div><span style={labelStyle}>Salaire net :</span> <strong style={{ color: '#1d9e75' }}>{payslip.net_salary.toLocaleString()} TND</strong></div>
        <div><span style={labelStyle}>Généré le :</span> <span style={valueStyle}>{new Date(payslip.generated_at).toLocaleDateString('fr-FR')}</span></div>
        {payslip.validated_by && (
          <div><span style={labelStyle}>Validé par :</span> <span style={valueStyle}>{payslip.validated_by}</span></div>
        )}
      </div>
      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <Button variant="secondary" onClick={onClose}>Fermer</Button>
      </div>
    </Modal>
  );
}

// ── Page principale ────────────────────────────────────────────────────────
export default function PayrollPage() {
  const { canManage, isAdmin, isManager } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ employee_id: '', month: '', year: '', status: '' });
  const [showGenerate, setShowGenerate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.employee_id) params.employee_id = filters.employee_id;
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;
      if (filters.status) params.status = filters.status;
      const { data } = await payrollApi.getAll(params);
      setRecords(data.records);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, refresh]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id, action) => {
    try {
      await payrollApi.updateStatus(id, action);
      setRefresh(r => r + 1);
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce bulletin ?')) return;
    try {
      await payrollApi.deleteSlip(id);
      setRefresh(r => r + 1);
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur');
    }
  };

  if (!canManage) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#fff' }}>
        <h3>Accès non autorisé</h3>
        <p>Cette page est réservée aux administrateurs et managers.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>Gestion de la paie</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '4px 0 0' }}>
            Gérez les bulletins de salaire
          </p>
        </div>
        <Button onClick={() => setShowGenerate(true)}>+ Générer un bulletin</Button>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          style={FILTER_STYLE}
          placeholder="ID Employé"
          value={filters.employee_id}
          onChange={(e) => setFilters(p => ({ ...p, employee_id: e.target.value }))}
        />
        <select value={filters.month} onChange={e => setFilters(p => ({ ...p, month: e.target.value }))} style={FILTER_STYLE}>
          <option value="">Tous mois</option>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <input
          type="number"
          placeholder="Année"
          style={{ width: 100, ...FILTER_STYLE }}
          value={filters.year}
          onChange={e => setFilters(p => ({ ...p, year: e.target.value }))}
        />
        <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))} style={FILTER_STYLE}>
          <option value="">Tous statuts</option>
          <option value="draft">Brouillon</option>
          <option value="validated">Validé</option>
          <option value="paid">Payé</option>
        </select>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <Spinner />
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
            <p>Aucun bulletin trouvé</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Employé', 'Mois/Année', 'Salaire net', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '14px 20px' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <Avatar name={r.employee_name} size={36} />
    <div>
      <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{r.employee_name}</div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{r.employee_id}</div>
    </div>
  </div>
</td>
                  <td style={{ padding: '14px 20px', color: 'white' }}>{MONTHS[r.month-1]} {r.year}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#1d9e75' }}>{r.net_salary.toLocaleString()} TND</td>
                  <td style={{ padding: '14px 20px' }}><StatusBadge status={r.status} /></td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setSelected(r)} style={ACTION_BTN}>Voir</button>
                      {r.status === 'draft' && (isAdmin || isManager) && (
                        <button onClick={() => handleAction(r.id, 'validate')} style={{ ...ACTION_BTN, background: '#1d9e7520', borderColor: '#1d9e7540', color: '#1d9e75' }}>Valider</button>
                      )}
                      {r.status === 'validated' && (isAdmin || isManager) && (
                        <button onClick={() => handleAction(r.id, 'pay')} style={{ ...ACTION_BTN, background: '#a78bfa20', borderColor: '#a78bfa40', color: '#a78bfa' }}>Payer</button>
                      )}
                      {isAdmin && (
                        <button onClick={() => handleDelete(r.id)} style={{ ...ACTION_BTN, background: '#f8717120', borderColor: '#f8717140', color: '#f87171' }}>Supprimer</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showGenerate && <GenerateModal onClose={() => setShowGenerate(false)} onGenerated={() => { setShowGenerate(false); setRefresh(r => r+1); }} />}
      {selected && <DetailModal payslip={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const FILTER_STYLE = {
  background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12,
  outline: 'none',
};
const ACTION_BTN = {
  background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
  color: '#a78bfa', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer',
};
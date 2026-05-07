import React, { useState, useEffect } from 'react';
import { payrollApi } from '../../api/payrollApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const PayrollEmploye = () => {
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [payslip, setPayslip]           = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear());
  const [showDetails, setShowDetails]   = useState(false);

  useEffect(() => {
    loadPayslip();
  }, [selectedMonth, selectedYear]);

  const loadPayslip = async () => {
    try {
      setLoading(true);
      setError(null);
      setPayslip(null);

      const response = await payrollApi.getAll({
        month: selectedMonth,
        year:  selectedYear,
      });

      const records = response?.data?.records ?? [];
      if (records.length > 0) {
        setPayslip(records[0]);
      }
      // Pas de bulletin pour ce mois → payslip reste null, on affiche un message dédié
    } catch (err) {
      console.error('Erreur chargement fiche de paie :', err);
      setError('Impossible de charger la fiche de paie.');
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];

  const statusLabel = (s) => ({
    draft:     { label: 'Brouillon',  color: '#f59e0b' },
    validated: { label: 'Validé',     color: '#3b82f6' },
    paid:      { label: 'Payé',       color: '#4ade80' },
  }[s] ?? { label: s, color: '#6b7280' });

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorMessage message={error} />;

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
        💰 Ma fiche de paie
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '24px' }}>
        Consultez votre salaire et le détail des déductions
      </p>

      {/* Sélecteur mois / année */}
      <div style={{
        display: 'flex', gap: '16px', marginBottom: '24px',
        background: '#13131f', padding: '16px', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          style={selectStyle}
        >
          {monthNames.map((name, idx) => (
            <option key={idx} value={idx + 1}>{name}</option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          style={selectStyle}
        >
          {[2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {payslip && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={btnStyle}
          >
            {showDetails ? '📄 Masquer les détails' : '📊 Voir le bulletin détaillé'}
          </button>
        )}
      </div>

      {/* Aucun bulletin */}
      {!payslip && (
        <div style={{
          background: '#13131f', borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.07)',
          padding: '60px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Aucune fiche de paie disponible pour {monthNames[selectedMonth - 1]} {selectedYear}.
          </p>
        </div>
      )}

      {/* Bulletin disponible */}
      {payslip && (
        <>
          {/* Carte salaire net */}
          <div style={{
            background: 'linear-gradient(135deg, #1e1e3a, #13131f)',
            borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
            padding: '40px', marginBottom: '24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>

            {/* Statut */}
            <div style={{ marginBottom: '12px' }}>
              <span style={{
                background: `${statusLabel(payslip.status).color}20`,
                color: statusLabel(payslip.status).color,
                border: `1px solid ${statusLabel(payslip.status).color}40`,
                borderRadius: '20px', padding: '4px 14px', fontSize: '13px', fontWeight: 600,
              }}>
                {statusLabel(payslip.status).label}
              </span>
            </div>

            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '8px' }}>
              Salaire net — {monthNames[selectedMonth - 1]} {selectedYear}
            </div>
            <div style={{ color: '#4ade80', fontSize: '48px', fontWeight: 'bold' }}>
              {payslip.net_salary?.toFixed(2)} €
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '8px' }}>
              Après déductions et charges
            </div>
          </div>

          {/* Détail bulletin */}
          {showDetails && (
            <div style={{
              background: '#13131f', borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '24px', animation: 'fadeIn 0.3s ease',
            }}>
              <h3 style={{
                color: '#fff', fontSize: '18px', fontWeight: 600,
                marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: '12px',
              }}>
                📋 Détail du bulletin
              </h3>

              {/* Gains */}
              <div style={sectionStyle('rgba(74,222,128,0.05)')}>
                <div style={{ color: '#4ade80', marginBottom: '12px', fontWeight: 600 }}>✓ Gains</div>
                <Row label="Salaire de base"  value={`${payslip.base_salary?.toFixed(2)} €`} />
                <Row label="Prime"            value={`+ ${payslip.bonus?.toFixed(2)} €`} />
              </div>

              {/* Déductions */}
              <div style={sectionStyle('rgba(239,68,68,0.05)')}>
                <div style={{ color: '#f87171', marginBottom: '12px', fontWeight: 600 }}>✗ Déductions</div>
                <Row label="Retenues / absences" value={`- ${payslip.deductions?.toFixed(2)} €`} color="#f87171" />
              </div>

              {/* Infos complémentaires */}
              <div style={sectionStyle('rgba(255,255,255,0.03)')}>
                <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '12px', fontWeight: 600 }}>ℹ Informations</div>
                <Row label="Heures travaillées" value={`${payslip.worked_hours?.toFixed(1)} h`} />
                <Row label="Employé"            value={payslip.employee_name || payslip.employee_id} />
              </div>

              {/* Total */}
              <div style={{
                background: 'rgba(59,130,246,0.1)', borderRadius: '12px', padding: '16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '8px',
              }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>Salaire net</span>
                <span style={{ color: '#4ade80', fontSize: '24px', fontWeight: 'bold' }}>
                  {payslip.net_salary?.toFixed(2)} €
                </span>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

/* ── Helpers ── */
const Row = ({ label, value, color = '#fff' }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between',
    marginBottom: '8px', flexWrap: 'wrap', gap: '8px',
  }}>
    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
    <span style={{ color }}>{value}</span>
  </div>
);

const sectionStyle = (bg) => ({
  background: bg, borderRadius: '12px', padding: '16px', marginBottom: '16px',
});

const selectStyle = {
  background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', padding: '10px 16px', color: '#fff',
  fontSize: '14px', cursor: 'pointer',
};

const btnStyle = {
  background: '#3b82f6', border: 'none', borderRadius: '8px',
  padding: '10px 24px', color: '#fff', cursor: 'pointer',
  fontSize: '14px', fontWeight: 500,
};

export default PayrollEmploye;
import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../../services/attendanceAPI';
import { employeeAPI } from '../../services/employeeAPI';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';

const PayrollEmploye = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payrollData, setPayrollData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showDetails, setShowDetails] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState(null);

  // Charger les infos de l'employé
  useEffect(() => {
    loadEmployeeInfo();
  }, []);

  // Charger les données de paie quand le mois change ou les infos sont chargées
  useEffect(() => {
    if (employeeInfo) {
      loadPayrollData();
    }
  }, [selectedMonth, selectedYear, employeeInfo]);

  const loadEmployeeInfo = async () => {
    try {
      const data = await employeeAPI.getMyInfo();
      setEmployeeInfo(data);
    } catch (err) {
      console.error('Erreur chargement infos employé:', err);
      setError('Impossible de charger vos informations');
      setLoading(false);
    }
  };

  const loadPayrollData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les vraies absences depuis l'API
      const absences = await attendanceAPI.getAbsences(selectedMonth + 1, selectedYear);
      
      // Calculer la déduction
      const monthlyWorkDays = 22;
      const dailyRate = employeeInfo.base_salary / monthlyWorkDays;
      const deduction = absences.length * dailyRate;
      
      // Primes
      const bonus = employeeInfo.base_salary * 0.05;
      const transport = 50;
      
      // Charges sociales
      const socialCharges = employeeInfo.base_salary * 0.20;
      
      // Salaire net
      const grossSalary = employeeInfo.base_salary + bonus + transport;
      const netSalary = grossSalary - deduction - socialCharges;
      
      setPayrollData({
        month: selectedMonth,
        year: selectedYear,
        baseSalary: employeeInfo.base_salary,
        bonus: bonus,
        transport: transport,
        absences: absences,
        absenceDays: absences.length,
        deduction: deduction,
        socialCharges: socialCharges,
        grossSalary: grossSalary,
        netSalary: Math.round(netSalary * 100) / 100,
      });
      
      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les données de paie');
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!employeeInfo) return <ErrorMessage message="Aucune information employée trouvée" />;

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
        💰 Ma fiche de paie
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '24px' }}>
        Consultez votre salaire et le détail des déductions
      </p>

      {/* Sélecteur de mois */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        background: '#13131f',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.07)',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          style={{
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '10px 16px',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          {monthNames.map((name, idx) => (
            <option key={idx} value={idx}>{name}</option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          style={{
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '10px 16px',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>

        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            background: '#3b82f6',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 24px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {showDetails ? '📄 Masquer les détails' : '📊 Voir le bulletin détaillé'}
        </button>
      </div>

      {payrollData && (
        <>
          <div style={{
            background: 'linear-gradient(135deg, #1e1e3a, #13131f)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '40px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '8px' }}>
              Salaire net du {monthNames[selectedMonth]} {selectedYear}
            </div>
            <div style={{ color: '#4ade80', fontSize: '48px', fontWeight: 'bold' }}>
              {payrollData.netSalary} €
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '8px' }}>
              Après déductions et charges
            </div>
          </div>

          {showDetails && (
            <div style={{
              background: '#13131f',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '24px',
              animation: 'fadeIn 0.3s ease'
            }}>
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                📋 Détail du bulletin
              </h3>

              <div style={{ background: 'rgba(74,222,128,0.05)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ color: '#4ade80', marginBottom: '12px', fontWeight: 600 }}>✓ Gains</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Salaire de base</span>
                  <span style={{ color: '#fff' }}>{payrollData.baseSalary} €</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Prime (5%)</span>
                  <span style={{ color: '#fff' }}>+ {payrollData.bonus} €</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Transport</span>
                  <span style={{ color: '#fff' }}>+ {payrollData.transport} €</span>
                </div>
              </div>

              <div style={{ background: 'rgba(239,68,68,0.05)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ color: '#f87171', marginBottom: '12px', fontWeight: 600 }}>✗ Absences</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {payrollData.absenceDays} jour(s) d'absence
                  </span>
                  <span style={{ color: '#f87171' }}>- {payrollData.deduction.toFixed(2)} €</span>
                </div>
                {payrollData.absences.map((a, i) => (
                  <div key={i} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginLeft: '12px' }}>
                    {a.date}
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(239,68,68,0.2)', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Charges sociales (20%)</span>
                  <span style={{ color: '#f87171' }}>- {payrollData.socialCharges.toFixed(2)} €</span>
                </div>
              </div>

              <div style={{
                background: 'rgba(59,130,246,0.1)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>Salaire net</span>
                <span style={{ color: '#4ade80', fontSize: '24px', fontWeight: 'bold' }}>{payrollData.netSalary} €</span>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default PayrollEmploye;
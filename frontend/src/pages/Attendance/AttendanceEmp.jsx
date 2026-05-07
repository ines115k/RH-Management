import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../../api/attendanceApi'; 
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const AttendanceEmp = () => {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadTodayAttendance();
  }, []);

  const loadTodayAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceApi.getMyToday();
      setTodayAttendance(response.data?.record || null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger le pointage');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const result = await attendanceApi.checkInSelf();
      alert(result.data?.detail || 'Arrivée enregistrée');
      await loadTodayAttendance();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors du pointage entrée');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const result = await attendanceApi.checkOutSelf();
      const detail = result.data?.detail || 'Départ enregistré';
      const duration = result.data?.record?.duration || 0;
      alert(`${detail}\nHeures travaillées: ${duration}h`);
      await loadTodayAttendance();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors du pointage sortie');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const record = todayAttendance;
  const hasCheckedIn = !!record?.check_in;
  const checkInTime = record?.check_in ? new Date(record.check_in).toLocaleTimeString() : null;
  const checkOutTime = record?.check_out ? new Date(record.check_out).toLocaleTimeString() : null;
  const workedHours = record?.duration || 0;

  return (
    <div style={{ padding: '32px 36px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, marginBottom: '24px' }}>
        📆 Pointage quotidien
      </h1>

      <div style={{
        background: '#13131f',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.07)',
        padding: '24px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {hasCheckedIn ? '✅' : '⏰'}
          </div>
          <h2 style={{ color: '#fff', fontSize: '20px' }}>
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Check-in */}
          <div style={{
            textAlign: 'center',
            padding: '20px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🚪</div>
            <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '12px' }}>Entrée</h3>
            {checkInTime ? (
              <p style={{ color: '#4ade80', fontSize: '24px', fontWeight: 'bold' }}>
                {checkInTime}
              </p>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                style={{
                  background: '#3b82f6',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {actionLoading ? '⏳ Chargement...' : '✓ Pointer l\'entrée'}
              </button>
            )}
          </div>

          {/* Check-out */}
          <div style={{
            textAlign: 'center',
            padding: '20px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏠</div>
            <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '12px' }}>Sortie</h3>
            {checkOutTime ? (
              <div>
                <p style={{ color: '#4ade80', fontSize: '24px', fontWeight: 'bold' }}>
                  {checkOutTime}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '8px' }}>
                  Heures: {workedHours}h
                </p>
              </div>
            ) : hasCheckedIn ? (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                style={{
                  background: '#f59e0b',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {actionLoading ? '⏳ Chargement...' : '✓ Pointer la sortie'}
              </button>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>Veuillez d'abord pointer l'entrée</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceEmp;
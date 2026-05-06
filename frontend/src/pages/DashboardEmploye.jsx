import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/attendanceAPI';
import { leaveAPI } from '../services/leaveAPI';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';

const DashboardEmploye = () => {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [leaveStats, setLeaveStats] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [attendance, stats, leaves] = await Promise.all([
        attendanceAPI.getTodayAttendance(),
        leaveAPI.getStats(),
        leaveAPI.getMyRequests(),
      ]);
      setTodayAttendance(attendance);
      setLeaveStats(stats);
      setRecentLeaves(Array.isArray(leaves) ? leaves.slice(0, 3) : []);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement:', err);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const result = await attendanceAPI.checkIn();
      alert(result.detail);
      await loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors du pointage entrée');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const result = await attendanceAPI.checkOut();
      alert(`${result.detail}\nHeures travaillées: ${result.worked_hours || 0}h`);
      await loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors du pointage sortie');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const statusColors = {
    pending: { bg: 'rgba(234,179,8,0.1)', text: '#eab308', label: 'En attente' },
    approved: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e', label: 'Approuvé' },
    rejected: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', label: 'Refusé' },
  };

  const leaveTypes = {
    annual: 'Congé annuel',
    sick: 'Congé maladie',
    unpaid: 'Congé sans solde',
    exceptional: 'Congé exceptionnel',
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
        👋 Bonjour, {localStorage.getItem('user_name') || 'Employé'}
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '32px' }}>
        Voici votre tableau de bord personnel
      </p>

      {/* Section Pointage */}
      <div style={{
        background: '#13131f',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.07)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>
          📆 Pointage du jour
        </h2>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>
            {todayAttendance?.has_checked_in ? '✅' : '⏰'}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
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
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚪</div>
            <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Entrée</h3>
            {todayAttendance?.check_in ? (
              <p style={{ color: '#4ade80', fontSize: '20px', fontWeight: 'bold' }}>
                {new Date(todayAttendance.check_in).toLocaleTimeString()}
              </p>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                style={{
                  background: '#3b82f6',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: actionLoading ? 0.7 : 1
                }}
              >
                {actionLoading ? '⏳...' : '✓ Pointer l\'entrée'}
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
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏠</div>
            <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Sortie</h3>
            {todayAttendance?.check_out ? (
              <div>
                <p style={{ color: '#4ade80', fontSize: '20px', fontWeight: 'bold' }}>
                  {new Date(todayAttendance.check_out).toLocaleTimeString()}
                </p>
                {todayAttendance.worked_hours > 0 && (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                    {todayAttendance.worked_hours}h travaillées
                  </p>
                )}
              </div>
            ) : todayAttendance?.has_checked_in ? (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                style={{
                  background: '#f59e0b',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: actionLoading ? 0.7 : 1
                }}
              >
                {actionLoading ? '⏳...' : '✓ Pointer la sortie'}
              </button>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                Pointez d'abord l'entrée
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques Congés */}
      {leaveStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'rgba(234,179,8,0.1)',
            border: '1px solid rgba(234,179,8,0.2)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#eab308' }}>{leaveStats.pending || 0}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>En attente</div>
          </div>
          <div style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#22c55e' }}>{leaveStats.approved || 0}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Approuvés</div>
          </div>
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>{leaveStats.rejected || 0}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Refusés</div>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <Link to="/leave/request" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #7c5cbf20, #5b6cdb20)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            transition: 'all 0.2s',
            cursor: 'pointer'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏖️</div>
            <div style={{ color: '#fff', fontWeight: 600 }}>Demander un congé</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
              Nouvelle demande
            </div>
          </div>
        </Link>
        <Link to="/leave/list" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #7c5cbf20, #5b6cdb20)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
            <div style={{ color: '#fff', fontWeight: 600 }}>Mes congés</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
              Voir historique
            </div>
          </div>
        </Link>
      </div>

      {/* Dernières demandes */}
      {recentLeaves.length > 0 && (
        <div style={{
          background: '#13131f',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.07)',
          padding: '20px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            📝 Dernières demandes de congé
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentLeaves.map((leave) => (
              <div key={leave.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>
                    {leaveTypes[leave.type]}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                    {new Date(leave.start_date).toLocaleDateString('fr-FR')} → {new Date(leave.end_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  background: statusColors[leave.status]?.bg,
                  fontSize: '11px',
                  fontWeight: 500,
                  color: statusColors[leave.status]?.text
                }}>
                  {statusColors[leave.status]?.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardEmploye;
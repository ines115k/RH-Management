import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../../services/attendanceAPI';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';

const AttendanceHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(30);

  useEffect(() => {
    loadHistory();
  }, [limit]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await attendanceAPI.getHistory(limit);
      setHistory(data);
      setError(null);
    } catch (err) {
      setError('Impossible de charger l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('fr-FR');
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
        📋 Historique des pointages
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '24px' }}>
        Consultez vos jours de présence
      </p>

      {history.length === 0 ? (
        <div style={{
          background: '#13131f',
          borderRadius: '16px',
          padding: '60px',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.07)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>Aucun historique trouvé</p>
        </div>
      ) : (
        <div style={{
          background: '#13131f',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.07)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '16px', textAlign: 'left', color: 'rgba(255,255,255,0.6)' }}>Date</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'rgba(255,255,255,0.6)' }}>Entrée</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'rgba(255,255,255,0.6)' }}>Sortie</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'rgba(255,255,255,0.6)' }}>Heures</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'rgba(255,255,255,0.6)' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => (
                <tr key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 16px', color: '#fff' }}>{formatDate(record.date)}</td>
                  <td style={{ padding: '12px 16px', color: '#fff' }}>{formatTime(record.check_in)}</td>
                  <td style={{ padding: '12px 16px', color: '#fff' }}>{formatTime(record.check_out)}</td>
                  <td style={{ padding: '12px 16px', color: '#fff' }}>{record.duration || 0}h</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      background: record.status === 'present' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                      color: record.status === 'present' ? '#4ade80' : '#f87171'
                    }}>
                      {record.status === 'present' ? 'Présent' : record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
import React, { useState, useEffect } from 'react';
import { leaveAPI } from '../../services/leaveAPI';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const LeaveListPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState(null);

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

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, statsData] = await Promise.all([
        leaveAPI.getMyRequests(),
        leaveAPI.getStats(),
      ]);
      setRequests(Array.isArray(requestsData) ? requestsData : []);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError('Impossible de charger les demandes');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRequests = () => {
    if (filter === 'all') return requests;
    return requests.filter(req => req.status === filter);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const filteredRequests = getFilteredRequests();

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, marginBottom: '24px' }}>
        📋 Mes demandes de congé
      </h1>

      {/* Statistiques */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#eab308' }}>{stats.pending}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>En attente</div>
          </div>
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#22c55e' }}>{stats.approved}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Approuvés</div>
          </div>
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>{stats.rejected}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Refusés</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'Toutes' },
          { key: 'pending', label: 'En attente' },
          { key: 'approved', label: 'Approuvés' },
          { key: 'rejected', label: 'Refusés' }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: filter === item.key ? '#3b82f6' : 'rgba(255,255,255,0.05)',
              color: filter === item.key ? '#fff' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filteredRequests.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>Aucune demande de congé trouvée</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredRequests.map((request) => (
            <div key={request.id} style={{
              background: '#13131f',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px',
              padding: '20px',
              transition: 'border 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                    {leaveTypes[request.type]}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '4px' }}>
                    Du {formatDate(request.start_date)} au {formatDate(request.end_date)}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                    📅 {request.days_count} jour(s)
                  </p>
                </div>
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: statusColors[request.status]?.bg,
                  border: `1px solid ${statusColors[request.status]?.text}20`
                }}>
                  <span style={{ color: statusColors[request.status]?.text, fontSize: '13px', fontWeight: 500 }}>
                    {statusColors[request.status]?.label}
                  </span>
                </div>
              </div>
              {request.reason && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '8px'
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600 }}>Motif :</span> {request.reason}
                  </p>
                </div>
              )}
              <div style={{ marginTop: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                Demandé le {new Date(request.created_at).toLocaleString('fr-FR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaveListPage;
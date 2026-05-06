import React, { useState, useEffect } from 'react';
import { leaveAPI } from '../../services/leaveAPI';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';

const LeaveCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      const data = await leaveAPI.getAllRequests();
      setRequests(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Impossible de charger le calendrier des absences');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Obtenir les jours du mois
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = dimanche
    
    const days = [];
    
    // Ajuster pour que la semaine commence lundi
    const startOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    // Jours du mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        leaves: []
      });
    }
    
    // Jours du mois courant
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
        leaves: []
      });
    }
    
    // Jours du mois suivant (pour compléter la grille)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        leaves: []
      });
    }
    
    return days;
  };

  // Assigner les congés aux jours
  const getDaysWithLeaves = () => {
    const days = getDaysInMonth(currentDate);
    
    days.forEach(day => {
      const dateStr = day.date.toISOString().split('T')[0];
      
      requests.forEach(leave => {
        if (leave.status === 'approved') {
          const startDate = new Date(leave.start_date).toISOString().split('T')[0];
          const endDate = new Date(leave.end_date).toISOString().split('T')[0];
          
          if (dateStr >= startDate && dateStr <= endDate) {
            day.leaves.push(leave);
          }
        }
      });
    });
    
    return days;
  };

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const getLeaveTypeLabel = (type) => {
    const types = {
      annual: 'Congé annuel',
      sick: 'Congé maladie',
      unpaid: 'Congé sans solde',
      exceptional: 'Congé exceptionnel',
      maternity: 'Congé maternité'
    };
    return types[type] || type;
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      annual: '#3b82f6',
      sick: '#ef4444',
      unpaid: '#f59e0b',
      exceptional: '#8b5cf6',
      maternity: '#ec489a'
    };
    return colors[type] || '#6b7280';
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const daysWithLeaves = getDaysWithLeaves();

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
          📆 Calendrier des absences
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
          Vue d'ensemble des congés approuvés
        </p>
      </div>

      {/* En-tête du calendrier */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => changeMonth(-1)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ◀ Mois précédent
        </button>
        
        <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 600 }}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <button
          onClick={() => changeMonth(1)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Mois suivant ▶
        </button>
      </div>

      {/* Légende */}
      <div style={{
        display: 'flex',
        gap: '24px',
        marginBottom: '24px',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3b82f6' }}></div>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Congé annuel</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444' }}></div>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Congé maladie</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f59e0b' }}></div>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Sans solde</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#8b5cf6' }}></div>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Congé exceptionnel</span>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div style={{
        background: '#13131f',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden'
      }}>
        {/* Jours de la semaine */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.07)'
        }}>
          {weekDays.map(day => (
            <div key={day} style={{
              padding: '16px 12px',
              textAlign: 'center',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.6)',
              fontSize: '14px'
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Jours du mois */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)'
        }}>
          {daysWithLeaves.map((day, index) => (
            <div
              key={index}
              style={{
                minHeight: '120px',
                padding: '8px',
                borderRight: index % 7 !== 6 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: day.isCurrentMonth ? 'transparent' : 'rgba(0,0,0,0.2)',
                opacity: day.isCurrentMonth ? 1 : 0.5,
                position: 'relative'
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: day.isCurrentMonth ? '#fff' : 'rgba(255,255,255,0.3)',
                marginBottom: '8px'
              }}>
                {day.date.getDate()}
              </div>
              
              {day.leaves.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {day.leaves.slice(0, 3).map((leave, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedLeave(leave)}
                      style={{
                        fontSize: '11px',
                        padding: '4px 6px',
                        background: `${getLeaveTypeColor(leave.type)}20`,
                        borderLeft: `3px solid ${getLeaveTypeColor(leave.type)}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'rgba(255,255,255,0.8)'
                      }}
                      title={leave.reason}
                    >
                      👤 {leave.employee_name || leave.employee_id?.slice(-6) || 'Employé'}
                    </div>
                  ))}
                  {day.leaves.length > 3 && (
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                      +{day.leaves.length - 3} autre(s)
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal des détails du congé */}
      {selectedLeave && (
        <div
          onClick={() => setSelectedLeave(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a2e',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700 }}>Détails du congé</h3>
              <button
                onClick={() => setSelectedLeave(null)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '4px' }}>Type</div>
              <div style={{ color: '#fff', fontSize: '16px', fontWeight: 500 }}>
                {getLeaveTypeLabel(selectedLeave.type)}
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '4px' }}>Période</div>
              <div style={{ color: '#fff', fontSize: '14px' }}>
                {new Date(selectedLeave.start_date).toLocaleDateString('fr-FR')} → {new Date(selectedLeave.end_date).toLocaleDateString('fr-FR')}
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '4px' }}>Durée</div>
              <div style={{ color: '#fff', fontSize: '14px' }}>{selectedLeave.days_count} jour(s)</div>
            </div>
            
            {selectedLeave.reason && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '4px' }}>Motif</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                  {selectedLeave.reason}
                </div>
              </div>
            )}
            
            <button
              onClick={() => setSelectedLeave(null)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Résumé */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
          📌 Les congés approuvés sont affichés sur le calendrier. Cliquez sur un congé pour voir les détails.
        </p>
      </div>
    </div>
  );
};

export default LeaveCalendar;
import React, { useState } from 'react';
import { leaveAPI } from '../../api/leaveAPI'; // Assurez-vous que le chemin est correct

const LeaveRequestPage = () => {
  const [formData, setFormData] = useState({
    leave_type: 'annual',   // ← renommé
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const leaveTypes = {
    annual: 'Congé annuel',
    sick: 'Congé maladie',
    unpaid: 'Congé sans solde',
    exceptional: 'Congé exceptionnel',
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await leaveAPI.createRequest(formData);
      setSuccess('✅ Demande de congé envoyée avec succès !');
      setFormData({
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        reason: '',
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la création de la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
        🏖️ Nouvelle demande de congé
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '24px' }}>
        Les demandes seront examinées par votre responsable RH
      </p>

      <form onSubmit={handleSubmit} style={{
        background: '#13131f',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.07)',
        padding: '24px'
      }}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#f87171',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#4ade80',
            fontSize: '14px'
          }}>
            {success}
          </div>
        )}

        {/* Type de congé */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '12px',
            marginBottom: '6px',
            fontWeight: 500
          }}>
            Type de congé *
          </label>
          <select
            name="leave_type"   // ← modifié
            value={formData.leave_type}
            onChange={handleChange}
            style={{
              width: '100%',
              background: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '11px 14px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
            required
          >
            {Object.entries(leaveTypes).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Date début */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '12px',
            marginBottom: '6px',
            fontWeight: 500
          }}>
            Date de début *
          </label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '11px 14px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
            required
          />
        </div>

        {/* Date fin */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '12px',
            marginBottom: '6px',
            fontWeight: 500
          }}>
            Date de fin *
          </label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '11px 14px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
            required
          />
        </div>

        {/* Motif */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '12px',
            marginBottom: '6px',
            fontWeight: 500
          }}>
            Motif
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows="4"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '11px 14px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            placeholder="Raison de votre demande de congé..."
          />
        </div>

        {/* Bouton */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #7c5cbf, #5b6cdb)',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 22px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'opacity 0.15s',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '⏳ Envoi en cours...' : '📨 Envoyer la demande'}
        </button>
      </form>
    </div>
  );
};

export default LeaveRequestPage;
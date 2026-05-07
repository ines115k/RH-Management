import React, { useState, useEffect } from 'react';
import { recruitmentApi } from '../../api/recruitmentApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const RecruitmentEmploye = () => {
  const [offers, setOffers]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [success, setSuccess]         = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => { loadOffers(); }, []);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const { data } = await recruitmentApi.getOffers({ status: 'published' });
      // Le backend retourne { total, records }
      setOffers(data.records || []);
      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError("Impossible de charger les offres d'emploi");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (offer) => {
    setSelectedOffer(offer);
    setCoverLetter('');
    setSuccess(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coverLetter.trim()) {
      setError('Veuillez rédiger une lettre de motivation');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await recruitmentApi.createApplication({
        job_offer_id: selectedOffer.id,
        cover_letter: coverLetter,
      });
      setSuccess('✅ Candidature envoyée avec succès ! Nous vous contacterons bientôt.');
      setSelectedOffer(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'envoi de la candidature");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const contractLabel = (type) =>
    ({ cdi: 'CDI', cdd: 'CDD', stage: 'Stage', freelance: 'Freelance' }[type] || type.toUpperCase());

  if (loading) return <LoadingSpinner />;
  if (error && !selectedOffer) return <ErrorMessage message={error} />;

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
        🎯 Offres d'emploi internes
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '32px' }}>
        Découvrez les opportunités de carrière au sein de l'entreprise
      </p>

      {/* Message succès */}
      {success && (
        <div style={{
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: '12px', padding: '16px', marginBottom: '24px',
          color: '#4ade80', fontSize: '14px',
        }}>
          {success}
        </div>
      )}

      {/* Liste des offres */}
      {offers.length === 0 ? (
        <div style={{
          background: '#13131f', borderRadius: '16px', padding: '60px',
          textAlign: 'center', border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>Aucune offre d'emploi disponible pour le moment</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Revenez plus tard !</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {offers.map((offer) => (
            <div key={offer.id} style={{
              background: '#13131f', borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.07)', padding: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                    {offer.title}
                  </h2>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Tag color="#3b82f6">🏢 {offer.department}</Tag>
                    <Tag color="#22c55e">📄 {contractLabel(offer.contract_type)}</Tag>
                    {offer.location && <Tag color="#f59e0b">📍 {offer.location}</Tag>}
                  </div>
                </div>
                <button onClick={() => handleApply(offer)} style={applyBtnStyle}>
                  Postuler ➔
                </button>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '12px', lineHeight: 1.6 }}>
                {offer.description}
              </p>

              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '12px', marginTop: '8px' }}>
                <div style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>🎓 Prérequis :</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{offer.requirements}</div>
              </div>

              <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                📅 Publiée le {formatDate(offer.published_date)}
                {offer.closing_date && ` | Candidatures jusqu'au ${formatDate(offer.closing_date)}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal candidature */}
      {selectedOffer && (
        <div
          onClick={() => setSelectedOffer(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a2e', borderRadius: '20px', padding: '28px',
              maxWidth: '520px', width: '100%', border: '1px solid rgba(255,255,255,0.1)',
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            {/* En-tête modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Postuler</h3>
              <button onClick={() => setSelectedOffer(null)} style={closeBtnStyle}>✕</button>
            </div>

            {/* Offre cible */}
            <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px' }}>
              <div style={{ color: '#60a5fa', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                {selectedOffer.title}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                {selectedOffer.department}{selectedOffer.location ? ` · ${selectedOffer.location}` : ''}
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px', padding: '12px', marginBottom: '16px',
                color: '#f87171', fontSize: '13px',
              }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>Lettre de motivation *</label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                required
                rows={6}
                placeholder="Pourquoi êtes-vous intéressé par ce poste ?"
                style={{ ...inputStyle, resize: 'vertical' }}
              />

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setSelectedOffer(null)} style={cancelBtnStyle}>
                  Annuler
                </button>
                <button type="submit" disabled={submitting} style={{ ...applyBtnStyle, flex: 1, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? '⏳ Envoi en cours...' : '📤 Envoyer ma candidature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Helpers ── */
const Tag = ({ color, children }) => (
  <span style={{
    background: `${color}25`, color, padding: '4px 12px',
    borderRadius: '20px', fontSize: '12px',
  }}>
    {children}
  </span>
);

const labelStyle = { color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '6px', display: 'block' };
const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
  padding: '10px 12px', color: '#fff', fontSize: '14px', boxSizing: 'border-box',
};
const applyBtnStyle = {
  background: 'linear-gradient(135deg, #7c5cbf, #5b6cdb)', border: 'none',
  borderRadius: '8px', padding: '10px 24px', color: '#fff',
  fontWeight: 600, cursor: 'pointer', fontSize: '14px', marginTop: '8px',
};
const cancelBtnStyle = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', padding: '10px 20px', color: '#fff', cursor: 'pointer', fontSize: '14px',
};
const closeBtnStyle = {
  background: 'rgba(255,255,255,0.05)', border: 'none', fontSize: '18px',
  cursor: 'pointer', color: '#fff', width: '32px', height: '32px', borderRadius: '8px',
};

export default RecruitmentEmploye;
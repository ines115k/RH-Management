import React, { useState, useEffect } from 'react';
import { recruitmentAPI } from '../../services/recruitmentAPI';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';

const RecruitmentEmploye = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Formulaire candidature
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    current_position: '',
    experience_years: '',
    cover_letter: '',
    portfolio_url: '',
    linkedin_url: '',
  });
  const [cvFile, setCvFile] = useState(null);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const data = await recruitmentAPI.getOffers();
      setOffers(data.offers || []);
      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les offres d\'emploi');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (offer) => {
    setSelectedOffer(offer);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      current_position: '',
      experience_years: '',
      cover_letter: '',
      portfolio_url: '',
      linkedin_url: '',
    });
    setCvFile(null);
    setSuccess(null);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    setCvFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);

    // Validation
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.cover_letter) {
      setError('Veuillez remplir tous les champs obligatoires');
      setSubmitting(false);
      return;
    }

    if (!cvFile) {
      setError('Veuillez télécharger votre CV (PDF)');
      setSubmitting(false);
      return;
    }

    try {
      const formPayload = new FormData();
      formPayload.append('offer_id', selectedOffer.id);
      formPayload.append('first_name', formData.first_name);
      formPayload.append('last_name', formData.last_name);
      formPayload.append('email', formData.email);
      formPayload.append('phone', formData.phone || '');
      formPayload.append('current_position', formData.current_position || '');
      formPayload.append('experience_years', formData.experience_years || 0);
      formPayload.append('cover_letter', formData.cover_letter);
      formPayload.append('portfolio_url', formData.portfolio_url || '');
      formPayload.append('linkedin_url', formData.linkedin_url || '');
      formPayload.append('cv', cvFile);

      await recruitmentAPI.apply(formPayload);
      setSuccess('✅ Candidature envoyée avec succès ! Nous vous contacterons bientôt.');
      setSelectedOffer(null);
      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.detail || 'Erreur lors de l\'envoi de la candidature');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const getContractLabel = (type) => {
    const labels = {
      'CDI': 'CDI',
      'CDD': 'CDD',
      'Stage': 'Stage',
      'Freelance': 'Freelance',
      'Alternance': 'Alternance'
    };
    return labels[type] || type;
  };

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

      {/* Liste des offres */}
      {offers.length === 0 ? (
        <div style={{
          background: '#13131f',
          borderRadius: '16px',
          padding: '60px',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.07)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>Aucune offre d'emploi disponible pour le moment</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Revenez plus tard !</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {offers.map((offer) => (
            <div key={offer.id} style={{
              background: '#13131f',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '24px',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                    {offer.title}
                  </h2>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: 'rgba(59,130,246,0.2)',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      color: '#60a5fa'
                    }}>🏢 {offer.department}</span>
                    <span style={{
                      background: 'rgba(34,197,94,0.2)',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      color: '#4ade80'
                    }}>📄 {getContractLabel(offer.contract_type)}</span>
                    <span style={{
                      background: 'rgba(245,158,11,0.2)',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      color: '#fbbf24'
                    }}>📍 {offer.location}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleApply(offer)}
                  style={{
                    background: 'linear-gradient(135deg, #7c5cbf, #5b6cdb)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginTop: '8px'
                  }}
                >
                  Postuler ➔
                </button>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '12px', lineHeight: 1.5 }}>
                {offer.description}
              </p>
              
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '8px'
              }}>
                <div style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  🎓 Prérequis :
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                  {offer.requirements}
                </div>
              </div>

              <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                📅 Publiée le {formatDate(offer.posted_date)}
                {offer.deadline && ` | Candidatures jusqu'au ${formatDate(offer.deadline)}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de candidature */}
      {selectedOffer && (
        <div
          onClick={() => setSelectedOffer(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            overflowY: 'auto',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a2e',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '550px',
              width: '100%',
              border: '1px solid rgba(255,255,255,0.1)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700 }}>Postuler</h3>
              <button
                onClick={() => setSelectedOffer(null)}
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

            <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px' }}>
              <div style={{ color: '#60a5fa', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                {selectedOffer.title}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                {selectedOffer.department} · {selectedOffer.location}
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                color: '#f87171',
                fontSize: '13px'
              }}>
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                color: '#4ade80',
                fontSize: '13px'
              }}>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '5px', display: 'block' }}>
                  Prénom *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '5px', display: 'block' }}>
                  Nom *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '5px', display: 'block' }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '5px', display: 'block' }}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '5px', display: 'block' }}>
                  Poste actuel
                </label>
                <input
                  type="text"
                  name="current_position"
                  value={formData.current_position}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '5px', display: 'block' }}>
                  Années d'expérience
                </label>
                <input
                  type="number"
                  name="experience_years"
                  value={formData.experience_years}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '5px', display: 'block' }}>
                  Lettre de motivation *
                </label>
                <textarea
                  name="cover_letter"
                  value={formData.cover_letter}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Pourquoi êtes-vous intéressé par ce poste ?"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '5px', display: 'block' }}>
                  CV (PDF) *
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '5px', display: 'block' }}>
                  Portfolio (optionnel)
                </label>
                <input
                  type="url"
                  name="portfolio_url"
                  value={formData.portfolio_url}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                  placeholder="https://..."
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '5px', display: 'block' }}>
                  LinkedIn (optionnel)
                </label>
                <input
                  type="url"
                  name="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #7c5cbf, #5b6cdb)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  fontSize: '14px'
                }}
              >
                {submitting ? '⏳ Envoi en cours...' : '📤 Envoyer ma candidature'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruitmentEmploye;
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import JobOffersAdmin from './JobOffersAdmin';
import ApplicationsAdmin from './ApplicationsAdmin';

export default function RecruitmentPage() {
  const { isAdmin, isManager } = useAuth();
  const [tab, setTab] = useState('offers');
  if (!isAdmin && !isManager) return <div style={{ padding: 40, textAlign: 'center', color: '#fff' }}><h3>Accès non autorisé</h3></div>;
  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200 }}>
      <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Recrutement</h2>
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        <button onClick={() => setTab('offers')} style={tabStyle(tab === 'offers')}>📋 Offres d'emploi</button>
        <button onClick={() => setTab('applications')} style={tabStyle(tab === 'applications')}>📝 Candidatures</button>
      </div>
      {tab === 'offers' && <JobOffersAdmin />}
      {tab === 'applications' && <ApplicationsAdmin />}
    </div>
  );
}
const tabStyle = (active) => ({ padding: '9px 20px', borderRadius: 8, border: 'none', background: active ? 'rgba(120,60,200,0.35)' : 'transparent', color: active ? '#a78bfa' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer' });
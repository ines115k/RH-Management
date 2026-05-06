import { useState, useEffect, useCallback } from 'react';
import { recruitmentApi } from '../../api/recruitmentApi';
import { Card, Button, Modal, Input, Select, Spinner } from '../../components/ui/index.jsx';

const CONTRACT_TYPES = [{ value: 'cdi', label: 'CDI' }, { value: 'cdd', label: 'CDD' }, { value: 'stage', label: 'Stage' }, { value: 'freelance', label: 'Freelance' }];
const DEPARTMENTS = ['Informatique','RH','Finance','Commercial','Marketing','Production','Logistique','Direction'];

function OfferForm({ offer, onClose, onSaved }) {
  const isEdit = !!offer;
  const [form, setForm] = useState({ title: offer?.title || '', department: offer?.department || '', contract_type: offer?.contract_type || 'cdi', location: offer?.location || '', description: offer?.description || '', requirements: offer?.requirements || '', closing_date: offer?.closing_date?.slice(0,10) || '', status: offer?.status || 'draft' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async () => {
    if (!form.title || !form.department || !form.description || !form.requirements) { setError('Champs obligatoires manquants'); return; }
    setLoading(true); setError('');
    try {
      if (isEdit) await recruitmentApi.updateOffer(offer.id, form);
      else await recruitmentApi.createOffer(form);
      onSaved();
    } catch (err) { setError(err.response?.data?.detail || 'Erreur'); }
    finally { setLoading(false); }
  };
  return (
    <Modal title={isEdit ? 'Modifier l\'offre' : 'Nouvelle offre'} onClose={onClose} width={650}>
      {error && <div style={{ color: '#f87171', marginBottom: 16 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Input label="Titre" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} />
        <select value={form.department} onChange={e => setForm(p=>({...p,department:e.target.value}))} style={selectStyle}><option value="">Département *</option>{DEPARTMENTS.map(d=><option key={d}>{d}</option>)}</select>
        <Select label="Contrat" value={form.contract_type} onChange={e=>setForm(p=>({...p,contract_type:e.target.value}))} options={CONTRACT_TYPES} />
        <Input label="Lieu" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} />
      </div>
      <Input label="Description" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} textarea rows={4} />
      <Input label="Prérequis" value={form.requirements} onChange={e=>setForm(p=>({...p,requirements:e.target.value}))} textarea rows={3} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Input label="Date clôture" type="date" value={form.closing_date} onChange={e=>setForm(p=>({...p,closing_date:e.target.value}))} />
        <Select label="Statut" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} options={[{value:'draft',label:'Brouillon'},{value:'published',label:'Publiée'},{value:'closed',label:'Clôturée'}]} />
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:24 }}><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} loading={loading}>{isEdit?'Modifier':'Créer'}</Button></div>
    </Modal>
  );
}

export default function JobOffersAdmin() {
  const [offers, setOffers] = useState([]); const [loading, setLoading] = useState(true); const [showForm, setShowForm] = useState(false); const [editTarget, setEditTarget] = useState(null); const [refresh, setRefresh] = useState(0);
  const load = useCallback(async () => { setLoading(true); try { const {data} = await recruitmentApi.getOffers({limit:100}); setOffers(data.records); } catch(e){} finally{setLoading(false)} }, [refresh]);
  useEffect(()=>{load();},[load]);
  const handleDelete = async (id) => { if(!window.confirm('Supprimer cette offre ?')) return; await recruitmentApi.deleteOffer(id); setRefresh(r=>r+1); };
  const statusColor = (s) => s==='published'?'#1d9e75': s==='closed'?'#e85d24':'#e8a430';
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between' }}><h3 style={{margin:0,color:'#fff'}}>Offres d'emploi</h3><Button onClick={()=>{setEditTarget(null);setShowForm(true);}}>+ Nouvelle offre</Button></div>
      {loading?<Spinner/>:offers.length===0?<div style={{textAlign:'center',padding:60,color:'rgba(255,255,255,0.3)'}}>Aucune offre</div>:
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Titre','Département','Contrat','Statut','Publiée le','Actions'].map(h=><th key={h} style={{padding:'14px 20px',color:'rgba(255,255,255,0.35)',fontSize:11,fontWeight:600,textAlign:'left'}}>{h}</th>)}</tr></thead>
        <tbody>{offers.map(o=><tr key={o.id} style={{borderTop:'1px solid rgba(255,255,255,0.05)'}}>
          <td style={{padding:'14px 20px',color:'rgba(255,255,255,0.7)'}}>{o.title}</td>
          <td style={{padding:'14px 20px',color:'rgba(255,255,255,0.7)'}}>{o.department}</td>
          <td style={{padding:'14px 20px',color:'rgba(255,255,255,0.7)'}}>{o.contract_type.toUpperCase()}</td>
          <td style={{padding:'14px 20px',color:'rgba(255,255,255,0.7)'}}><span style={{color:statusColor(o.status), background:`${statusColor(o.status)}25`, padding:'2px 8px', borderRadius:12, fontSize:11}}>{o.status}</span></td>
          <td style={{padding:'14px 20px',color:'rgba(255,255,255,0.7)'}}>{o.published_date?new Date(o.published_date).toLocaleDateString('fr-FR'):'—'}</td>
          <td style={{padding:'14px 20px'}}><button onClick={()=>{setEditTarget(o);setShowForm(true);}} style={{background:'none', border:'1px solid rgba(167,139,250,0.3)', color:'#a78bfa', borderRadius:6, padding:'4px 12px', fontSize:12, cursor:'pointer'}}>Modifier</button><button onClick={()=>handleDelete(o.id)} style={{marginLeft:8, ...{background:'none', border:'1px solid rgba(167,139,250,0.3)', color:'#f87171', borderRadius:6, padding:'4px 12px', fontSize:12, cursor:'pointer'}}}>Supprimer</button></td>
        </tr>)}</tbody></table>}
      {showForm && <OfferForm offer={editTarget} onClose={()=>setShowForm(false)} onSaved={()=>{setShowForm(false); setRefresh(r=>r+1);}} />}
    </Card>
  );
}
const selectStyle = { width:'100%', background:'#1a1a2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 14px', color:'#fff', fontSize:14, marginBottom:16 };
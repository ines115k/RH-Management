import { useState, useEffect, useCallback } from 'react';
import { recruitmentApi } from '../../api/recruitmentApi';
import { Card, Button, Modal, Select, Spinner, Avatar, Input } from '../../components/ui/index.jsx';

const STATUS_OPTIONS = [{ value:'pending', label:'En attente', color:'#e8a430' }, { value:'reviewed', label:'Examinée', color:'#3b82f6' }, { value:'accepted', label:'Acceptée', color:'#1d9e75' }, { value:'rejected', label:'Rejetée', color:'#f87171' }];
function StatusBadge({status}){ const s=STATUS_OPTIONS.find(o=>o.value===status)||{label:status,color:'#888'}; return <span style={{background:s.color+'25',color:s.color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600}}>{s.label}</span>; }

function UpdateStatusModal({ application, onClose, onUpdated }) {
  const [status, setStatus] = useState(application.status);
  const [feedback, setFeedback] = useState(application.feedback||'');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => { setLoading(true); await recruitmentApi.updateApplicationStatus(application.id, {status, feedback}); setLoading(false); onUpdated(); };
  return (
    <Modal title={`Mettre à jour - ${application.employee_name}`} onClose={onClose} width={500}>
      <Select label="Statut" value={status} onChange={e=>setStatus(e.target.value)} options={STATUS_OPTIONS} />
      <Input label="Feedback" value={feedback} onChange={e=>setFeedback(e.target.value)} textarea rows={3} />
      <div style={{display:'flex', justifyContent:'flex-end', gap:12, marginTop:20}}><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} loading={loading}>Enregistrer</Button></div>
    </Modal>
  );
}

export default function ApplicationsAdmin() {
  const [apps, setApps] = useState([]); const [loading, setLoading] = useState(true); const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ job_offer_id:'', status:'' }); const [offers, setOffers] = useState([]); const [refresh, setRefresh] = useState(0);
  useEffect(()=>{ recruitmentApi.getOffers({limit:100, status:'published'}).then(({data})=>setOffers(data.records)).catch(()=>{}); },[]);
  const load = useCallback(async () => { setLoading(true); try { const params = {}; if(filters.job_offer_id) params.job_offer_id = filters.job_offer_id; if(filters.status) params.status = filters.status; const {data}=await recruitmentApi.getApplications(params); setApps(data.records); } catch(e){} finally{setLoading(false);} }, [filters, refresh]);
  useEffect(()=>{load();},[load]);
  const handleDelete = async (id) => { if(!window.confirm('Supprimer cette candidature ?')) return; await recruitmentApi.deleteApplication(id); setRefresh(r=>r+1); };
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display:'flex', gap:12, flexWrap:'wrap' }}>
        <select value={filters.job_offer_id} onChange={e=>setFilters(p=>({...p, job_offer_id:e.target.value}))} style={{background:'#1a1a2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', color:'#fff', fontSize:12}}><option value="">Toutes offres</option>{offers.map(o=><option key={o.id} value={o.id}>{o.title}</option>)}</select>
        <select value={filters.status} onChange={e=>setFilters(p=>({...p, status:e.target.value}))} style={{background:'#1a1a2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', color:'#fff', fontSize:12}}><option value="">Tous statuts</option>{STATUS_OPTIONS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select>
      </div>
      {loading?<Spinner/>:apps.length===0?<div style={{textAlign:'center', padding:60, color:'rgba(255,255,255,0.3)'}}>Aucune candidature</div>:
        <table style={{width:'100%', borderCollapse:'collapse'}}><thead><tr>{['Candidat','Offre','Postulé le','Statut','Actions'].map(h=><th key={h} style={{padding:'14px 20px', color:'rgba(255,255,255,0.35)', fontSize:11, fontWeight:600, textAlign:'left'}}>{h}</th>)}</tr></thead>
        <tbody>{apps.map(a=><tr key={a.id} style={{borderTop:'1px solid rgba(255,255,255,0.05)'}}>
          <td style={{padding:'14px 20px'}}><div style={{display:'flex', alignItems:'center', gap:12}}><Avatar name={a.employee_name} size={36}/><div><div style={{color:'#fff', fontSize:13, fontWeight:600}}>{a.employee_name}</div><div style={{color:'rgba(255,255,255,0.4)', fontSize:11}}>{a.employee_id}</div></div></div></td>
          <td style={{padding:'14px 20px', color:'rgba(255,255,255,0.7)'}}>{a.job_title}</td>
          <td style={{padding:'14px 20px', color:'rgba(255,255,255,0.7)'}}>{new Date(a.applied_date).toLocaleDateString('fr-FR')}</td>
          <td style={{padding:'14px 20px'}}><StatusBadge status={a.status}/></td>
          <td style={{padding:'14px 20px'}}><button onClick={()=>setSelected(a)} style={{background:'none', border:'1px solid rgba(167,139,250,0.3)', color:'#a78bfa', borderRadius:6, padding:'4px 12px', fontSize:12, cursor:'pointer'}}>Évaluer</button><button onClick={()=>handleDelete(a.id)} style={{marginLeft:8, background:'none', border:'1px solid #f8717140', color:'#f87171', borderRadius:6, padding:'4px 12px', fontSize:12, cursor:'pointer'}}>Supprimer</button></td>
        </tr>)}</tbody></table>}
      {selected && <UpdateStatusModal application={selected} onClose={()=>setSelected(null)} onUpdated={()=>{setSelected(null); setRefresh(r=>r+1);}} />}
    </Card>
  );
}
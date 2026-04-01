import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  // Déjà connecté → rediriger
  if (user) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.email, form.password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.detail || 'Erreur de connexion. Vérifiez vos identifiants.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.bg}>
      {/* Orbes décoratifs */}
      <div style={{ ...S.orb, top: '12%', left: '8%',  background: 'rgba(120,60,200,0.3)' }} />
      <div style={{ ...S.orb, bottom: '15%', right: '6%', background: 'rgba(60,80,220,0.2)', width: 300, height: 300 }} />
      <div style={{ ...S.orb, top: '55%', left: '30%', background: 'rgba(80,40,180,0.15)', width: 250, height: 250 }} />

      <div style={S.card}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'linear-gradient(135deg,#a78bfa,#818cf8)' }} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>Optimize HRM</span>
        </div>

        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>
          Bienvenue 👋
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: '0 0 32px' }}>
          Connectez-vous à votre portail RH
        </p>

        {/* Erreur */}
        {error && (
          <div style={S.errorBanner}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={S.label}>Email</label>
          <input
            style={S.input}
            type="email"
            placeholder="vous@entreprise.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autoFocus
          />

          <label style={{ ...S.label, marginTop: 16 }}>Mot de passe</label>
          <input
            style={S.input}
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={{ ...S.btn, marginTop: 24, width: '100%', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter →'}
          </button>
        </form>

        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
          Pas de compte ? Contactez votre administrateur RH.
        </p>
      </div>
    </div>
  )
}

const S = {
  bg: {
    minHeight: '100vh', background: '#0a0a16',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Inter', system-ui, sans-serif",
    position: 'relative', overflow: 'hidden',
  },
  orb: {
    position: 'absolute', width: 420, height: 420,
    borderRadius: '50%', filter: 'blur(90px)', pointerEvents: 'none',
  },
  card: {
    background: 'rgba(19,19,31,0.97)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20, padding: '44px 40px',
    width: '100%', maxWidth: 420,
    position: 'relative', zIndex: 1,
    boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
  },
  errorBanner: {
    background: 'rgba(232,93,36,0.15)',
    border: '1px solid rgba(232,93,36,0.3)',
    borderRadius: 8, padding: '10px 14px',
    color: '#f87171', fontSize: 13, marginBottom: 20,
  },
  label: {
    display: 'block', color: 'rgba(255,255,255,0.6)',
    fontSize: 12, marginBottom: 6, fontWeight: 500,
  },
  input: {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    padding: '11px 14px', color: '#fff', fontSize: 14,
    boxSizing: 'border-box', outline: 'none',
  },
  btn: {
    background: 'linear-gradient(135deg,#7c5cbf,#5b6cdb)',
    border: 'none', borderRadius: 8, padding: '12px 22px',
    color: '#fff', fontWeight: 600, fontSize: 14,
    cursor: 'pointer', transition: 'opacity 0.15s',
  },
}
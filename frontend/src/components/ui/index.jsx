// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 32, color = '#a78bfa' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: `3px solid rgba(255,255,255,0.1)`,
        borderTopColor: color,
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name = '?', photoUrl, size = 38 }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #7c5cbf, #3b5bdb)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38,
    }}>
      {initials}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#13131f',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: 24,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, style = {}, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%', background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${error ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 8, padding: '10px 14px',
          color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none',
          ...style,
        }}
        {...props}
      />
      {error && <p style={{ color: '#f87171', fontSize: 12, margin: '4px 0 0' }}>{error}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, error, options = [], style = {}, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
          {label}
        </label>
      )}
      <select
        style={{
          width: '100%', background: '#1a1a2e',
          border: `1px solid ${error ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 8, padding: '10px 14px',
          color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none',
          ...style,
        }}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p style={{ color: '#f87171', fontSize: 12, margin: '4px 0 0' }}>{error}</p>}
    </div>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', loading = false, style = {}, ...props }) {
  const base = {
    border: 'none', borderRadius: 8, padding: '10px 22px',
    fontWeight: 600, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
    display: 'inline-flex', alignItems: 'center', gap: 8,
  }
  const variants = {
    primary:   { background: 'linear-gradient(135deg,#7c5cbf,#5b6cdb)', color: '#fff' },
    secondary: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' },
    danger:    { background: 'rgba(232,93,36,0.2)', border: '1px solid rgba(232,93,36,0.3)', color: '#f87171' },
  }
  return (
    <button style={{ ...base, ...variants[variant], ...style }} disabled={loading} {...props}>
      {loading && <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />}
      {children}
    </button>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, width = 600 }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#13131f', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: 32, width: '100%', maxWidth: width,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
          >✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── ErrorBanner ───────────────────────────────────────────────────────────────
export function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div style={{
      background: 'rgba(232,93,36,0.15)', border: '1px solid rgba(232,93,36,0.3)',
      borderRadius: 8, padding: '10px 14px', color: '#f87171',
      fontSize: 13, marginBottom: 16,
    }}>
      {message}
    </div>
  )
}
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Reset CSS global
const style = document.createElement('style')
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0d0d1a; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
  a { text-decoration: none; }
  button { font-family: inherit; }
  input, select, textarea { font-family: inherit; }
  @keyframes spin { to { transform: rotate(360deg); } }
`
document.head.appendChild(style)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
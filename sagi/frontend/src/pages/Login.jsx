import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

export default function Login() {
  const [dni, setDni] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(dni, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="login-grad" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#3568a6" />
                <stop offset="100%" stopColor="#f57c00" />
              </linearGradient>
            </defs>
            <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" stroke="url(#login-grad)" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M3 7.5 12 12l9-4.5M12 12v9" stroke="url(#login-grad)" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M7.5 5.25 16.5 9.75" stroke="#f57c00" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="logo-text">SAGI</span>
        </div>
        <h1 className="auth-title">Sistema de Administración y Gestión de Inventarios</h1>
        <p className="auth-subtitle">Instituto de Seguridad Pública</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="dni">DNI</label>
            <input
              id="dni"
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ingresá tu DNI o usuario"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresá tu contraseña"
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {import.meta.env.DEV && (
          <div className="auth-hint">
            <button
              type="button"
              className="auth-hint-toggle"
              onClick={() => setShowHint(!showHint)}
            >
              {showHint ? 'Ocultar credenciales de prueba' : 'Mostrar credenciales de prueba'}
            </button>
            {showHint && (
              <div className="auth-hint-list">
                <p>Admin: <code>10000001</code> / <code>Admin1234</code></p>
                <p>Jefe: <code>10000002</code> / <code>Jefe1234</code></p>
                <p>Carga: <code>10000003</code> / <code>Carga1234</code></p>
                <p>Consulta: <code>10000004</code> / <code>Consulta1234</code></p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
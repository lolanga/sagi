import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Modal from './Modal'
import Aviso from './Aviso'
import '../index.css'

const menuItems = [
  { to: '/', label: 'Dashboard', roles: ['admin', 'jefe', 'carga', 'consulta'] },
  { to: '/inventario', label: 'Inventario', roles: ['admin', 'jefe', 'carga', 'consulta'] },
  { to: '/movimientos', label: 'Movimientos', roles: ['admin', 'jefe', 'carga'] },
  { to: '/reportes', label: 'Reportes', roles: ['admin', 'jefe'] },
  { to: '/alertas', label: 'Alertas', roles: ['admin', 'jefe', 'carga'] },
  { to: '/categorias', label: 'Categorías', roles: ['admin'] },
  { to: '/unidades', label: 'Sedes y Unidades', roles: ['admin'] },
  { to: '/auditoria', label: 'Auditoría', roles: ['admin', 'jefe'] },
]

function hasAccess(user, roles) {
  return roles.includes(user?.rol?.slug)
}

export default function Layout({ title, actions, children, back }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('sagi_theme') || 'dark')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sagi_theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const closeMenu = () => setMenuOpen(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    const form = e.target
    const current_password = form.current_password.value
    const password = form.password.value
    const password_confirmation = form.password_confirmation.value

    if (password !== password_confirmation) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }

    try {
      await api.post('/change-password', { current_password, password, password_confirmation })
      setPasswordSuccess('Contraseña actualizada correctamente')
      form.reset()
      setTimeout(() => { setShowPasswordModal(false); setPasswordSuccess('') }, 2000)
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Error al cambiar la contraseña')
    }
  }

  return (
    <div className="layout">
      <div className={`sidebar-overlay ${menuOpen ? 'visible' : ''}`} onClick={closeMenu} />

      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#6fb2e8" />
                <stop offset="100%" stopColor="#ffa94d" />
              </linearGradient>
            </defs>
            <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" stroke="url(#logo-grad)" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M3 7.5 12 12l9-4.5M12 12v9" stroke="url(#logo-grad)" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M7.5 5.25 16.5 9.75" stroke="#ffa94d" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="logo-text">SAGI</span>
        </div>
        <nav className="sidebar-nav">
          {menuItems
            .filter((item) => hasAccess(user, item.roles))
            .map((item) => (
              <Link key={item.to} to={item.to} className="nav-item" onClick={closeMenu}>
                {item.label}
              </Link>
            ))}
        </nav>
        <div className="sidebar-footer">Departamento Tecnología, Desarrollo e Innovación</div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">
            <button className="menu-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Abrir menú">
              ☰
            </button>
            <div>
              {back && (
                <Link to={back} className="btn-back">← Volver</Link>
              )}
              <h1>{title}</h1>
              <p className="topbar-user">
                {user?.name} · {user?.rol?.nombre} · {user?.sede?.nombre}
              </p>
            </div>
          </div>
          <div className="topbar-actions">
            {actions}
            <button className="btn btn-secondary" onClick={toggleTheme} title="Cambiar tema">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowPasswordModal(true)} title="Cambiar contraseña">
              🔑
            </button>
            <button className="btn btn-secondary" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <section className="content">{children}</section>
      </main>

      <Modal open={showPasswordModal} title="Cambiar contraseña" onClose={() => setShowPasswordModal(false)}>
        <form onSubmit={handleChangePassword}>
          <Aviso mensaje={passwordError} onCerrar={() => setPasswordError('')} />
          {passwordSuccess && <div className="aviso aviso-success">{passwordSuccess}</div>}
          <div className="field">
            <label htmlFor="current_password">Contraseña actual</label>
            <input type="password" id="current_password" name="current_password" required />
          </div>
          <div className="field">
            <label htmlFor="password">Nueva contraseña</label>
            <input type="password" id="password" name="password" required minLength={6} />
          </div>
          <div className="field">
            <label htmlFor="password_confirmation">Confirmar contraseña</label>
            <input type="password" id="password_confirmation" name="password_confirmation" required minLength={6} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
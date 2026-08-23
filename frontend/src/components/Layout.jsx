import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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

  const closeMenu = () => setMenuOpen(false)

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
            <button className="btn btn-secondary" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <section className="content">{children}</section>
      </main>
    </div>
  )
}
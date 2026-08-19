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
        <div className="sidebar-logo">SAGI</div>
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
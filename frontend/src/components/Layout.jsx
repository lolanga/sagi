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
  { to: '/auditoria', label: 'Auditoría', roles: ['admin', 'jefe'] },
]

function hasAccess(user, roles) {
  return roles.includes(user?.rol?.slug)
}

export default function Layout({ title, actions, children, back }) {
  const { user, logout } = useAuth()

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">SAGI</div>
        <nav className="sidebar-nav">
          {menuItems
            .filter((item) => hasAccess(user, item.roles))
            .map((item) => (
              <Link key={item.to} to={item.to} className="nav-item">
                {item.label}
              </Link>
            ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            {back && (
              <Link to={back} className="btn-back">← Volver</Link>
            )}
            <h1>{title}</h1>
            <p className="topbar-user">
              {user?.name} · {user?.rol?.nombre} · {user?.area?.nombre}
            </p>
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
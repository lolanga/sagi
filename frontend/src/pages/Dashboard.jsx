import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import '../styles/dashboard.css'

const menuItems = [
  { to: '/', label: 'Dashboard', icon: '📊', roles: ['admin', 'jefe', 'carga', 'consulta'] },
  { to: '/inventario', label: 'Inventario', icon: '📦', roles: ['admin', 'jefe', 'carga', 'consulta'] },
  { to: '/movimientos', label: 'Movimientos', icon: '🔄', roles: ['admin', 'jefe', 'carga'] },
  { to: '/reportes', label: 'Reportes', icon: '📈', roles: ['admin', 'jefe'] },
  { to: '/alertas', label: 'Alertas', icon: '🔔', roles: ['admin', 'jefe', 'carga'] },
  { to: '/categorias', label: 'Categorías', icon: '⚙️', roles: ['admin'] },
]

function hasAccess(user, roles) {
  return roles.includes(user?.rol?.slug)
}

export default function Dashboard() {
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
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>Dashboard</h1>
            <p className="topbar-user">
              {user?.name} · {user?.rol?.nombre} · {user?.area?.nombre}
            </p>
          </div>
          <button className="btn btn-secondary" onClick={logout}>
            Cerrar sesión
          </button>
        </header>

        <section className="content">
          <div className="cards-grid">
            <div className="stat-card">
              <span className="stat-icon">📦</span>
              <div>
                <h2>0</h2>
                <p>Total de ítems</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🟢</span>
              <div>
                <h2>0</h2>
                <p>Ítems activos</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🔄</span>
              <div>
                <h2>0</h2>
                <p>Movimientos pendientes</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🔔</span>
              <div>
                <h2>0</h2>
                <p>Alertas activas</p>
              </div>
            </div>
          </div>

          <div className="placeholder">
            <h2>Bienvenido a SAGI</h2>
            <p>
              El dashboard se completará en la Fase 4 con los indicadores reales del inventario.
            </p>
            <p>
              Por ahora puedes explorar el <Link to="/inventario">Inventario</Link> y los demás
              módulos.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
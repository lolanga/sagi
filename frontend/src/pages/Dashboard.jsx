import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import api from '../services/api'
import '../styles/dashboard.css'

const menuItems = [
  { to: '/', label: 'Dashboard', roles: ['admin', 'jefe', 'carga', 'consulta'] },
  { to: '/inventario', label: 'Inventario', roles: ['admin', 'jefe', 'carga', 'consulta'] },
  { to: '/movimientos', label: 'Movimientos', roles: ['admin', 'jefe', 'carga'] },
  { to: '/reportes', label: 'Reportes', roles: ['admin', 'jefe'] },
  { to: '/alertas', label: 'Alertas', roles: ['admin', 'jefe', 'carga'] },
  { to: '/categorias', label: 'Categorías', roles: ['admin'] },
]

function hasAccess(user, roles) {
  return roles.includes(user?.rol?.slug)
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState({ total: 0, activos: 0, movimientos_pendientes: 0, alertas_activas: 0 })
  const [porCategoria, setPorCategoria] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => {
        setStats(res.data.stats || {})
        setPorCategoria(res.data.por_categoria || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
          {loading ? (
            <p className="muted">Cargando...</p>
          ) : (
            <>
              <div className="cards-grid">
                <div className="stat-card">
                  <div>
                    <h2>{stats.total}</h2>
                    <p>Total de ítems</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div>
                    <h2>{stats.activos}</h2>
                    <p>Ítems activos</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div>
                    <h2>{stats.movimientos_pendientes}</h2>
                    <p>Movimientos pendientes</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div>
                    <h2>{stats.alertas_activas}</h2>
                    <p>Alertas activas</p>
                  </div>
                </div>
              </div>

              <div className="stat-card lista-categorias">
                <div className="lista-categorias-header">
                  <h3>Ítems activos por categoría</h3>
                </div>
                {porCategoria.length === 0 ? (
                  <p className="muted">Sin ítems cargados.</p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Categoría</th>
                        <th>Ítems</th>
                      </tr>
                    </thead>
                    <tbody>
                      {porCategoria.map((c) => (
                        <tr key={c.codigo}>
                          <td><strong>{c.codigo}</strong></td>
                          <td>{c.nombre}</td>
                          <td>{c.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

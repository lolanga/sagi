import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import '../styles/inventario.css'

export default function Inventario() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/items')
      .then((res) => setItems(res.data.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">SAGI</div>
        <nav className="sidebar-nav">
          <Link to="/" className="nav-item"><span className="nav-icon">📊</span>Dashboard</Link>
          <Link to="/inventario" className="nav-item active"><span className="nav-icon">📦</span>Inventario</Link>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>Inventario</h1>
            <p className="topbar-user">
              {user?.name} · {user?.rol?.nombre} · {user?.area?.nombre}
            </p>
          </div>
        </header>

        <section className="content">
          {loading ? (
            <p>Cargando...</p>
          ) : items.length === 0 ? (
            <div className="placeholder">
              <h2>Módulo en construcción</h2>
              <p>
                El registro de ítems, el formulario dinámico por categoría y la búsqueda rápida
                se implementarán en la Fase 2.
              </p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Categoría</th>
                  <th>Responsable</th>
                  <th>Estado</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.codigo_unico}</td>
                    <td>{item.categoria?.nombre}</td>
                    <td>{item.responsable?.name}</td>
                    <td>{item.estado_conservacion}</td>
                    <td>{item.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  )
}
import { useEffect, useState } from 'react'
import api from '../services/api'
import Layout from '../components/Layout'
import '../styles/dashboard.css'

export default function Dashboard() {
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
    <Layout title="Dashboard">
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
    </Layout>
  )
}
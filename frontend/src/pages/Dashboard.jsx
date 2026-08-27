import { useEffect, useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import api from '../services/api'
import Layout from '../components/Layout'
import '../styles/dashboard.css'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartDataLabels)

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
          <div className="stats-grid">
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

          <div className="charts-grid">
            <div className="stat-card chart-card">
              <h3>Ítems por categoría</h3>
              {porCategoria.length === 0 ? (
                <p className="muted">Sin datos.</p>
              ) : (
                <div className="chart-container">
                  <Bar
                    data={{
                      labels: porCategoria.map((c) => c.codigo),
                      datasets: [{
                        label: 'Ítems',
                        data: porCategoria.map((c) => c.total),
                        backgroundColor: 'rgba(74, 143, 212, 0.7)',
                        borderColor: 'rgba(74, 143, 212, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1, color: '#a0aec0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { ticks: { color: '#a0aec0' }, grid: { display: false } },
                      },
                    }}
                  />
                </div>
              )}
            </div>

            <div className="stat-card chart-card">
              <h3>Distribución por estado</h3>
              {porCategoria.length === 0 ? (
                <p className="muted">Sin datos.</p>
              ) : (
                <div className="chart-container chart-container-doughnut">
                  <Doughnut
                    data={{
                      labels: porCategoria.map((c) => c.nombre),
                      datasets: [{
                        data: porCategoria.map((c) => c.total),
                        backgroundColor: [
                          'rgba(74, 143, 212, 0.8)',
                          'rgba(76, 175, 80, 0.8)',
                          'rgba(245, 124, 0, 0.8)',
                          'rgba(239, 83, 80, 0.8)',
                          'rgba(156, 39, 176, 0.8)',
                          'rgba(0, 188, 212, 0.8)',
                        ],
                        borderWidth: 0,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom', labels: { color: '#a0aec0', padding: 12, font: { size: 11 } } },
                        datalabels: {
                          color: '#fff',
                          font: { weight: 'bold', size: 12 },
                          formatter: (value, ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
                            if (total === 0) return ''
                            const pct = Math.round((value / total) * 100)
                            return value > 0 ? `${value}\n(${pct}%)` : ''
                          },
                          display: (ctx) => ctx.dataset.data[ctx.dataIndex] > 0,
                          textAlign: 'center',
                        },
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="stat-card lista-categorias">
            <div className="lista-categorias-header">
              <h3>Ítems activos por categoría</h3>
            </div>
            {porCategoria.length === 0 ? (
              <p className="muted">Sin ítems cargados.</p>
            ) : (
              <div className="table-wrap">
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
                      <td data-label="Código"><strong>{c.codigo}</strong></td>
                      <td data-label="Categoría">{c.nombre}</td>
                      <td data-label="Ítems">{c.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  )
}
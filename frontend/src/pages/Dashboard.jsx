import { useEffect, useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import '../styles/dashboard.css'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartDataLabels)

const CONSERVACION_COLORES = {
  'Muy bueno': '#1b5e20',
  Bueno: '#2e7d32',
  Regular: '#9a5b00',
  Malo: '#c62828',
}

const ESTADO_META = [
  { key: 'activo', label: 'Activo', color: '#2e7d32' },
  { key: 'pendiente', label: 'Pendiente', color: '#9a5b00' },
  { key: 'baja', label: 'Baja', color: '#c62828' },
]

const statIcons = {
  total: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  ),
  activos: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  ),
  movimientos: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
  ),
  alertas: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  ),
}

const leerTemaGraficos = () => {
  const styles = getComputedStyle(document.documentElement)
  return {
    text: styles.getPropertyValue('--chart-text').trim() || '#a0aec0',
    grid: styles.getPropertyValue('--chart-grid').trim() || 'rgba(255,255,255,0.08)',
  }
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ total: 0, activos: 0, movimientos_pendientes: 0, alertas_activas: 0 })
  const [porCategoria, setPorCategoria] = useState([])
  const [porEstado, setPorEstado] = useState({})
  const [porConservacion, setPorConservacion] = useState({})
  const [loading, setLoading] = useState(true)
  const [backupLoading, setBackupLoading] = useState(false)
  const [chartTheme, setChartTheme] = useState(leerTemaGraficos)

  useEffect(() => {
    const obs = new MutationObserver(() => setChartTheme(leerTemaGraficos()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => {
        setStats(res.data.stats || {})
        setPorCategoria(res.data.por_categoria || [])
        setPorEstado(res.data.por_estado || {})
        setPorConservacion(res.data.por_conservacion || {})
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const conservacionEntries = Object.keys(CONSERVACION_COLORES).map((label) => ({
    label,
    value: porConservacion[label] || 0,
    color: CONSERVACION_COLORES[label],
  }))
  const conservacionTotal = conservacionEntries.reduce((sum, e) => sum + e.value, 0)
  const estadoTotal = ESTADO_META.reduce((sum, e) => sum + (porEstado[e.key] || 0), 0)

  const handleBackup = async () => {
    setBackupLoading(true)
    try {
      const res = await api.get('/dashboard/backup', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      const disposition = res.headers['content-disposition']
      const filename = disposition ? disposition.split('filename=')[1]?.replace(/"/g, '') : `backup_sagi.sql`
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Error al crear el backup')
    } finally {
      setBackupLoading(false)
    }
  }

  return (
    <Layout
      title="Dashboard"
      actions={
        user?.rol?.slug === 'admin' && (
          <button className="btn btn-secondary" onClick={handleBackup} disabled={backupLoading}>
            {backupLoading ? 'Generando...' : 'Backup'}
          </button>
        )
      }
    >
      {loading ? (
        <p className="muted">Cargando...</p>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card stat-card--kpi">
              <div className="stat-card-body">
                <h2>{stats.total}</h2>
                <p>Total de ítems</p>
              </div>
              <span className="stat-card-icon" aria-hidden="true">{statIcons.total}</span>
            </div>
            <div className="stat-card stat-card--kpi">
              <div className="stat-card-body">
                <h2>{stats.activos}</h2>
                <p>Ítems activos</p>
              </div>
              <span className="stat-card-icon" aria-hidden="true">{statIcons.activos}</span>
            </div>
            <div className="stat-card stat-card--kpi">
              <div className="stat-card-body">
                <h2>{stats.movimientos_pendientes}</h2>
                <p>Movimientos pendientes</p>
              </div>
              <span className="stat-card-icon" aria-hidden="true">{statIcons.movimientos}</span>
            </div>
            <div className="stat-card stat-card--kpi">
              <div className="stat-card-body">
                <h2>{stats.alertas_activas}</h2>
                <p>Alertas activas</p>
              </div>
              <span className="stat-card-icon" aria-hidden="true">{statIcons.alertas}</span>
            </div>
          </div>

          <div className="charts-grid">
            <div className="stat-card chart-card chart-card--wide">
              <h3>Ítems por categoría</h3>
              {porCategoria.length === 0 ? (
                <p className="muted">Sin datos.</p>
              ) : (
                <div className="chart-container chart-container-bar">
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
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            title: (items) => {
                              const c = porCategoria[items[0]?.dataIndex]
                              return c ? `${c.codigo} · ${c.nombre}` : ''
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          precision: 0,
                          ticks: { stepSize: 1, color: chartTheme.text },
                          grid: { color: chartTheme.grid },
                        },
                        x: {
                          ticks: {
                            color: chartTheme.text,
                            maxRotation: 0,
                            minRotation: 0,
                            autoSkip: true,
                            autoSkipPadding: 8,
                            font: { size: 10 },
                            callback: (value, index) => {
                              const c = porCategoria[index]
                              if (!c) return value
                              const n = c.nombre.length > 18 ? `${c.nombre.slice(0, 17)}…` : c.nombre
                              return [c.codigo, n]
                            },
                          },
                          grid: { display: false },
                        },
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="charts-grid">
            <div className="stat-card chart-card">
              <h3>Distribución por estado de conservación</h3>
              {conservacionTotal === 0 ? (
                <p className="muted">Sin datos.</p>
              ) : (
                <div className="chart-container chart-container-doughnut">
                  <Doughnut
                    data={{
                      labels: conservacionEntries.map((e) => e.label),
                      datasets: [{
                        data: conservacionEntries.map((e) => e.value),
                        backgroundColor: conservacionEntries.map((e) => e.color),
                        borderWidth: 0,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom', labels: { color: chartTheme.text, padding: 12, font: { size: 11 } } },
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

            <div className="stat-card chart-card">
              <h3>Estado de los ítems</h3>
              <ul className="estado-list">
                {ESTADO_META.map((e) => {
                  const value = porEstado[e.key] || 0
                  const pct = estadoTotal ? Math.round((value / estadoTotal) * 100) : 0
                  return (
                    <li key={e.key} className="estado-row">
                      <span className="estado-swatch" style={{ backgroundColor: e.color }} />
                      <span className="estado-name">{e.label}</span>
                      <span className="estado-bar">
                        <span className="estado-bar-fill" style={{ width: `${pct}%`, backgroundColor: e.color }} />
                      </span>
                      <span className="estado-count">{value}</span>
                      <span className="estado-pct">{pct}%</span>
                    </li>
                  )
                })}
              </ul>
              <p className="estado-total">Total: {estadoTotal} ítems</p>
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
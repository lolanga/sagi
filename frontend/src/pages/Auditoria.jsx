import { useEffect, useState } from 'react'
import api from '../services/api'
import Layout from '../components/Layout'
import '../styles/inventario.css'

const entidades = ['auth', 'item', 'categoria', 'tipo_item', 'campo_dinamico', 'movimiento']
const acciones = ['login', 'crear', 'editar', 'eliminar', 'mover', 'solicitar', 'aprobar', 'rechazar']

function formatearDetalle(detalle) {
  if (!detalle) return '-'
  const partes = Object.entries(detalle)
    .filter(([k, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
  return partes.join(' · ')
}

export default function Auditoria() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [entidad, setEntidad] = useState('')
  const [accion, setAccion] = useState('')

  const cargar = () => {
    const params = new URLSearchParams()
    if (entidad) params.set('entidad', entidad)
    if (accion) params.set('accion', accion)
    setLoading(true)
    api
      .get(`/auditoria?${params.toString()}`)
      .then((res) => {
        setLogs(res.data.data || [])
        setTotal(res.data.total || 0)
      })
      .catch(() => {
        setLogs([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [entidad, accion])

  return (
    <Layout title="Auditoría" back="/">
      <div className="filters-bar">
        <select className="filter-select" value={entidad} onChange={(e) => setEntidad(e.target.value)}>
          <option value="">Todas las entidades</option>
          {entidades.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select className="filter-select" value={accion} onChange={(e) => setAccion(e.target.value)}>
          <option value="">Todas las acciones</option>
          {acciones.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <span className="result-count">{total} registros</span>
      </div>

      {loading ? (
        <p className="muted">Cargando...</p>
      ) : logs.length === 0 ? (
        <div className="placeholder">
          <h2>Sin registros</h2>
          <p>No hay movimientos de auditoría que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Entidad</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td data-label="Fecha">{new Date(log.created_at).toLocaleString()}</td>
                <td data-label="Usuario">{log.user?.name}</td>
                <td data-label="Acción"><span className={`badge badge-accion badge-${log.accion}`}>{log.accion}</span></td>
                <td data-label="Entidad">{log.entidad}</td>
                <td data-label="Detalle" className="audit-detalle">{formatearDetalle(log.detalle)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </Layout>
  )
}
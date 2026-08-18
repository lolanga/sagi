import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Modal from '../components/Modal'
import Layout from '../components/Layout'
import '../styles/inventario.css'

const prioridades = [
  { value: 'critica', label: 'Crítica' },
  { value: 'importante', label: 'Importante' },
  { value: 'informativa', label: 'Informativa' },
]

export default function Alertas() {
  const { user } = useAuth()
  const [alertas, setAlertas] = useState([])
  const [areas, setAreas] = useState([])
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('abierta')
  const [showNueva, setShowNueva] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [prioridad, setPrioridad] = useState('importante')
  const [areaId, setAreaId] = useState('')
  const [itemId, setItemId] = useState('')
  const [error, setError] = useState('')

  const puedeGestionar = ['admin', 'jefe'].includes(user?.rol?.slug)

  const cargar = () => {
    const params = new URLSearchParams()
    if (filtroEstado) params.set('estado', filtroEstado)
    setLoading(true)
    api
      .get(`/alertas?${params.toString()}`)
      .then((res) => {
        setAlertas(res.data.data || [])
        setTotal(res.data.total || 0)
      })
      .catch(() => {
        setAlertas([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [filtroEstado])

  useEffect(() => {
    api.get('/areas').then((res) => setAreas(res.data.areas || [])).catch(() => {})
    api.get('/items').then((res) => setItems(res.data.data || [])).catch(() => {})
  }, [])

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = { mensaje, prioridad, area_id: Number(areaId) }
      if (itemId) payload.item_id = Number(itemId)
      await api.post('/alertas', payload)
      setShowNueva(false)
      setMensaje('')
      setPrioridad('importante')
      setAreaId('')
      setItemId('')
      cargar()
    } catch (err) {
      const msg = err.response?.data?.message
      const errors = err.response?.data?.errors
      const first = errors ? Object.values(errors)[0]?.[0] : null
      setError(first || msg || 'Error al crear la alerta')
    }
  }

  const cerrar = async (a) => {
    try {
      await api.post(`/alertas/${a.id}/cerrar`, {})
      cargar()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cerrar la alerta')
    }
  }

  return (
    <Layout
      title="Alertas"
      back="/"
      actions={
        puedeGestionar && (
          <button className="btn btn-primary" onClick={() => setShowNueva(true)}>
            + Nueva alerta
          </button>
        )
      }
    >
      <div className="filters-bar">
        <select className="filter-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todas</option>
          <option value="abierta">Abiertas</option>
          <option value="cerrada">Cerradas</option>
        </select>
        <span className="result-count">{total} alertas</span>
      </div>

      {loading ? (
        <p className="muted">Cargando...</p>
      ) : alertas.length === 0 ? (
        <div className="placeholder">
          <h2>Sin alertas</h2>
          <p>No hay alertas que coincidan con el filtro.</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Prioridad</th>
              <th>Mensaje</th>
              <th>Ítem</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {alertas.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.created_at).toLocaleString()}</td>
                <td>
                  <span className={`badge badge-prioridad-${a.prioridad}`}>{a.prioridad}</span>
                </td>
                <td>
                  {a.mensaje}
                  {a.fecha_cierre && <div className="muted small">Cerrada: {new Date(a.fecha_cierre).toLocaleString()}</div>}
                </td>
                <td>{a.item?.codigo_unico ?? '-'}</td>
                <td>
                  <span className={`badge badge-${a.estado}`}>{a.estado}</span>
                </td>
                <td>
                  {puedeGestionar && a.estado === 'abierta' && (
                    <button className="btn-link" onClick={() => cerrar(a)}>Cerrar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal open={showNueva} title="Nueva alerta" onClose={() => setShowNueva(false)} wide>
        <form onSubmit={guardar} className="item-form">
          <div className="form-grid">
            <div className="field field-full">
              <label htmlFor="a-mensaje">Mensaje *</label>
              <input
                id="a-mensaje"
                type="text"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Ej. Mantenimiento programado del equipo"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="a-prioridad">Prioridad *</label>
              <select id="a-prioridad" value={prioridad} onChange={(e) => setPrioridad(e.target.value)} required>
                {prioridades.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="a-area">Área *</label>
              <select id="a-area" value={areaId} onChange={(e) => setAreaId(e.target.value)} required>
                <option value="">Seleccionar área...</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="a-item">Ítem (opcional)</label>
              <select id="a-item" value={itemId} onChange={(e) => setItemId(e.target.value)}>
                <option value="">Sin ítem asociado</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.codigo_unico} · {i.tipo_item?.nombre ?? ''}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowNueva(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Crear alerta</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
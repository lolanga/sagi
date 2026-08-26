import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { extractApiError } from '../utils/helpers'
import Aviso from '../components/Aviso'
import EmptyState from '../components/EmptyState'
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
  const [unidades, setUnidades] = useState([])
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('abierta')
  const [showNueva, setShowNueva] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [prioridad, setPrioridad] = useState('importante')
  const [unidadId, setUnidadId] = useState('')
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
    api.get('/unidades').then((res) => setUnidades((res.data.unidades || []).filter((u) => u.activa))).catch(() => {})
    api.get('/items').then((res) => setItems(res.data.data || [])).catch(() => {})
  }, [])

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = { mensaje, prioridad, unidad_id: Number(unidadId) }
      if (itemId) payload.item_id = Number(itemId)
      await api.post('/alertas', payload)
      setShowNueva(false)
      setMensaje('')
      setPrioridad('importante')
      setUnidadId('')
      setItemId('')
      cargar()
    } catch (err) {
      setError(extractApiError(err, 'Error al crear la alerta'))
    }
  }

  const cerrar = async (a) => {
    try {
      await api.post(`/alertas/${a.id}/cerrar`, {})
      cargar()
    } catch (err) {
      setError(extractApiError(err, 'Error al cerrar la alerta'))
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
        <EmptyState
          icon="alert"
          title="Sin alertas"
          description="No hay alertas que coincidan con el filtro."
        />
      ) : (
        <div className="table-wrap">
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
                <td data-label="Fecha">{new Date(a.created_at).toLocaleString()}</td>
                <td data-label="Prioridad">
                  <span className={`badge badge-prioridad-${a.prioridad}`}>{a.prioridad}</span>
                </td>
                <td data-label="Mensaje">
                  {a.mensaje}
                  {a.fecha_cierre && <div className="muted small">Cerrada: {new Date(a.fecha_cierre).toLocaleString()}</div>}
                </td>
                <td data-label="Ítem">{a.item?.codigo_unico ?? '-'}</td>
                <td data-label="Estado">
                  <span className={`badge badge-${a.estado}`}>{a.estado}</span>
                </td>
                <td data-label="Acciones">
                  {puedeGestionar && a.estado === 'abierta' && (
                    <button className="btn-link" onClick={() => cerrar(a)}>Cerrar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
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
              <label htmlFor="a-unidad">Unidad *</label>
              <select id="a-unidad" value={unidadId} onChange={(e) => setUnidadId(e.target.value)} required>
                <option value="">Seleccionar unidad...</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre} ({u.sede?.nombre ?? ''})</option>
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
          <Aviso mensaje={error} onCerrar={() => setError('')} />
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowNueva(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Crear alerta</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Modal from '../components/Modal'
import Layout from '../components/Layout'
import '../styles/inventario.css'

const tiposMovimiento = [
  { value: 'traslado', label: 'Traslado' },
  { value: 'baja', label: 'Baja' },
]

export default function Movimientos() {
  const { user } = useAuth()
  const [movimientos, setMovimientos] = useState([])
  const [items, setItems] = useState([])
  const [areas, setAreas] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [showNuevo, setShowNuevo] = useState(false)
  const [tipo, setTipo] = useState('traslado')
  const [itemId, setItemId] = useState('')
  const [areaDestino, setAreaDestino] = useState('')
  const [motivo, setMotivo] = useState('')
  const [rechazando, setRechazando] = useState(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [error, setError] = useState('')

  const puedeSolicitar = ['admin', 'jefe', 'carga'].includes(user?.rol?.slug)
  const puedeValidar = ['admin', 'jefe'].includes(user?.rol?.slug)

  const cargar = () => {
    const params = new URLSearchParams()
    if (filtroTipo) params.set('tipo', filtroTipo)
    if (filtroEstado) params.set('estado', filtroEstado)
    setLoading(true)
    api
      .get(`/movimientos?${params.toString()}`)
      .then((res) => {
        setMovimientos(res.data.data || [])
        setTotal(res.data.total || 0)
      })
      .catch(() => {
        setMovimientos([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [filtroTipo, filtroEstado])

  useEffect(() => {
    api.get('/items').then((res) => setItems((res.data.data || []).filter((i) => i.estado === 'activo')))
    api.get('/areas').then((res) => setAreas(res.data.areas || [])).catch(() => {})
  }, [])

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = { item_id: Number(itemId), motivo }
      if (tipo === 'traslado') payload.area_destino_id = Number(areaDestino)
      const url = tipo === 'traslado' ? '/movimientos/traslados' : '/movimientos/bajas'
      await api.post(url, payload)
      setShowNuevo(false)
      setTipo('traslado')
      setItemId('')
      setAreaDestino('')
      setMotivo('')
      cargar()
    } catch (err) {
      const msg = err.response?.data?.message
      const errors = err.response?.data?.errors
      const first = errors ? Object.values(errors)[0]?.[0] : null
      setError(first || msg || 'Error al crear el movimiento')
    }
  }

  const aprobar = async (m) => {
    try {
      await api.post(`/movimientos/${m.id}/aprobar`, {})
      cargar()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al aprobar')
    }
  }

  const confirmarRechazo = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post(`/movimientos/${rechazando.id}/rechazar`, { motivo_rechazo: motivoRechazo })
      setRechazando(null)
      setMotivoRechazo('')
      cargar()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al rechazar')
    }
  }

  return (
    <Layout
      title="Movimientos"
      back="/"
      actions={
        puedeSolicitar && (
          <button className="btn btn-primary" onClick={() => setShowNuevo(true)}>
            + Nueva solicitud
          </button>
        )
      }
    >
      <div className="filters-bar">
        <select className="filter-select" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {tiposMovimiento.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select className="filter-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">Rechazado</option>
        </select>
        <span className="result-count">{total} movimientos</span>
      </div>

      {loading ? (
        <p className="muted">Cargando...</p>
      ) : movimientos.length === 0 ? (
        <div className="placeholder">
          <h2>Sin movimientos</h2>
          <p>No hay movimientos registrados. Crea una solicitud de traslado o baja.</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Ítem</th>
              <th>Origen → Destino</th>
              <th>Estado</th>
              <th>Solicitante</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.created_at).toLocaleString()}</td>
                <td>{m.tipo === 'traslado' ? 'Traslado' : 'Baja'}</td>
                <td><strong>{m.item?.codigo_unico}</strong> · {m.item?.tipo_item?.nombre ?? '-'}</td>
                <td>
                  {m.area_origen?.nombre ?? '-'} → {m.area_destino?.nombre ?? '-'}
                  {m.motivo && <div className="muted small">{m.motivo}</div>}
                  {m.motivo_rechazo && <div className="muted small">Rechazo: {m.motivo_rechazo}</div>}
                </td>
                <td>
                  <span className={`badge badge-${m.estado}`}>{m.estado}</span>
                </td>
                <td>{m.solicitante?.name}{m.validador ? ` · validado por ${m.validador.name}` : ''}</td>
                <td>
                  {puedeValidar && m.estado === 'pendiente' && (
                    <div className="row-actions">
                      <button className="btn-link" onClick={() => aprobar(m)}>Aprobar</button>
                      <button className="btn-link btn-link-danger" onClick={() => { setRechazando(m); setMotivoRechazo('') }}>Rechazar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal open={showNuevo} title="Nueva solicitud de movimiento" onClose={() => setShowNuevo(false)} wide>
        <form onSubmit={guardar} className="item-form">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="m-tipo">Tipo *</label>
              <select id="m-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} required>
                {tiposMovimiento.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="m-item">Ítem *</label>
              <select id="m-item" value={itemId} onChange={(e) => setItemId(e.target.value)} required>
                <option value="">Seleccionar ítem...</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.codigo_unico} · {i.tipo_item?.nombre ?? i.categoria?.codigo}</option>
                ))}
              </select>
            </div>
            {tipo === 'traslado' && (
              <div className="field">
                <label htmlFor="m-area">Área de destino *</label>
                <select id="m-area" value={areaDestino} onChange={(e) => setAreaDestino(e.target.value)} required>
                  <option value="">Seleccionar área...</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="field field-full">
              <label htmlFor="m-motivo">Motivo *</label>
              <input
                id="m-motivo"
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder={tipo === 'traslado' ? 'Ej. Reasignación de equipo' : 'Ej. Obsolescencia, rotura total'}
                required
              />
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowNuevo(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Solicitar</button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(rechazando)} title={`Rechazar movimiento — ${rechazando?.item?.codigo_unico ?? ''}`} onClose={() => setRechazando(null)}>
        <form onSubmit={confirmarRechazo} className="item-form">
          <div className="field">
            <label htmlFor="motivo-rechazo">Motivo del rechazo *</label>
            <input
              id="motivo-rechazo"
              type="text"
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Ej. No corresponde, falta documentación"
              required
              autoFocus
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setRechazando(null)}>Cancelar</button>
            <button type="submit" className="btn btn-danger">Rechazar</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { extractApiError } from '../utils/helpers'
import Aviso from '../components/Aviso'
import EmptyState from '../components/EmptyState'
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
  const [unidades, setUnidades] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [showNuevo, setShowNuevo] = useState(false)
  const [tipo, setTipo] = useState('traslado')
  const [itemId, setItemId] = useState('')
  const [unidadDestino, setUnidadDestino] = useState('')
  const [motivo, setMotivo] = useState('')
  const [rechazando, setRechazando] = useState(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [error, setError] = useState('')
  const [busquedaItem, setBusquedaItem] = useState('')
  const [movimientosPendientes, setMovimientosPendientes] = useState([])
  const [itemPendiente, setItemPendiente] = useState(null)

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
    api.get('/unidades').then((res) => setUnidades((res.data.unidades || []).filter((u) => u.activa))).catch(() => {})
  }, [])

  useEffect(() => {
    if (showNuevo) {
      api.get('/movimientos?estado=pendiente&per_page=100')
        .then((res) => setMovimientosPendientes(res.data.data || []))
        .catch(() => setMovimientosPendientes([]))
    } else {
      setMovimientosPendientes([])
      setItemPendiente(null)
    }
  }, [showNuevo])

  const buscarItems = (termino) => {
    setBusquedaItem(termino)
    if (termino.length < 2) {
      setItems([])
      return
    }
    api.get(`/items?search=${encodeURIComponent(termino)}&estado=activo&per_page=20`)
      .then((res) => setItems(res.data.data || []))
      .catch(() => setItems([]))
  }

  const seleccionarItem = (item) => {
    setItemId(item.id)
    setBusquedaItem(`${item.codigo_unico} · ${item.tipo_item?.nombre ?? item.categoria?.codigo}`)
    setItems([])
    const pendiente = movimientosPendientes.find((m) => m.item_id === item.id)
    setItemPendiente(pendiente || null)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    if (itemPendiente) {
      setError(`Este ítem ya tiene un movimiento ${itemPendiente.tipo} pendiente (solicitado por ${itemPendiente.solicitante?.name ?? 'otro usuario'}). Esperá a que se resuelva.`)
      return
    }
    try {
      const payload = { item_id: Number(itemId), motivo }
      if (tipo === 'traslado') payload.unidad_destino_id = Number(unidadDestino)
      const url = tipo === 'traslado' ? '/movimientos/traslados' : '/movimientos/bajas'
      await api.post(url, payload)
      setShowNuevo(false)
      setTipo('traslado')
      setItemId('')
      setUnidadDestino('')
      setMotivo('')
      cargar()
    } catch (err) {
      setError(extractApiError(err, 'Error al crear el movimiento'))
    }
  }

  const aprobar = async (m) => {
    try {
      await api.post(`/movimientos/${m.id}/aprobar`, {})
      cargar()
    } catch (err) {
      setError(extractApiError(err, 'Error al aprobar'))
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
      setError(extractApiError(err, 'Error al rechazar'))
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
        <EmptyState
          icon="inventory"
          title="Sin movimientos"
          description="No hay movimientos registrados. Crea una solicitud de traslado o baja."
        />
      ) : (
        <div className="table-wrap">
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
                <td data-label="Fecha">{new Date(m.created_at).toLocaleString()}</td>
                <td data-label="Tipo">{m.tipo === 'traslado' ? 'Traslado' : 'Baja'}</td>
                <td data-label="Ítem"><strong>{m.item?.codigo_unico}</strong> · {m.item?.tipo_item?.nombre ?? '-'}</td>
                <td data-label="Origen → Destino">
                  {m.unidad_origen?.nombre ?? '-'} → {m.unidad_destino?.nombre ?? '-'}
                  {m.motivo && <div className="muted small">{m.motivo}</div>}
                  {m.motivo_rechazo && <div className="muted small">Rechazo: {m.motivo_rechazo}</div>}
                </td>
                <td data-label="Estado">
                  <span className={`badge badge-${m.estado}`}>{m.estado}</span>
                </td>
                <td data-label="Solicitante">{m.solicitante?.name}{m.validador ? ` · validado por ${m.validador.name}` : ''}</td>
                <td data-label="Acciones">
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
        </div>
      )}

      <Modal open={showNuevo} title="Nueva solicitud de movimiento" onClose={() => { setShowNuevo(false); setBusquedaItem(''); setItems([]); setItemId('') }} wide>
        <form onSubmit={guardar} className="item-form">
          <fieldset className="form-fieldset">
            <legend>Datos del movimiento</legend>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="m-tipo">
                  <span className="field-icon">🔄</span>
                  Tipo de movimiento *
                </label>
                <select id="m-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} required>
                  {tiposMovimiento.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="m-item">
                  <span className="field-icon">📦</span>
                  Ítem *
                </label>
                <input
                  id="m-item"
                  type="text"
                  value={busquedaItem}
                  onChange={(e) => buscarItems(e.target.value)}
                  placeholder="Buscar por código o nombre..."
                  required
                />
                {busquedaItem.length >= 2 && items.length > 0 && (
                  <ul className="item-search-results">
                    {items.map((i) => {
                      const tienePendiente = movimientosPendientes.some((m) => m.item_id === i.id)
                      return (
                        <li
                          key={i.id}
                          className={`${String(i.id) === String(itemId) ? 'selected' : ''} ${tienePendiente ? 'item-con-pendiente' : ''}`}
                          onClick={() => seleccionarItem(i)}
                        >
                          <span>{i.codigo_unico} · {i.tipo_item?.nombre ?? i.categoria?.codigo}</span>
                          {tienePendiente && <span className="item-pendiente-tag">⚠ Pendiente</span>}
                        </li>
                      )
                    })}
                  </ul>
                )}
                {busquedaItem.length >= 2 && items.length === 0 && (
                  <p className="muted small">No se encontraron ítems</p>
                )}
                {itemPendiente && (
                  <div className="item-pendiente-aviso">
                    ⚠ Este ítem tiene un movimiento <strong>{itemPendiente.tipo}</strong> pendiente
                    (solicitado por <strong>{itemPendiente.solicitante?.name ?? 'otro usuario'}</strong>).
                    No se puede crear otro movimiento hasta que se resuelva.
                  </div>
                )}
              </div>
              {tipo === 'traslado' && (
                <div className="field">
                  <label htmlFor="m-unidad">
                    <span className="field-icon">🏢</span>
                    Unidad de destino *
                  </label>
                  <select id="m-unidad" value={unidadDestino} onChange={(e) => setUnidadDestino(e.target.value)} required>
                    <option value="">Seleccionar unidad...</option>
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre} ({u.sede?.nombre ?? ''})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="field field-full">
                <label htmlFor="m-motivo">
                  <span className="field-icon">💬</span>
                  Motivo *
                </label>
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
          </fieldset>

          {itemId && tipo === 'traslado' && (() => {
            const itemSeleccionado = items.find((i) => String(i.id) === String(itemId))
            const unidadOrigen = itemSeleccionado?.unidad?.nombre ?? 'Unidad actual del ítem'
            const unidadDestinoSeleccionada = unidades.find((u) => String(u.id) === String(unidadDestino))
            const destino = unidadDestinoSeleccionada
              ? `${unidadDestinoSeleccionada.nombre} (${unidadDestinoSeleccionada.sede?.nombre ?? ''})`
              : 'Sin seleccionar'
            return (
              <div className="movimiento-flujo">
                <div className="movimiento-flujo-item">
                  <span className="movimiento-flujo-label">Origen</span>
                  <span className="movimiento-flujo-valor">{unidadOrigen}</span>
                </div>
                <span className="movimiento-flujo-arrow">→</span>
                <div className="movimiento-flujo-item">
                  <span className="movimiento-flujo-label">Destino</span>
                  <span className="movimiento-flujo-valor">{destino}</span>
                </div>
              </div>
            )
          })()}

          <Aviso mensaje={error} onCerrar={() => setError('')} />
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
          <Aviso mensaje={error} onCerrar={() => setError('')} />
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setRechazando(null)}>Cancelar</button>
            <button type="submit" className="btn btn-danger">Rechazar</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
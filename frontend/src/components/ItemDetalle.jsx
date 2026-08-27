import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api, { reactivarItem } from '../services/api'
import Aviso from './Aviso'
import '../styles/detalle.css'

const badgeTipo = {
  alta: 'badge-alta',
  traslado: 'badge-traslado',
  baja: 'badge-baja',
}

const badgeEstado = {
  aprobado: 'badge-aprobado',
  pendiente: 'badge-pendiente',
  rechazado: 'badge-rechazado',
}

export default function ItemDetalle({ itemId, categorias, onClose }) {
  const { user } = useAuth()
  const toast = useToast()
  const [item, setItem] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [error, setError] = useState('')
  const [reactivando, setReactivando] = useState(false)
  const [motivoReactivar, setMotivoReactivar] = useState('')
  const [errorReactivar, setErrorReactivar] = useState('')

  const puedeReactivar = ['admin', 'jefe'].includes(user?.rol?.slug) && item?.estado === 'baja'

  useEffect(() => {
    api
      .get(`/items/${itemId}`)
      .then((res) => setItem(res.data.item))
      .catch(() => setError('No se pudo cargar el detalle del ítem.'))

    api
      .get(`/auditoria?entidad=item&entidad_id=${itemId}`)
      .then((res) => setAuditLogs(res.data.data || []))
      .catch(() => {})
  }, [itemId])

  if (error) {
    return (
      <div>
        <p className="form-error">{error}</p>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    )
  }

  if (!item) return <p className="muted">Cargando...</p>

  const handleReactivar = async () => {
    setErrorReactivar('')
    try {
      await reactivarItem(item.id, motivoReactivar)
      toast.success('Ítem reactivado correctamente')
      setReactivando(false)
      setMotivoReactivar('')
      const res = await api.get(`/items/${itemId}`)
      setItem(res.data.item)
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al reactivar el ítem'
      setErrorReactivar(msg)
      toast.error(msg)
    }
  }

  const campos = categorias
    .find((c) => c.id === item.categoria_id)
    ?.campos_dinamicos?.filter((c) => c.activo)
    .filter((c) => (item.tipo_item_id ? c.tipo_item_id === item.tipo_item_id : !c.tipo_item_id))

  const formatearFecha = (f) => {
    if (!f) return '-'
    const d = new Date(f)
    return isNaN(d) ? '-' : d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  const Etiquetas = {
    categoria: 'Categoría', categoria_id: 'Categoría',
    tipo_item: 'Elemento', tipo_item_id: 'Elemento',
    estado_conservacion: 'Estado conservación', cantidad: 'Cantidad',
    unidad: 'Unidad', unidad_id: 'Unidad', unidad_origen: 'Origen', unidad_destino: 'Destino',
    sede: 'Sede', codigo: 'Código', nombre: 'Nombre', tipo: 'Tipo',
    activa: 'Activa', motivo: 'Motivo', motivo_rechazo: 'Motivo rechazo',
    estado: 'Estado', estado_item: 'Estado ítem',
    valores_dinamicos: 'Campos dinámicos', item: 'Ítem',
  }

  const formatearDetalle = (detalle, accion, entidad) => {
    if (!detalle) return '-'
    if (detalle.antes && detalle.despues && typeof detalle.antes === 'object' && typeof detalle.despues === 'object') {
      const expandDinamicos = (obj) => {
        if (!obj || typeof obj !== 'object') return obj
        const out = {}
        for (const [k, v] of Object.entries(obj)) {
          if (k === 'valores_dinamicos' && typeof v === 'object' && v !== null) {
            for (const [campoId, valor] of Object.entries(v)) {
              out[`dyn_${campoId}`] = valor
            }
          } else {
            out[k] = v
          }
        }
        return out
      }
      const antes = expandDinamicos(detalle.antes)
      const despues = expandDinamicos(detalle.despues)
      const campos = new Set([...Object.keys(antes), ...Object.keys(despues)])
      const cambios = []
      for (const k of campos) {
        const a = antes[k]
        const d = despues[k]
        const av = a ?? '(vacío)'
        const dv = d ?? '(vacío)'
        if (String(av) !== String(dv)) {
          const label = Etiquetas[k] || (k.startsWith('dyn_') ? `Campo #${k.slice(4)}` : k)
          cambios.push({ campo: label, antes: av, despues: dv })
        }
      }
      return cambios
    }
    const label = (k) => Etiquetas[k] || k
    const partes = Object.entries(detalle)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => ({ campo: label(k), antes: null, despues: typeof v === 'object' ? JSON.stringify(v) : v }))
    return partes
  }

  const formatDetalleTexto = (detalle, accion, entidad) => {
    if (!detalle) return '-'
    const e = entidad, a = accion
    if (e === 'item' && a === 'crear') return `Ítem ${detalle.codigo} creado en categoría ${detalle.categoria}`
    if (e === 'item' && a === 'reactivar') return `Ítem ${detalle.codigo} reactivado a categoría ${detalle.categoria}`
    if (e === 'item' && a === 'eliminar') return `Ítem ${detalle.codigo} eliminado (${detalle.categoria}, ${detalle.unidad})`
    if (e === 'movimiento' && a === 'solicitar') {
      if (detalle.tipo === 'traslado') return `Traslado de ${detalle.item}: ${detalle.unidad_origen} → ${detalle.unidad_destino}`
      if (detalle.tipo === 'baja') return `Baja de ${detalle.item} desde ${detalle.unidad_origen}`
    }
    if (e === 'movimiento' && a === 'aprobar') return `${detalle.tipo?.charAt(0).toUpperCase() + detalle.tipo?.slice(1)} de ${detalle.item} aprobado`
    if (e === 'movimiento' && a === 'rechazar') return `${detalle.tipo?.charAt(0).toUpperCase() + detalle.tipo?.slice(1)} de ${detalle.item} rechazado`
    if (e === 'unidad' && a === 'crear') return `Unidad "${detalle.nombre}" creada en ${detalle.sede}`
    if (e === 'unidad' && a === 'eliminar') return `Unidad "${detalle.nombre}" eliminada`
    if (e === 'sede' && a === 'crear') return `Sede "${detalle.nombre}" creada`
    if (e === 'sede' && a === 'eliminar') return `Sede "${detalle.nombre}" eliminada`
    if (e === 'auth' && a === 'login') return `Sesión iniciada (DNI ${detalle.dni})`
    if (e === 'user' && a === 'editar') return 'Contraseña actualizada'
    if (e === 'categoria' && a === 'crear') return `Categoría ${detalle.codigo} (${detalle.nombre}) creada`
    if (e === 'categoria' && a === 'editar') return `Categoría ${detalle.codigo} editada`
    if (e === 'categoria' && a === 'eliminar') return `Categoría ${detalle.codigo} (${detalle.nombre}) eliminada`
    if (e === 'tipo_item' && a === 'crear') return `Elemento "${detalle.nombre}" creado en ${detalle.categoria}`
    if (e === 'tipo_item' && a === 'eliminar') return `Elemento "${detalle.nombre}" eliminado de ${detalle.categoria}`
    if (e === 'tipo_item' && a === 'mover') return `Elemento "${detalle.nombre}" movido ${detalle.direccion === 'up' ? '↑' : '↓'}`
    if (e === 'campo_dinamico' && a === 'crear') return `Campo "${detalle.nombre}" (${detalle.tipo}) creado en ${detalle.categoria}`
    if (e === 'campo_dinamico' && a === 'eliminar') return `Campo "${detalle.nombre}" eliminado de ${detalle.categoria}`
    if (e === 'campo_dinamico' && a === 'mover') return `Campo "${detalle.nombre}" movido ${detalle.direccion === 'up' ? '↑' : '↓'}`
    if (e === 'alerta' && a === 'crear') return `Alerta creada — ${detalle.prioridad}`
    if (e === 'alerta' && a === 'cerrar') return 'Alerta cerrada'
    const items = Object.entries(detalle).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${Etiquetas[k] || k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
    return items.join(' · ') || '-'
  }

  const timelineItems = [
    ...(item?.movimientos || []).map((m) => ({
      tipo: 'movimiento',
      fecha: m.created_at,
      data: m,
    })),
    ...auditLogs.map((a) => ({
      tipo: 'auditoria',
      fecha: a.created_at,
      data: a,
    })),
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  return (
    <div className="detalle">
      <div className="detalle-grid">
        <div className="detalle-card">
          <h4>Datos del ítem</h4>
          <dl className="detalle-lista">
            <div><dt>Código</dt><dd>{item.codigo_unico}</dd></div>
            <div><dt>Categoría</dt><dd>{item.categoria?.codigo} – {item.categoria?.nombre}</dd></div>
            <div><dt>Elemento</dt><dd>{item.tipo_item?.nombre ?? '-'}</dd></div>
            <div><dt>Estado</dt><dd>{item.estado}</dd></div>
            <div><dt>Conservación</dt><dd>{item.estado_conservacion}</dd></div>
            <div><dt>Cantidad</dt><dd>{item.cantidad}</dd></div>
            <div><dt>Unidad actual</dt><dd>{item.unidad?.nombre ?? '-'}{item.unidad?.sede ? ` (${item.unidad.sede.nombre})` : ''}</dd></div>
            <div><dt>Responsable</dt><dd>{item.responsable?.name ?? '-'}</dd></div>
            <div><dt>Fecha de alta</dt><dd>{item.fecha_alta ? formatearFecha(item.fecha_alta) : 'Desconocida'}</dd></div>
            {item.estado === 'baja' && ['admin', 'jefe'].includes(user?.rol?.slug) && (
              <>
                <div><dt>Motivo de baja</dt><dd className="text-danger">{item.motivo_baja ?? '-'}</dd></div>
                <div><dt>Fecha de baja</dt><dd>{item.fecha_baja ? formatearFecha(item.fecha_baja) : '-'}</dd></div>
              </>
            )}
          </dl>
        </div>

        <div className="detalle-card">
          <h4>Campos del elemento</h4>
          {campos && campos.length > 0 ? (
            <dl className="detalle-lista">
              {campos.map((c) => (
                <div key={c.id}>
                  <dt>{c.nombre}</dt>
                  <dd>{item.valores_dinamicos?.[String(c.id)] ?? '-'}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="muted">Sin campos definidos.</p>
          )}
        </div>
      </div>

      <div className="detalle-card">
        <h4>Historial ({timelineItems.length})</h4>
        {timelineItems.length > 0 ? (
          <div className="timeline-scroll">
            <div className="timeline">
              {timelineItems.map((entry, idx) => (
                entry.tipo === 'movimiento' ? (
                  <div key={`m-${entry.data.id}`} className={`timeline-item ${entry.data.estado === 'aprobado' ? 'timeline-aprobado' : entry.data.estado === 'rechazado' ? 'timeline-rechazado' : 'timeline-pendiente'}`}>
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className={`badge ${badgeTipo[entry.data.tipo] || ''}`}>{entry.data.tipo}</span>
                        <span className="timeline-fecha">{formatearFecha(entry.fecha)}</span>
                        <span className={`badge ${badgeEstado[entry.data.estado] || ''}`}>{entry.data.estado}</span>
                      </div>
                      <div className="timeline-body">
                        {entry.data.tipo === 'traslado' && (
                          <p><strong>Origen:</strong> {entry.data.unidad_origen?.nombre ?? '-'} → <strong>Destino:</strong> {entry.data.unidad_destino?.nombre ?? '-'}</p>
                        )}
                        {entry.data.tipo === 'baja' && (
                          <p><strong>Origen:</strong> {entry.data.unidad_origen?.nombre ?? '-'}</p>
                        )}
                        <p><strong>Motivo:</strong> {entry.data.motivo}</p>
                        <p className="timeline-meta">
                          <span>Solicitó: {entry.data.solicitante?.name ?? '-'}</span>
                          {entry.data.validador && <span> · Validó: {entry.data.validador?.name}</span>}
                        </p>
                        {entry.data.motivo_rechazo && (
                          <p className="timeline-rechazo"><strong>Motivo rechazo:</strong> {entry.data.motivo_rechazo}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={`a-${entry.data.id}`} className="timeline-item timeline-audit">
                    <div className="timeline-dot timeline-dot-audit" />
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="badge badge-audit">{entry.data.accion}</span>
                        <span className="timeline-fecha">{formatearFecha(entry.fecha)}</span>
                      </div>
                      <div className="timeline-body">
                        <p className="timeline-meta"><span>Por: {entry.data.user?.name ?? '-'}</span></p>
                        {(() => {
                          const cambios = formatearDetalle(entry.data.detalle, entry.data.accion, entry.data.entidad)
                          if (Array.isArray(cambios) && cambios.length > 0 && cambios[0]?.antes !== null) {
                            return (
                              <div className="timeline-cambios">
                                {cambios.map((c, i) => (
                                  <div key={i} className="timeline-cambio">
                                    <span className="timeline-campo">{c.campo}</span>
                                    <span className="timeline-valores"><span className="val-antes">{c.antes}</span> → <span className="val-despues">{c.despues}</span></span>
                                  </div>
                                ))}
                              </div>
                            )
                          }
                          return <p>{formatDetalleTexto(entry.data.detalle, entry.data.accion, entry.data.entidad)}</p>
                        })()}
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        ) : (
          <p className="muted">Sin movimientos registrados.</p>
        )}
      </div>

      <div className="form-actions">
        {puedeReactivar && (
          <button type="button" className="btn btn-primary" onClick={() => setReactivando(true)}>
            Reactivar ítem
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
      </div>

      {reactivando && (
        <div className="modal-overlay" onClick={() => setReactivando(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reactivar ítem {item.codigo_unico}</h3>
            <p className="muted">Ingrese el motivo de la reactivación:</p>
            <textarea
              value={motivoReactivar}
              onChange={(e) => setMotivoReactivar(e.target.value)}
              placeholder="Motivo de reactivación..."
              rows={3}
              className="form-input"
            />
            <Aviso mensaje={errorReactivar} onCerrar={() => setErrorReactivar('')} />
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setReactivando(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleReactivar}
                disabled={!motivoReactivar.trim()}
              >
                Reactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
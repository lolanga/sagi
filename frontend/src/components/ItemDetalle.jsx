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
        <h4>Historial de movimientos ({item.movimientos?.length || 0})</h4>
        {item.movimientos && item.movimientos.length > 0 ? (
          <div className="timeline-scroll">
            <div className="timeline">
              {item.movimientos.map((m, idx) => (
                <div key={m.id} className={`timeline-item ${m.estado === 'aprobado' ? 'timeline-aprobado' : m.estado === 'rechazado' ? 'timeline-rechazado' : 'timeline-pendiente'}`}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className={`badge ${badgeTipo[m.tipo] || ''}`}>{m.tipo}</span>
                      <span className="timeline-fecha">{formatearFecha(m.created_at)}</span>
                      <span className={`badge ${badgeEstado[m.estado] || ''}`}>{m.estado}</span>
                    </div>
                    <div className="timeline-body">
                      {m.tipo === 'traslado' && (
                        <p><strong>Origen:</strong> {m.unidad_origen?.nombre ?? '-'} → <strong>Destino:</strong> {m.unidad_destino?.nombre ?? '-'}</p>
                      )}
                      {m.tipo === 'baja' && (
                        <p><strong>Origen:</strong> {m.unidad_origen?.nombre ?? '-'}</p>
                      )}
                      <p><strong>Motivo:</strong> {m.motivo}</p>
                      <p className="timeline-meta">
                        <span>Solicitó: {m.solicitante?.name ?? '-'}</span>
                        {m.validador && <span> · Validó: {m.validador?.name}</span>}
                      </p>
                      {m.motivo_rechazo && (
                        <p className="timeline-rechazo"><strong>Motivo rechazo:</strong> {m.motivo_rechazo}</p>
                      )}
                    </div>
                  </div>
                </div>
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
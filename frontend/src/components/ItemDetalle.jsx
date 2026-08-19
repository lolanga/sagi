import { useEffect, useState } from 'react'
import api from '../services/api'
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
  const [item, setItem] = useState(null)
  const [error, setError] = useState('')

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
            <div><dt>Fecha de alta</dt><dd>{formatearFecha(item.fecha_alta)}</dd></div>
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
        <h4>Historial de movimientos</h4>
        {item.movimientos && item.movimientos.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Motivo</th>
                <th>Solicitante</th>
                <th>Validador</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {item.movimientos.map((m) => (
                <tr key={m.id}>
                  <td>{formatearFecha(m.created_at)}</td>
                  <td><span className={`badge ${badgeTipo[m.tipo] || ''}`}>{m.tipo}</span></td>
                  <td>{m.unidad_origen?.nombre ?? '-'}</td>
                  <td>{m.unidad_destino?.nombre ?? '-'}</td>
                  <td>{m.motivo}</td>
                  <td>{m.solicitante?.name ?? '-'}</td>
                  <td>{m.validador?.name ?? '-'}</td>
                  <td><span className={`badge ${badgeEstado[m.estado] || ''}`}>{m.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">Sin movimientos registrados.</p>
        )}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  )
}
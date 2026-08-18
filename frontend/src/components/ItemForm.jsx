import { useEffect, useState } from 'react'
import api from '../services/api'
import '../styles/form.css'

const estadosConservacion = ['Muy bueno', 'Bueno', 'Regular', 'Malo']

export default function ItemForm({ categorias, item, onSaved, onCancel }) {
  const [categoriaId, setCategoriaId] = useState(item?.categoria_id ?? '')
  const [estadoConservacion, setEstadoConservacion] = useState(item?.estado_conservacion ?? 'Muy bueno')
  const [cantidad, setCantidad] = useState(item?.cantidad ?? 1)
  const [motivoAlta, setMotivoAlta] = useState('')
  const [valores, setValores] = useState({})
  const [campos, setCampos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const esEdicion = Boolean(item)

  useEffect(() => {
    if (item?.valores_dinamicos) {
      setValores(item.valores_dinamicos)
    }
  }, [item])

  useEffect(() => {
    if (!categoriaId) {
      setCampos([])
      return
    }
    setLoading(true)
    api
      .get(`/categorias/${categoriaId}/campos`)
      .then((res) => {
        const activos = (res.data.campos || []).filter((c) => c.activo)
        setCampos(activos)
      })
      .catch(() => setCampos([]))
      .finally(() => setLoading(false))
  }, [categoriaId])

  const renderCampo = (campo) => {
    const key = String(campo.id)
    const value = valores[key] ?? ''
    const base = {
      id: `campo-${campo.id}`,
      required: campo.requerido,
      value,
      onChange: (e) => setValores((v) => ({ ...v, [key]: e.target.value })),
    }

    if (campo.tipo === 'textarea') {
      return (
        <div className="field" key={campo.id}>
          <label htmlFor={base.id}>{campo.nombre}{campo.requerido && ' *'}</label>
          <textarea {...base} rows={3} />
        </div>
      )
    }

    if (campo.tipo === 'select') {
      return (
        <div className="field" key={campo.id}>
          <label htmlFor={base.id}>{campo.nombre}{campo.requerido && ' *'}</label>
          <select {...base}>
            <option value="">Seleccionar...</option>
            {(campo.opciones || []).map((op) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        </div>
      )
    }

    if (campo.tipo === 'numero') {
      return (
        <div className="field" key={campo.id}>
          <label htmlFor={base.id}>{campo.nombre}{campo.requerido && ' *'}</label>
          <input {...base} type="number" step="any" />
        </div>
      )
    }

    if (campo.tipo === 'fecha') {
      return (
        <div className="field" key={campo.id}>
          <label htmlFor={base.id}>{campo.nombre}{campo.requerido && ' *'}</label>
          <input {...base} type="date" />
        </div>
      )
    }

    return (
      <div className="field" key={campo.id}>
        <label htmlFor={base.id}>{campo.nombre}{campo.requerido && ' *'}</label>
        <input {...base} type="text" />
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        categoria_id: Number(categoriaId),
        estado_conservacion: estadoConservacion,
        cantidad: Number(cantidad),
        valores,
      }
      if (!esEdicion) payload.motivo_alta = motivoAlta

      if (esEdicion) {
        await api.put(`/items/${item.id}`, payload)
      } else {
        await api.post('/items', payload)
      }
      onSaved()
    } catch (err) {
      const msg = err.response?.data?.message
      if (msg && typeof msg === 'string') {
        setError(msg)
      } else {
        const errors = err.response?.data?.errors
        const first = errors ? Object.values(errors)[0]?.[0] : null
        setError(first || 'Error al guardar el ítem')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="item-form">
      <div className="form-grid">
        <div className="field">
          <label htmlFor="categoria">Categoría *</label>
          <select
            id="categoria"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            required
            disabled={esEdicion}
          >
            <option value="">Seleccionar categoría...</option>
            {categorias
              .filter((c) => !c.es_transitoria)
              .map((c) => (
                <option key={c.id} value={c.id}>{c.codigo} – {c.nombre}</option>
              ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="estado">Estado de conservación *</label>
          <select
            id="estado"
            value={estadoConservacion}
            onChange={(e) => setEstadoConservacion(e.target.value)}
            required
          >
            {estadosConservacion.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="cantidad">Cantidad *</label>
          <input
            id="cantidad"
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            required
          />
        </div>

        {!esEdicion && (
          <div className="field field-full">
            <label htmlFor="motivo">Motivo del alta *</label>
            <input
              id="motivo"
              type="text"
              value={motivoAlta}
              onChange={(e) => setMotivoAlta(e.target.value)}
              placeholder="Ej. Compra, donación, ingreso nuevo"
              required
            />
          </div>
        )}
      </div>

      {categoriaId && (
        <fieldset className="campos-dinamicos">
          <legend>Campos específicos de la categoría</legend>
          {loading ? (
            <p className="muted">Cargando campos...</p>
          ) : campos.length === 0 ? (
            <p className="muted">Esta categoría no tiene campos definidos.</p>
          ) : (
            <div className="form-grid">{campos.map(renderCampo)}</div>
          )}
        </fieldset>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Registrar alta'}
        </button>
      </div>
    </form>
  )
}
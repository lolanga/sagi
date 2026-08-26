import { useEffect, useState, useMemo, useRef } from 'react'
import api from '../services/api'
import { extractApiError } from '../utils/helpers'
import Aviso from '../components/Aviso'
import '../styles/form.css'

const estadosConservacion = ['Muy bueno', 'Bueno', 'Regular', 'Malo']

export default function ItemForm({ categorias, unidades, item, onSaved, onCancel }) {
  const [categoriaId, setCategoriaId] = useState(item?.categoria_id ?? '')
  const [tipoItemId, setTipoItemId] = useState(item?.tipo_item_id ?? '')
  const [estadoConservacion, setEstadoConservacion] = useState(item?.estado_conservacion ?? 'Muy bueno')
  const [cantidad, setCantidad] = useState(item?.cantidad ?? 1)
  const [unidadId, setUnidadId] = useState(item?.unidad_id ?? '')
  const [motivoAlta, setMotivoAlta] = useState('')
  const [fechaAlta, setFechaAlta] = useState(item?.fecha_alta ?? '')
  const [fechaDesconocida, setFechaDesconocida] = useState(false)
  const [valores, setValores] = useState({})
  const [campos, setCampos] = useState([])
  const [tipos, setTipos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const abortRef = useRef(null)

  const esEdicion = Boolean(item)

  const categoriasVisibles = useMemo(
    () => categorias.filter((c) => !c.es_transitoria),
    [categorias]
  )

  useEffect(() => {
    if (item?.valores_dinamicos) {
      setValores(item.valores_dinamicos)
    }
  }, [item])

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (!categoriaId) {
      setCampos([])
      setTipos([])
      setTipoItemId('')
      return
    }
    setLoading(true)

    if (tipoItemId) {
      api
        .get(`/categorias/${categoriaId}/campos`, {
          params: { tipo_item_id: tipoItemId },
          signal: controller.signal,
        })
        .then((res) => {
          const activos = (res.data.campos || []).filter((c) => c.activo)
          setCampos(activos)
        })
        .catch((err) => {
          if (err.name !== 'CanceledError') setCampos([])
        })
        .finally(() => setLoading(false))
    } else {
      setCampos([])
      setLoading(false)
    }

    api
      .get(`/categorias/${categoriaId}/tipos`, { signal: controller.signal })
      .then((res) => setTipos(res.data.tipos || []))
      .catch((err) => {
        if (err.name !== 'CanceledError') setTipos([])
      })

    return () => controller.abort()
  }, [categoriaId, tipoItemId])

  const validateField = (name, value) => {
    if (!value && name !== 'tipo_item_id') return `${name === 'categoria_id' ? 'Categoría' : name} es obligatorio`
    return ''
  }

  const clearFieldError = (name) => {
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const handleTipoChange = (e) => {
    const newTipo = e.target.value
    if (newTipo !== tipoItemId && Object.keys(valores).some((k) => valores[k])) {
      if (!window.confirm('Cambiar el elemento borrará los campos específicos ya completados. ¿Continuar?')) {
        return
      }
    }
    setTipoItemId(newTipo)
    setValores({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const errors = {}
    if (!categoriaId) errors.categoria_id = 'Seleccioná una categoría'
    if (!esEdicion && !unidadId) errors.unidad_id = 'Seleccioná una unidad de destino'
    if (!esEdicion && !motivoAlta.trim()) errors.motivo_alta = 'Ingresá el motivo del alta'
    if (!esEdicion && !fechaDesconocida && !fechaAlta) errors.fecha_alta = 'Seleccioná la fecha de alta'
    if (tipos.length > 0 && !tipoItemId) errors.tipo_item_id = 'Seleccioná un elemento'

    campos.forEach((c) => {
      if (c.requerido && !valores[String(c.id)]) {
        errors[`campo_${c.id}`] = `${c.nombre} es obligatorio`
      }
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Revisá los campos marcados en rojo')
      return
    }

    setLoading(true)
    try {
      const payload = {
        categoria_id: Number(categoriaId),
        tipo_item_id: tipoItemId ? Number(tipoItemId) : null,
        estado_conservacion: estadoConservacion,
        cantidad: Number(cantidad),
        valores,
      }
      if (!esEdicion) {
        payload.motivo_alta = motivoAlta.trim()
        payload.unidad_id = Number(unidadId)
        payload.fecha_alta = fechaDesconocida ? null : fechaAlta
      }

      if (esEdicion) {
        await api.put(`/items/${item.id}`, payload)
      } else {
        await api.post('/items', payload)
      }
      onSaved()
    } catch (err) {
      setError(extractApiError(err, 'Error al guardar el ítem'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="item-form" noValidate>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="categoria">Categoría *</label>
          <select
            id="categoria"
            value={categoriaId}
            onChange={(e) => {
              setCategoriaId(e.target.value)
              if (!esEdicion) setTipoItemId('')
              clearFieldError('categoria_id')
            }}
            required
            disabled={esEdicion}
            aria-invalid={!!fieldErrors.categoria_id}
          >
            <option value="">Seleccionar categoría...</option>
            {categoriasVisibles.map((c) => (
              <option key={c.id} value={c.id}>{c.codigo} – {c.nombre}</option>
            ))}
          </select>
          {fieldErrors.categoria_id && <span className="field-error">{fieldErrors.categoria_id}</span>}
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
          <label htmlFor="tipo-item">Elemento{tipos.length > 0 ? ' *' : ''}</label>
          <select
            id="tipo-item"
            value={tipoItemId}
            onChange={handleTipoChange}
            required={tipos.length > 0}
            aria-invalid={!!fieldErrors.tipo_item_id}
          >
            <option value="">{tipos.length > 0 ? 'Seleccionar elemento...' : 'Sin elementos definidos'}</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
          {fieldErrors.tipo_item_id && <span className="field-error">{fieldErrors.tipo_item_id}</span>}
        </div>

        <div className="field">
          <label htmlFor="cantidad">Cantidad *</label>
          <input
            id="cantidad"
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            placeholder="Ej. 1"
            required
          />
        </div>

        {!esEdicion && (
          <div className="field">
            <label htmlFor="fecha-alta">Fecha de alta *</label>
            <input
              id="fecha-alta"
              type="date"
              value={fechaDesconocida ? '' : fechaAlta}
              onChange={(e) => setFechaAlta(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              disabled={fechaDesconocida}
              required={!fechaDesconocida}
              aria-invalid={!!fieldErrors.fecha_alta}
            />
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={fechaDesconocida}
                onChange={(e) => setFechaDesconocida(e.target.checked)}
              />
              Fecha desconocida
            </label>
            {fieldErrors.fecha_alta && <span className="field-error">{fieldErrors.fecha_alta}</span>}
          </div>
        )}

        {!esEdicion && (
          <div className="field">
            <label htmlFor="unidad">Unidad de destino *</label>
            <select
              id="unidad"
              value={unidadId}
              onChange={(e) => {
                setUnidadId(e.target.value)
                clearFieldError('unidad_id')
              }}
              required
              aria-invalid={!!fieldErrors.unidad_id}
            >
              <option value="">Seleccionar unidad...</option>
              {(unidades || []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.sede?.nombre ?? ''})
                </option>
              ))}
            </select>
            {fieldErrors.unidad_id && <span className="field-error">{fieldErrors.unidad_id}</span>}
          </div>
        )}

        {!esEdicion && (
          <div className="field field-full">
            <label htmlFor="motivo">Motivo del alta *</label>
            <textarea
              id="motivo"
              value={motivoAlta}
              onChange={(e) => {
                setMotivoAlta(e.target.value)
                clearFieldError('motivo_alta')
              }}
              placeholder="Ej. Compra, donación, ingreso nuevo"
              rows={2}
              required
              aria-invalid={!!fieldErrors.motivo_alta}
            />
            {fieldErrors.motivo_alta && <span className="field-error">{fieldErrors.motivo_alta}</span>}
          </div>
        )}
      </div>

      {categoriaId && (
        <fieldset className="campos-dinamicos">
          <legend>Campos específicos de la categoría</legend>
          {!tipoItemId ? (
            <p className="muted">Selecciona un elemento para ver sus campos específicos.</p>
          ) : loading ? (
            <p className="muted">Cargando campos...</p>
          ) : campos.length === 0 ? (
            <p className="muted">Este elemento no tiene campos definidos.</p>
          ) : (
            <div className="form-grid">
              {campos.map((campo) => {
                const key = String(campo.id)
                const value = valores[key] ?? ''
                const fieldKey = `campo_${campo.id}`
                const base = {
                  id: `campo-${campo.id}`,
                  required: campo.requerido,
                  value,
                  placeholder: campo.placeholder || '',
                  onChange: (e) => {
                    setValores((v) => ({ ...v, [key]: e.target.value }))
                    clearFieldError(fieldKey)
                  },
                  'aria-invalid': !!fieldErrors[fieldKey],
                }

                let input
                if (campo.tipo === 'textarea') {
                  input = <textarea {...base} rows={3} placeholder={campo.placeholder || `Ej. descripción de ${campo.nombre.toLowerCase()}`} />
                } else if (campo.tipo === 'select') {
                  const opcionesPlano = (campo.opciones || [])
                    .flatMap((op) => String(op).split(','))
                    .map((op) => op.trim())
                    .filter(Boolean)
                  input = (
                    <select {...base}>
                      <option value="">Seleccionar...</option>
                      {opcionesPlano.map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  )
                } else if (campo.tipo === 'numero') {
                  input = <input {...base} type="number" step="any" placeholder={campo.placeholder || 'Ej. 1'} />
                } else if (campo.tipo === 'fecha') {
                  input = <input {...base} type="date" />
                } else {
                  input = <input {...base} type="text" placeholder={campo.placeholder || `Ej. ${campo.nombre.toLowerCase()}`} />
                }

                return (
                  <div className="field" key={campo.id}>
                    <label htmlFor={base.id}>{campo.nombre}{campo.requerido && ' *'}</label>
                    {input}
                    {fieldErrors[fieldKey] && <span className="field-error">{fieldErrors[fieldKey]}</span>}
                  </div>
                )
              })}
            </div>
          )}
        </fieldset>
      )}

      <Aviso mensaje={error} onCerrar={() => setError('')} />

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

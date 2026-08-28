import { useEffect, useState, useMemo, useRef } from 'react'
import api from '../services/api'
import { extractApiError } from '../utils/helpers'
import Aviso from '../components/Aviso'
import '../styles/form.css'

const estadosConservacion = ['Muy bueno', 'Bueno', 'Regular', 'Malo']

const CAMPOS_FIJOS_NUEVOS = ['Marca', 'Modelo', 'Procedencia']
const CAMPOS_OCULTOS = ['Numero de serie']

const MAX_MOTIVO = 500

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
  const [camposAdicionalesAbierto, setCamposAdicionalesAbierto] = useState(false)
  const [touchedFields, setTouchedFields] = useState(new Set())
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
          const activos = (res.data.campos || []).filter(
            (c) => c.activo && !CAMPOS_OCULTOS.includes(c.nombre)
          )
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

  const clearFieldError = (name) => {
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const markTouched = (key) => {
    setTouchedFields((prev) => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
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
    markTouched('tipo_item_id')
  }

  const camposFijos = useMemo(() => {
    return campos.filter((c) => CAMPOS_FIJOS_NUEVOS.includes(c.nombre))
  }, [campos])

  const camposAdicionales = useMemo(() => {
    return campos.filter((c) => !CAMPOS_FIJOS_NUEVOS.includes(c.nombre))
  }, [campos])

  const hayCamposAdicionales = camposAdicionales.length > 0

  const camposObligatorios = useMemo(() => {
    const obligatorios = [
      { key: 'categoria_id', filled: touchedFields.has('categoria_id') && Boolean(categoriaId), label: 'Categoría' },
      { key: 'estado_conservacion', filled: touchedFields.has('estado_conservacion') && Boolean(estadoConservacion), label: 'Estado' },
      { key: 'cantidad', filled: touchedFields.has('cantidad') && Boolean(cantidad), label: 'Cantidad' },
    ]

    if (tipos.length > 0) {
      obligatorios.push({ key: 'tipo_item_id', filled: touchedFields.has('tipo_item_id') && Boolean(tipoItemId), label: 'Elemento' })
    }

    if (!esEdicion) {
      obligatorios.push({ key: 'unidad_id', filled: touchedFields.has('unidad_id') && Boolean(unidadId), label: 'Unidad' })
      obligatorios.push({ key: 'motivo_alta', filled: touchedFields.has('motivo_alta') && Boolean(motivoAlta?.trim()), label: 'Motivo' })
      if (!fechaDesconocida) {
        obligatorios.push({ key: 'fecha_alta', filled: touchedFields.has('fecha_alta') && Boolean(fechaAlta), label: 'Fecha' })
      }
    }

    return obligatorios
  }, [categoriaId, tipoItemId, estadoConservacion, cantidad, unidadId, motivoAlta, fechaAlta, fechaDesconocida, tipos.length, esEdicion, touchedFields])

  const completados = camposObligatorios.filter((c) => c.filled).length
  const total = camposObligatorios.length
  const porcentaje = total > 0 ? (completados / total) * 100 : 0

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
      {/* Barra de progreso */}
      {!esEdicion && (
        <div className="progress-section">
          <div className="progress-bar">
            <div
              className={`progress-bar-fill ${porcentaje === 100 ? 'progress-bar-fill--complete' : ''}`}
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <p className="progress-text">{completados} de {total} campos obligatorios completados</p>
        </div>
      )}

      {/* Datos básicos */}
      <fieldset className="form-fieldset">
        <legend>Datos básicos</legend>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="categoria">
              <span className="field-icon">📁</span>
              Categoría *
            </label>
            <select
              id="categoria"
              value={categoriaId}
              onChange={(e) => {
                setCategoriaId(e.target.value)
                if (!esEdicion) setTipoItemId('')
                clearFieldError('categoria_id')
                markTouched('categoria_id')
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
            <label htmlFor="tipo-item">
              <span className="field-icon">📦</span>
              Elemento{tipos.length > 0 ? ' *' : ''}
            </label>
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
            <label htmlFor="estado">
              <span className="field-icon">🔧</span>
              Estado de conservación *
            </label>
            <select
              id="estado"
              value={estadoConservacion}
              onChange={(e) => {
                setEstadoConservacion(e.target.value)
                markTouched('estado_conservacion')
              }}
              required
            >
              {estadosConservacion.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="cantidad">
              <span className="field-icon">🔢</span>
              Cantidad *
            </label>
            <input
              id="cantidad"
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => {
                setCantidad(Number(e.target.value))
                markTouched('cantidad')
              }}
              placeholder="Ej. 1"
              required
            />
          </div>

          {!esEdicion && (
            <div className="field">
              <label htmlFor="fecha-alta">
                <span className="field-icon">📅</span>
                Fecha de alta *
              </label>
              <input
                id="fecha-alta"
                type="date"
                value={fechaDesconocida ? '' : fechaAlta}
                onChange={(e) => {
                  setFechaAlta(e.target.value)
                  markTouched('fecha_alta')
                }}
                max={new Date().toISOString().slice(0, 10)}
                disabled={fechaDesconocida}
                required={!fechaDesconocida}
                aria-invalid={!!fieldErrors.fecha_alta}
              />
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={fechaDesconocida}
                  onChange={(e) => {
                  setFechaDesconocida(e.target.checked)
                  markTouched('fecha_alta')
                }}
                />
                Fecha desconocida
              </label>
              {fieldErrors.fecha_alta && <span className="field-error">{fieldErrors.fecha_alta}</span>}
            </div>
          )}

          {!esEdicion && (
            <div className="field">
              <label htmlFor="unidad">
                <span className="field-icon">🏢</span>
                Unidad de destino *
              </label>
              <select
                id="unidad"
                value={unidadId}
                onChange={(e) => {
                  setUnidadId(e.target.value)
                  clearFieldError('unidad_id')
                  markTouched('unidad_id')
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

          {/* Campo Procedencia (fijo para todas las categorías) */}
          {camposFijos.find((c) => c.nombre === 'Procedencia') && (
            <div className="field">
              <label htmlFor="procedencia">
                <span className="field-icon">📋</span>
                Procedencia *
              </label>
              <select
                id="procedencia"
                value={valores[String(camposFijos.find((c) => c.nombre === 'Procedencia')?.id)] ?? ''}
                onChange={(e) => {
                  const key = String(camposFijos.find((c) => c.nombre === 'Procedencia')?.id)
                  setValores((v) => ({ ...v, [key]: e.target.value }))
                  clearFieldError(`campo_${key}`)
                }}
                required={camposFijos.find((c) => c.nombre === 'Procedencia')?.requerido}
                aria-invalid={!!fieldErrors[`campo_${camposFijos.find((c) => c.nombre === 'Procedencia')?.id}`]}
              >
                <option value="">Seleccionar...</option>
                <option value="Adquirido">Adquirido</option>
                <option value="Donado">Donado</option>
                <option value="Otro">Otro</option>
              </select>
              {fieldErrors[`campo_${camposFijos.find((c) => c.nombre === 'Procedencia')?.id}`] && (
                <span className="field-error">{fieldErrors[`campo_${camposFijos.find((c) => c.nombre === 'Procedencia')?.id}`]}</span>
              )}
            </div>
          )}

          {/* Campo Marca (opcional, solo A2-A6) */}
          {camposFijos.find((c) => c.nombre === 'Marca') && (
            <div className="field">
              <label htmlFor="marca">
                <span className="field-icon">🏷️</span>
                Marca
              </label>
              <input
                id="marca"
                type="text"
                value={valores[String(camposFijos.find((c) => c.nombre === 'Marca')?.id)] ?? ''}
                onChange={(e) => {
                  const key = String(camposFijos.find((c) => c.nombre === 'Marca')?.id)
                  setValores((v) => ({ ...v, [key]: e.target.value }))
                }}
                placeholder="Ej. Samsung, LG, Sony"
              />
            </div>
          )}

          {/* Campo Modelo (opcional, solo A2-A6) */}
          {camposFijos.find((c) => c.nombre === 'Modelo') && (
            <div className="field">
              <label htmlFor="modelo">
                <span className="field-icon">📄</span>
                Modelo
              </label>
              <input
                id="modelo"
                type="text"
                value={valores[String(camposFijos.find((c) => c.nombre === 'Modelo')?.id)] ?? ''}
                onChange={(e) => {
                  const key = String(camposFijos.find((c) => c.nombre === 'Modelo')?.id)
                  setValores((v) => ({ ...v, [key]: e.target.value }))
                }}
                placeholder="Ej. Galaxy S24, iPhone 15"
              />
            </div>
          )}

          {/* Campo Motivo del alta */}
          {!esEdicion && (
            <div className="field field-full">
              <label htmlFor="motivo">
                <span className="field-icon">💬</span>
                Motivo del alta *
              </label>
              <textarea
                id="motivo"
                value={motivoAlta}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_MOTIVO) {
                    setMotivoAlta(e.target.value)
                    clearFieldError('motivo_alta')
                    markTouched('motivo_alta')
                  }
                }}
                placeholder="Ej. Compra, donación, ingreso nuevo"
                rows={2}
                required
                aria-invalid={!!fieldErrors.motivo_alta}
              />
              <div className="char-counter">
                <span className={motivoAlta.length >= MAX_MOTIVO ? 'char-counter--limit' : ''}>
                  {motivoAlta.length}/{MAX_MOTIVO}
                </span>
              </div>
              {fieldErrors.motivo_alta && <span className="field-error">{fieldErrors.motivo_alta}</span>}
            </div>
          )}
        </div>
      </fieldset>

      {/* Campos adicionales (colapsable) */}
      {categoriaId && tipoItemId && (
        <div className="campos-adicionales-section">
          <button
            type="button"
            className={`campos-adicionales-toggle ${!hayCamposAdicionales ? 'campos-adicionales-toggle--disabled' : ''}`}
            onClick={() => hayCamposAdicionales && setCamposAdicionalesAbierto(!camposAdicionalesAbierto)}
            disabled={!hayCamposAdicionales}
          >
            <span className={`campos-adicionales-toggle-icon ${camposAdicionalesAbierto ? 'campos-adicionales-toggle-icon--open' : ''}`}>
              ▶
            </span>
            <span>Campos adicionales</span>
            <span className="tooltip-wrapper">
              <span className="tooltip-icon">?</span>
              <span className="tooltip-content">Información adicional del ítem (opcional)</span>
            </span>
            {!hayCamposAdicionales && (
              <span className="campos-adicionales-hint">Este elemento no tiene campos adicionales</span>
            )}
          </button>

          <div className={`campos-adicionales-content ${camposAdicionalesAbierto ? 'campos-adicionales-content--open' : ''}`}>
            {loading ? (
              <p className="muted">Cargando campos...</p>
            ) : camposAdicionales.length === 0 ? (
              <p className="muted">No hay campos adicionales para este elemento.</p>
            ) : (
              <div className="form-grid">
                {camposAdicionales.map((campo) => {
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
          </div>
        </div>
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

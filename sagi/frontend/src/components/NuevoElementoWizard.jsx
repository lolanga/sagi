import { useState, useMemo } from 'react'
import api from '../services/api'
import Aviso from './Aviso'

const tiposCampo = ['texto', 'numero', 'fecha', 'select', 'textarea']
const norm = (s) => String(s ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const CAMPOS_FIJOS = [
  { nombre: 'Categoría', ejemplo: '' },
  { nombre: 'Elemento', ejemplo: '' },
  { nombre: 'Estado de conservación', ejemplo: 'Bueno' },
  { nombre: 'Cantidad', ejemplo: '1' },
  { nombre: 'Fecha de alta', ejemplo: new Date().toLocaleDateString('es-AR') },
  { nombre: 'Unidad de destino', ejemplo: '' },
]

export default function NuevoElementoWizard({ categoria, onGuardado, onCancel }) {
  const [paso, setPaso] = useState(1)
  const [nombre, setNombre] = useState('')
  const [campos, setCampos] = useState([])
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const tiposExistentes = useMemo(() => {
    return (categoria?.tipos_items || []).map((t) => t.nombre)
  }, [categoria])

  const nombreDuplicado = useMemo(() => {
    if (!nombre.trim()) return false
    return tiposExistentes.some((t) => norm(t) === norm(nombre))
  }, [nombre, tiposExistentes])

  const camposConNombre = useMemo(() => campos.filter((c) => c.nombre.trim()), [campos])

  const agregarCampo = () => {
    setCampos([
      ...campos,
      {
        id: `new_${Date.now()}_${Math.random()}`,
        nombre: '',
        tipo: 'texto',
        opciones: '',
        requerido: false,
      },
    ])
  }

  const actualizarCampo = (id, campo, valor) => {
    setCampos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [campo]: valor } : c))
    )
  }

  const eliminarCampo = (id) => {
    setCampos((prev) => prev.filter((c) => c.id !== id))
  }

  const siguiente = () => {
    setPaso(2)
  }

  const guardar = async () => {
    setError('')
    if (!nombre.trim()) {
      setError('Ingresa un nombre para el elemento.')
      return
    }
    if (nombreDuplicado) {
      setError(`Ya existe un elemento similar: "${tiposExistentes.find((t) => norm(t) === norm(nombre))}"`)
      return
    }

    const duplicado = camposConNombre.find(
      (c, i) => camposConNombre.findIndex((v) => norm(v.nombre) === norm(c.nombre)) !== i
    )
    if (duplicado) {
      setError(`Nombre de campo duplicado: "${duplicado.nombre}"`)
      return
    }

    setGuardando(true)
    try {
      const res = await api.post(`/categorias/${categoria.id}/tipos`, { nombre: nombre.trim() })
      const nuevoTipo = res.data.tipo

      for (let i = 0; i < camposConNombre.length; i++) {
        const c = camposConNombre[i]
        const payload = {
          nombre: c.nombre.trim(),
          tipo: c.tipo,
          requerido: c.requerido,
          tipo_item_id: nuevoTipo.id,
          orden: i,
        }
        if (c.tipo === 'select' && c.opciones) {
          payload.opciones = c.opciones.split(',').map((o) => o.trim()).filter(Boolean)
        }
        await api.post(`/categorias/${categoria.id}/campos`, payload)
      }

      onGuardado()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el elemento')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="wizard">
      <div className="wizard-header">
        <h3>Crear nuevo elemento</h3>
        <div className="wizard-steps">
          <span className={`wizard-step ${paso >= 1 ? 'active' : ''}`}>1. Introducción</span>
          <span className={`wizard-step ${paso >= 2 ? 'active' : ''}`}>2. Configuración</span>
        </div>
      </div>

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      {paso === 1 && (
        <div className="wizard-paso">
          <div className="wizard-intro">
            <div className="wizard-intro-icon">📦</div>
            <h4>Nuevo elemento en {categoria.codigo}</h4>
            <p className="muted">
              Se creará un nuevo tipo de elemento dentro de la categoría <strong>{categoria.nombre}</strong>.
            </p>
            <p className="muted small">
              En el siguiente paso podrás definir el nombre y agregar campos adicionales personalizados si los necesitás.
            </p>
          </div>

          <div className="wizard-actions">
            <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
            <button className="btn btn-primary" onClick={siguiente}>Comenzar →</button>
          </div>
        </div>
      )}

      {paso === 2 && (
        <div className="wizard-paso">
          <div className="wizard-form-preview-layout">
            <div className="wizard-form-section">
              <div className="field">
                <label>Nombre del elemento *</label>
                <input
                  type="text"
                  placeholder="Ej. Escritorio, Computadora, Teclado"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value)
                    if (error) setError('')
                  }}
                  autoFocus
                  aria-invalid={nombreDuplicado}
                />
                {nombreDuplicado && (
                  <span className="field-error">
                    Ya existe un elemento similar: "{tiposExistentes.find((t) => norm(t) === norm(nombre))}"
                  </span>
                )}
              </div>

              <div className="campos-fijos-info">
                <span className="campos-fijos-info-icon">ℹ️</span>
                <div>
                  <strong>Estos campos ya existen en el formulario de alta:</strong>
                  <span className="campos-fijos-lista">{CAMPOS_FIJOS.map((c) => c.nombre).join(' · ')}</span>
                  No es necesario volver a crearlos.
                </div>
              </div>

              <label className="field-label-seccion">Campos adicionales</label>

              <div className="campo-rows">
                {campos.map((campo) => (
                  <div key={campo.id} className="campo-row">
                    <input
                      type="text"
                      className="campo-row-nombre"
                      placeholder="Nombre del campo"
                      value={campo.nombre}
                      onChange={(e) => actualizarCampo(campo.id, 'nombre', e.target.value)}
                    />

                    <select
                      className="campo-row-tipo"
                      value={campo.tipo}
                      onChange={(e) => actualizarCampo(campo.id, 'tipo', e.target.value)}
                    >
                      {tiposCampo.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>

                    {campo.tipo === 'select' && (
                      <input
                        type="text"
                        className="campo-row-opciones"
                        placeholder="Opc1, Opc2, Opc3"
                        value={campo.opciones}
                        onChange={(e) => actualizarCampo(campo.id, 'opciones', e.target.value)}
                      />
                    )}

                    <label className="campo-row-check" title="Requerido">
                      <input
                        type="checkbox"
                        checked={campo.requerido}
                        onChange={(e) => actualizarCampo(campo.id, 'requerido', e.target.checked)}
                      />
                      <span>Req.</span>
                    </label>

                    <button className="btn-icon btn-danger" onClick={() => eliminarCampo(campo.id)} title="Eliminar">✕</button>
                  </div>
                ))}
              </div>

              <button className="btn btn-secondary" onClick={agregarCampo}>
                + Agregar campo
              </button>
            </div>

            <div className="wizard-preview-section">
              <div className="preview-label">Vista previa</div>
              <div className="preview-card">
                <div className="preview-card-header">
                  <span className="preview-badge">{categoria.codigo}</span>
                  <span className="preview-nombre">{nombre || 'Nombre del elemento'}</span>
                </div>

                <div className="preview-card-body">
                  {CAMPOS_FIJOS.map((campo) => (
                    <div key={campo.nombre} className="preview-field">
                      <span className="preview-field-label">{campo.nombre}</span>
                      <span className="preview-field-value placeholder">{campo.ejemplo || '—'}</span>
                    </div>
                  ))}

                  {camposConNombre.length > 0 && (
                    <>
                      <div className="preview-divider" />
                      {camposConNombre.map((campo) => (
                        <div key={campo.id} className="preview-field">
                          <span className="preview-field-label">
                            {campo.nombre}
                            {campo.requerido && <span className="preview-required">*</span>}
                          </span>
                          <span className="preview-field-value placeholder">
                            {campo.tipo === 'select' && campo.opciones
                              ? campo.opciones.split(',')[0]?.trim() || 'Seleccionar...'
                              : campo.tipo === 'fecha'
                              ? 'dd/mm/aaaa'
                              : campo.tipo === 'numero'
                              ? '0'
                              : campo.tipo === 'textarea'
                              ? 'Texto...'
                              : 'Texto...'}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="wizard-actions">
            <button className="btn btn-secondary" onClick={() => setPaso(1)}>← Atrás</button>
            <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
              {guardando ? 'Creando...' : 'Crear elemento'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

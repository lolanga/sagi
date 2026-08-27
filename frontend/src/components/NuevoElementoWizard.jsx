import { useState } from 'react'
import api from '../services/api'
import Aviso from './Aviso'

const tiposCampo = ['texto', 'numero', 'fecha', 'select', 'textarea']
const norm = (s) => String(s ?? '').trim().toLowerCase()

export default function NuevoElementoWizard({ categoria, onGuardado, onCancel }) {
  const [paso, setPaso] = useState(1)
  const [nombre, setNombre] = useState('')
  const [campos, setCampos] = useState([])
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

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
    setError('')
    if (!nombre.trim()) {
      setError('Ingresa un nombre para el elemento.')
      return
    }
    setPaso(2)
  }

  const guardar = async () => {
    setError('')
    setGuardando(true)

    const camposConNombre = campos.filter((c) => c.nombre.trim())
    const duplicado = camposConNombre.find(
      (c, i) => camposConNombre.findIndex((v) => norm(v.nombre) === norm(c.nombre)) !== i
    )
    if (duplicado) {
      setError(`Nombre de campo duplicado: "${duplicado.nombre}"`)
      setGuardando(false)
      return
    }

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
          <span className={`wizard-step ${paso >= 1 ? 'active' : ''}`}>1. Nombre</span>
          <span className={`wizard-step ${paso >= 2 ? 'active' : ''}`}>2. Campos</span>
        </div>
      </div>

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      {paso === 1 && (
        <div className="wizard-paso">
          <div className="field">
            <label>Nombre del elemento *</label>
            <input
              type="text"
              placeholder="Ej. Escritorio, Computadora, Teclado"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && siguiente()}
            />
          </div>
          <p className="muted small">
            La categoría es: <strong>{categoria.codigo} — {categoria.nombre}</strong>
          </p>
          <div className="wizard-actions">
            <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
            <button className="btn btn-primary" onClick={siguiente}>Siguiente →</button>
          </div>
        </div>
      )}

      {paso === 2 && (
        <div className="wizard-paso">
          <p className="muted small" style={{ marginBottom: 12 }}>
            Elemento: <strong>{nombre}</strong> — Agrega los campos que necesita (opcional, puedes agregar después).
          </p>

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

          <button className="btn btn-secondary" onClick={agregarCampo} style={{ marginBottom: 16 }}>
            + Agregar campo
          </button>

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

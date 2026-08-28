import { useState } from 'react'
import api from '../services/api'
import Aviso from './Aviso'

const tiposCampo = ['texto', 'numero', 'fecha', 'select', 'textarea']

const norm = (s) => String(s ?? '').trim().toLowerCase()

export default function ElementoEditor({ elemento, campos, onGuardado, onVolver, esGeneral }) {
  const [lista, setLista] = useState(campos.map((c) => ({ ...c, _nuevo: false, _eliminado: false })))
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const agregarCampo = () => {
    setError('')
    const nuevo = {
      id: `nuevo_${Date.now()}`,
      nombre: '',
      tipo: 'texto',
      opciones: null,
      placeholder: '',
      requerido: false,
      activo: true,
      orden: lista.length,
      _nuevo: true,
      _eliminado: false,
    }
    setLista([...lista, nuevo])
  }

  const actualizarCampo = (id, campo, valor) => {
    setLista((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [campo]: valor } : c))
    )
  }

  const eliminarCampo = (id) => {
    setLista((prev) =>
      prev.map((c) => (c.id === id ? { ...c, _eliminado: true } : c))
    )
  }

  const restaurarCampo = (id) => {
    setLista((prev) =>
      prev.map((c) => (c.id === id ? { ...c, _eliminado: false } : c))
    )
  }

  const moverCampo = (id, direccion) => {
    const visibles = lista.filter((c) => !c._eliminado)
    const idx = visibles.findIndex((c) => c.id === id)
    if (idx === -1) return
    const nuevoIdx = direccion === 'up' ? idx - 1 : idx + 1
    if (nuevoIdx < 0 || nuevoIdx >= visibles.length) return

    const ids = visibles.map((c) => c.id)
    ;[ids[idx], ids[nuevoIdx]] = [ids[nuevoIdx], ids[idx]]

    const ordenMap = {}
    ids.forEach((id, i) => { ordenMap[id] = i })

    setLista((prev) =>
      prev.map((c) => (c._eliminado ? c : { ...c, orden: ordenMap[c.id] ?? c.orden }))
    )
  }

  const guardar = async () => {
    setError('')
    setGuardando(true)

    const visibles = lista.filter((c) => !c._eliminado)
    const duplicado = visibles.find(
      (c, i) => visibles.findIndex((v) => norm(v.nombre) === norm(c.nombre)) !== i
    )
    if (duplicado) {
      setError(`Nombre duplicado: "${duplicado.nombre}"`)
      setGuardando(false)
      return
    }

    const vacios = visibles.filter((c) => !c.nombre.trim())
    if (vacios.length > 0) {
      setError('Todos los campos deben tener nombre.')
      setGuardando(false)
      return
    }

    try {
      for (const campo of lista) {
        if (campo._eliminado && !campo._nuevo) {
          await api.delete(`/campos-dinamicos/${campo.id}`)
        } else if (!campo._eliminado && campo._nuevo) {
          const payload = {
            nombre: campo.nombre.trim(),
            tipo: campo.tipo,
            requerido: campo.requerido,
          }
          if (!esGeneral) payload.tipo_item_id = elemento.id
          if (campo.tipo === 'select' && campo.opciones) {
            payload.opciones = Array.isArray(campo.opciones)
              ? campo.opciones
              : campo.opciones.split(',').map((o) => o.trim()).filter(Boolean)
          }
          await api.post(`/categorias/${elemento.categoria_id}/campos`, payload)
        } else if (!campo._eliminado && !campo._nuevo) {
          const payload = {
            nombre: campo.nombre.trim(),
            tipo: campo.tipo,
            requerido: campo.requerido,
            activo: campo.activo,
            orden: campo.orden,
          }
          if (campo.tipo === 'select' && campo.opciones) {
            payload.opciones = Array.isArray(campo.opciones)
              ? campo.opciones
              : campo.opciones.split(',').map((o) => o.trim()).filter(Boolean)
          } else {
            payload.opciones = null
          }
          await api.put(`/campos-dinamicos/${campo.id}`, payload)
        }
      }

      for (const campo of lista.filter((c) => !c._eliminado)) {
        const orig = campos.find((o) => o.id === campo.id)
        if (orig && orig.orden !== campo.orden) {
          await api.post(`/campos-dinamicos/${campo.id}/mover`, {
            direccion: campo.orden < orig.orden ? 'up' : 'down',
          })
        }
      }

      onGuardado()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const visibles = lista.filter((c) => !c._eliminado).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  const eliminados = lista.filter((c) => c._eliminado && !c._nuevo)

  return (
    <div className="elemento-editor">
      <div className="elemento-editor-header">
        <button className="btn-back-inline" onClick={onVolver}>
          ← Volver
        </button>
        <h3>{esGeneral ? 'Campos generales de la categoría' : elemento?.nombre}</h3>
        <span className="campo-count-badge">{visibles.length} campo{visibles.length !== 1 ? 's' : ''}</span>
      </div>

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <div className="campo-rows">
        {visibles.map((campo, i) => (
          <div key={campo.id} className="campo-row">
            <div className="campo-row-orden">
              <button className="btn-icon" disabled={i === 0} onClick={() => moverCampo(campo.id, 'up')} title="Subir">↑</button>
              <button className="btn-icon" disabled={i === visibles.length - 1} onClick={() => moverCampo(campo.id, 'down')} title="Bajar">↓</button>
            </div>

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
                value={Array.isArray(campo.opciones) ? campo.opciones.join(', ') : (campo.opciones || '')}
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

            <label className="campo-row-check" title="Activo">
              <input
                type="checkbox"
                checked={campo.activo}
                onChange={(e) => actualizarCampo(campo.id, 'activo', e.target.checked)}
              />
              <span>Act.</span>
            </label>

            <button className="btn-icon btn-danger" onClick={() => eliminarCampo(campo.id)} title="Eliminar campo">✕</button>
          </div>
        ))}
      </div>

      {eliminados.length > 0 && (
        <div className="campo-eliminados">
          <span className="campo-eliminados-label">Eliminados:</span>
          {eliminados.map((campo) => (
            <span key={campo.id} className="campo-eliminado-chip">
              {campo.nombre || '(sin nombre)'}
              <button onClick={() => restaurarCampo(campo.id)} title="Restaurar">↩</button>
            </span>
          ))}
        </div>
      )}

      <div className="elemento-editor-actions">
        <button className="btn btn-secondary" onClick={agregarCampo}>+ Agregar campo</button>
        <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

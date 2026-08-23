import { useEffect, useState } from 'react'
import api from '../services/api'
import Aviso from '../components/Aviso'
import Modal from '../components/Modal'
import Layout from '../components/Layout'
import '../styles/categorias.css'

const tiposCampo = ['texto', 'numero', 'fecha', 'select', 'textarea']

export default function Categorias() {
  const [categorias, setCategorias] = useState([])
  const [selected, setSelected] = useState(null)
  const [nuevoCampo, setNuevoCampo] = useState({ nombre: '', tipo: 'texto', opciones: '' })
  const [nuevoTipo, setNuevoTipo] = useState('')
  const [editandoTipo, setEditandoTipo] = useState(null)
  const [nombreEdit, setNombreEdit] = useState('')
  const [editandoCampo, setEditandoCampo] = useState(null)
  const [formCampo, setFormCampo] = useState({ nombre: '', tipo: 'texto', opciones: '', requerido: false })
  const [scopeTipo, setScopeTipo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const norm = (s) => String(s ?? '').trim().toLowerCase()

  const cargar = () => {
    api.get('/categorias').then((res) => {
      const cats = res.data.categorias || []
      setCategorias(cats)
      if (selected) {
        setSelected(cats.find((c) => c.id === selected.id) || null)
      }
    }).finally(() => setLoading(false))
  }

  useEffect(cargar, [])

  const agregarCampo = async (e) => {
    e.preventDefault()
    setError('')
    if (!selected) return

    if (camposDelScope.some((c) => norm(c.nombre) === norm(nuevoCampo.nombre))) {
      setError('Ya existe un campo con ese nombre en este ámbito.')
      return
    }

    const payload = {
      nombre: nuevoCampo.nombre.trim(),
      tipo: nuevoCampo.tipo,
    }
    if (scopeTipo) payload.tipo_item_id = Number(scopeTipo)
    if (nuevoCampo.tipo === 'select' && nuevoCampo.opciones) {
      payload.opciones = nuevoCampo.opciones.split(',').map((o) => o.trim()).filter(Boolean)
    }

    try {
      await api.post(`/categorias/${selected.id}/campos`, payload)
      setNuevoCampo({ nombre: '', tipo: 'texto', opciones: '' })
      cargar()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agregar campo')
    }
  }

  const toggleCampo = async (campo) => {
    await api.put(`/campos-dinamicos/${campo.id}`, { activo: !campo.activo })
    cargar()
  }

  const abrirEdicionCampo = (campo) => {
    setError('')
    setFormCampo({
      nombre: campo.nombre,
      tipo: campo.tipo,
      opciones: (campo.opciones || []).join(', '),
      requerido: Boolean(campo.requerido),
    })
    setEditandoCampo(campo)
  }

  const guardarCampo = async (e) => {
    e.preventDefault()
    setError('')
    if (!editandoCampo) return

    if (camposDelScope.some((c) => c.id !== editandoCampo.id && norm(c.nombre) === norm(formCampo.nombre))) {
      setError('Ya existe un campo con ese nombre en este ámbito.')
      return
    }

    const payload = {
      nombre: formCampo.nombre.trim(),
      tipo: formCampo.tipo,
      requerido: formCampo.requerido,
      opciones: formCampo.tipo === 'select'
        ? formCampo.opciones.split(',').map((o) => o.trim()).filter(Boolean)
        : null,
    }

    try {
      await api.put(`/campos-dinamicos/${editandoCampo.id}`, payload)
      setEditandoCampo(null)
      cargar()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el campo')
    }
  }

  const eliminarCampo = async (campo) => {
    if (!window.confirm(`¿Eliminar el campo "${campo.nombre}"?`)) return
    await api.delete(`/campos-dinamicos/${campo.id}`)
    cargar()
  }

  const moverCampo = async (campo, direccion) => {
    try {
      await api.post(`/campos-dinamicos/${campo.id}/mover`, { direccion })
      cargar()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al reordenar campo')
    }
  }

  const agregarTipo = async (e) => {
    e.preventDefault()
    setError('')
    if (!selected || !nuevoTipo.trim()) return

    if (ordenar(selected.tipos_items).some((t) => norm(t.nombre) === norm(nuevoTipo))) {
      setError('Ya existe un elemento con ese nombre en esta categoría.')
      return
    }

    try {
      await api.post(`/categorias/${selected.id}/tipos`, { nombre: nuevoTipo.trim() })
      setNuevoTipo('')
      cargar()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agregar elemento')
    }
  }

  const renombrarTipo = async (e) => {
    e.preventDefault()
    setError('')
    if (!editandoTipo || !nombreEdit.trim()) return

    if (ordenar(selected.tipos_items).some((t) => t.id !== editandoTipo.id && norm(t.nombre) === norm(nombreEdit))) {
      setError('Ya existe un elemento con ese nombre en esta categoría.')
      return
    }

    try {
      await api.put(`/tipos-item/${editandoTipo.id}`, { nombre: nombreEdit.trim() })
      setEditandoTipo(null)
      setNombreEdit('')
      cargar()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al renombrar elemento')
    }
  }

  const abrirEdicionTipo = (tipo) => {
    setError('')
    setNombreEdit(tipo.nombre)
    setEditandoTipo(tipo)
  }

  const eliminarTipo = async (tipo) => {
    if (!window.confirm(`¿Eliminar el elemento "${tipo.nombre}"?`)) return
    await api.delete(`/tipos-item/${tipo.id}`)
    cargar()
  }

  const moverTipo = async (tipo, direccion) => {
    try {
      await api.post(`/tipos-item/${tipo.id}/mover`, { direccion })
      cargar()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al reordenar elemento')
    }
  }

  const ordenar = (lista) => [...(lista || [])].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))

  const camposDelScope = (selected?.campos_dinamicos || []).filter((c) =>
    scopeTipo ? c.tipo_item_id === Number(scopeTipo) : !c.tipo_item_id
  )

  return (
    <Layout title="Administración de categorías" back="/inventario">
      {loading ? (
        <p className="muted">Cargando...</p>
      ) : (
            <div className="categorias-grid">
              <div className="categorias-list">
                <h3>Categorías</h3>
                {categorias.map((c) => (
                  <button
                    key={c.id}
                    className={`categoria-item ${selected?.id === c.id ? 'active' : ''}`}
                    onClick={() => { setSelected(c); setScopeTipo('') }}
                  >
                    <strong>{c.codigo}</strong>
                    <span>{c.nombre}</span>
                    {c.es_transitoria && <span className="badge badge-baja">transitoria</span>}
                  </button>
                ))}
              </div>

              {selected && (
                <div className="campos-panel">
                  <h3>Campos dinámicos — {selected.codigo} {selected.nombre}</h3>

                  <div className="scope-form">
                    <label>Campos del elemento:</label>
                    <select
                      value={scopeTipo}
                      onChange={(e) => setScopeTipo(e.target.value)}
                    >
                      <option value="">Campos generales de la categoría</option>
                      {ordenar(selected.tipos_items).map((t) => (
                        <option key={t.id} value={t.id}>{t.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <form onSubmit={agregarCampo} className="nuevo-campo-form">
                    <input
                      type="text"
                      placeholder="Ej. Marca, Material, Cantidad"
                      value={nuevoCampo.nombre}
                      onChange={(e) => setNuevoCampo({ ...nuevoCampo, nombre: e.target.value })}
                      required
                    />
                    <select
                      value={nuevoCampo.tipo}
                      onChange={(e) => setNuevoCampo({ ...nuevoCampo, tipo: e.target.value })}
                    >
                      {tiposCampo.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {nuevoCampo.tipo === 'select' && (
                      <input
                        type="text"
                        placeholder="Ej. Rojo, Azul, Verde"
                        value={nuevoCampo.opciones}
                        onChange={(e) => setNuevoCampo({ ...nuevoCampo, opciones: e.target.value })}
                      />
                    )}
                    <button type="submit" className="btn btn-primary">+ Agregar</button>
                  </form>

                  <Aviso mensaje={error} onCerrar={() => setError('')} />

                  {ordenar(camposDelScope).length === 0 ? (
                    <p className="muted">Sin campos definidos.</p>
                  ) : (
                    <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Campo</th>
                          <th>Tipo</th>
                          <th>Requerido</th>
                          <th>Activo</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordenar(camposDelScope).map((campo, i) => {
                          const total = camposDelScope.length
                          return (
                            <tr key={campo.id} className={campo.activo ? '' : 'row-inactivo'}>
                              <td data-label="#" className="orden-col">
                                <div className="orden-buttons">
                                  <button className="btn-icon" disabled={i === 0} onClick={() => moverCampo(campo, 'up')} title="Subir">↑</button>
                                  <button className="btn-icon" disabled={i === total - 1} onClick={() => moverCampo(campo, 'down')} title="Bajar">↓</button>
                                </div>
                              </td>
                              <td data-label="Campo">{campo.nombre}</td>
                              <td data-label="Tipo">{campo.tipo}{campo.opciones?.length ? ` (${campo.opciones.join(', ')})` : ''}</td>
                              <td data-label="Requerido">{campo.requerido ? 'Sí' : 'No'}</td>
                              <td data-label="Activo">{campo.activo ? 'Sí' : 'No'}</td>
                              <td data-label="Acciones" className="row-actions">
                                <button className="btn-link btn-link-editar" onClick={() => abrirEdicionCampo(campo)}>
                                  Editar
                                </button>
                                <button className="btn-link" onClick={() => toggleCampo(campo)}>
                                  {campo.activo ? 'Desactivar' : 'Activar'}
                                </button>
                                <button className="btn-link btn-link-danger" onClick={() => eliminarCampo(campo)}>
                                  Eliminar
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    </div>
                  )}

                  <div className="elementos-section">
                    <h4>Elementos de la categoría</h4>
                    <form onSubmit={agregarTipo} className="nuevo-campo-form">
                      <input
                        type="text"
                        placeholder="Ej. Escritorio, Silla, Teclado"
                        value={nuevoTipo}
                        onChange={(e) => setNuevoTipo(e.target.value)}
                        required
                      />
                      <button type="submit" className="btn btn-primary">+ Agregar</button>
                    </form>

                    {ordenar(selected.tipos_items).length === 0 ? (
                      <p className="muted">Sin elementos definidos.</p>
                    ) : (
                      <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Elemento</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {ordenar(selected.tipos_items).map((tipo, i) => {
                            const total = selected.tipos_items.length
                            return (
                              <tr key={tipo.id}>
                                <td data-label="#" className="orden-col">
                                  <div className="orden-buttons">
                                    <button className="btn-icon" disabled={i === 0} onClick={() => moverTipo(tipo, 'up')} title="Subir">↑</button>
                                    <button className="btn-icon" disabled={i === total - 1} onClick={() => moverTipo(tipo, 'down')} title="Bajar">↓</button>
                                  </div>
                                </td>
                                <td data-label="Elemento">{tipo.nombre}</td>
                                <td data-label="Acciones" className="row-actions">
                                  <button className="btn-link btn-link-editar" onClick={() => abrirEdicionTipo(tipo)}>
                                    Editar
                                  </button>
                                  <button className="btn-link btn-link-danger" onClick={() => eliminarTipo(tipo)}>
                                    Eliminar
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

      <Modal open={Boolean(editandoTipo)} title={`Editar elemento — ${editandoTipo?.nombre ?? ''}`} onClose={() => setEditandoTipo(null)}>
        <form onSubmit={renombrarTipo} className="item-form">
          <div className="field">
            <label htmlFor="nombre-elemento">Nuevo nombre *</label>
            <input
              id="nombre-elemento"
              type="text"
              value={nombreEdit}
              onChange={(e) => setNombreEdit(e.target.value)}
              placeholder="Ej. Silla de oficina"
              autoFocus
              required
            />
          </div>
          <Aviso mensaje={error} onCerrar={() => setError('')} />
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setEditandoTipo(null)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(editandoCampo)} title={`Editar campo — ${editandoCampo?.nombre ?? ''}`} onClose={() => setEditandoCampo(null)}>
        <form onSubmit={guardarCampo} className="item-form">
          <div className="field">
            <label htmlFor="campo-nombre">Nombre del campo *</label>
            <input
              id="campo-nombre"
              type="text"
              value={formCampo.nombre}
              onChange={(e) => setFormCampo({ ...formCampo, nombre: e.target.value })}
              placeholder="Ej. Marca, Material, Cantidad"
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label htmlFor="campo-tipo">Tipo de dato *</label>
            <select
              id="campo-tipo"
              value={formCampo.tipo}
              onChange={(e) => setFormCampo({ ...formCampo, tipo: e.target.value })}
            >
              {tiposCampo.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {formCampo.tipo === 'select' && (
            <div className="field">
              <label htmlFor="campo-opciones">Opciones (separadas por coma) *</label>
              <input
                id="campo-opciones"
                type="text"
                value={formCampo.opciones}
                onChange={(e) => setFormCampo({ ...formCampo, opciones: e.target.value })}
                placeholder="Ej. Rojo, Azul, Verde"
              />
            </div>
          )}
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={formCampo.requerido}
              onChange={(e) => setFormCampo({ ...formCampo, requerido: e.target.checked })}
            />
            Campo requerido al dar de alta un ítem
          </label>
          <Aviso mensaje={error} onCerrar={() => setError('')} />
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setEditandoCampo(null)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
import { useEffect, useState } from 'react'
import api from '../services/api'
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
  const [scopeTipo, setScopeTipo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

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

    const payload = {
      nombre: nuevoCampo.nombre,
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

                  {error && <p className="form-error">{error}</p>}

                  {ordenar(camposDelScope).length === 0 ? (
                    <p className="muted">Sin campos definidos.</p>
                  ) : (
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
                              <td className="orden-col">
                                <div className="orden-buttons">
                                  <button className="btn-icon" disabled={i === 0} onClick={() => moverCampo(campo, 'up')} title="Subir">↑</button>
                                  <button className="btn-icon" disabled={i === total - 1} onClick={() => moverCampo(campo, 'down')} title="Bajar">↓</button>
                                </div>
                              </td>
                              <td>{campo.nombre}</td>
                              <td>{campo.tipo}{campo.opciones?.length ? ` (${campo.opciones.join(', ')})` : ''}</td>
                              <td>{campo.requerido ? 'Sí' : 'No'}</td>
                              <td>{campo.activo ? 'Sí' : 'No'}</td>
                              <td className="row-actions">
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
                                <td className="orden-col">
                                  <div className="orden-buttons">
                                    <button className="btn-icon" disabled={i === 0} onClick={() => moverTipo(tipo, 'up')} title="Subir">↑</button>
                                    <button className="btn-icon" disabled={i === total - 1} onClick={() => moverTipo(tipo, 'down')} title="Bajar">↓</button>
                                  </div>
                                </td>
                                <td>{tipo.nombre}</td>
                                <td className="row-actions">
                                  <button className="btn-link" onClick={() => abrirEdicionTipo(tipo)}>
                                    Renombrar
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
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

      <Modal open={Boolean(editandoTipo)} title={`Renombrar elemento — ${editandoTipo?.nombre ?? ''}`} onClose={() => setEditandoTipo(null)}>
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
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setEditandoTipo(null)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
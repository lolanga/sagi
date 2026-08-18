import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import '../styles/categorias.css'

const tiposCampo = ['texto', 'numero', 'fecha', 'select', 'textarea']

export default function Categorias() {
  const { user } = useAuth()
  const [categorias, setCategorias] = useState([])
  const [selected, setSelected] = useState(null)
  const [nuevoCampo, setNuevoCampo] = useState({ nombre: '', tipo: 'texto', opciones: '' })
  const [nuevoTipo, setNuevoTipo] = useState('')
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

  const renombrarTipo = async (tipo) => {
    const nombre = window.prompt('Nuevo nombre del elemento:', tipo.nombre)
    if (!nombre || nombre.trim() === tipo.nombre) return
    await api.put(`/tipos-item/${tipo.id}`, { nombre: nombre.trim() })
    cargar()
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

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">SAGI</div>
        <nav className="sidebar-nav">
          <Link to="/" className="nav-item"><span className="nav-icon">📊</span>Dashboard</Link>
          <Link to="/inventario" className="nav-item"><span className="nav-icon">📦</span>Inventario</Link>
          <Link to="/categorias" className="nav-item active"><span className="nav-icon">⚙️</span>Categorías</Link>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>Administración de categorías</h1>
            <p className="topbar-user">{user?.name} · {user?.rol?.nombre}</p>
          </div>
        </header>

        <section className="content">
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
                    onClick={() => setSelected(c)}
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

                  <form onSubmit={agregarCampo} className="nuevo-campo-form">
                    <input
                      type="text"
                      placeholder="Nombre del campo"
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
                        placeholder="Opciones separadas por coma"
                        value={nuevoCampo.opciones}
                        onChange={(e) => setNuevoCampo({ ...nuevoCampo, opciones: e.target.value })}
                      />
                    )}
                    <button type="submit" className="btn btn-primary">+ Agregar</button>
                  </form>

                  {error && <p className="form-error">{error}</p>}

                  {ordenar(selected.campos_dinamicos).length === 0 ? (
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
                        {ordenar(selected.campos_dinamicos).map((campo, i) => {
                          const total = selected.campos_dinamicos.length
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
                        placeholder="Nombre del elemento (ej. Escritorio, Silla)"
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
                                  <button className="btn-link" onClick={() => renombrarTipo(tipo)}>
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
        </section>
      </main>
    </div>
  )
}
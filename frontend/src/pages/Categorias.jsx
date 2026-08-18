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

                  {selected.campos_dinamicos?.length === 0 ? (
                    <p className="muted">Sin campos definidos.</p>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Campo</th>
                          <th>Tipo</th>
                          <th>Requerido</th>
                          <th>Activo</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.campos_dinamicos.map((campo) => (
                          <tr key={campo.id} className={campo.activo ? '' : 'row-inactivo'}>
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
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
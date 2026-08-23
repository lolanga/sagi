import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Aviso from '../components/Aviso'
import Layout from '../components/Layout'
import '../styles/inventario.css'

export default function Unidades() {
  const { user } = useAuth()
  const [sedes, setSedes] = useState([])
  const [unidades, setUnidades] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [verInactivas, setVerInactivas] = useState(false)
  const [error, setError] = useState('')

  const puedeGestionar = user?.rol?.slug === 'admin'

  const cargar = async () => {
    try {
      const [rS, rU] = await Promise.all([api.get('/sedes'), api.get('/unidades')])
      setSedes(rS.data.sedes || [])
      setUnidades(rU.data.unidades || [])
    } catch {
      setError('No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const sedeDe = (id) => sedes.find((s) => s.id === id)?.nombre ?? '-'

  const norm = (s) => String(s ?? '').trim().toLowerCase()

  const guardarSede = async (sede, nombre) => {
    setError('')
    if (sedes.some((x) => x.id !== sede.id && norm(x.nombre) === norm(nombre))) {
      setError('Ya existe una sede con ese nombre.')
      return false
    }
    const antes = sede.nombre
    try {
      const r = await api.put(`/sedes/${sede.id}`, { nombre })
      setSedes((s) => s.map((x) => (x.id === sede.id ? { ...x, nombre: r.data.sede.nombre } : x)))
      return true
    } catch (err) {
      setSedes((s) => s.map((x) => (x.id === sede.id ? { ...x, nombre: antes } : x)))
      setError(err.response?.data?.message || 'Error al renombrar la sede')
      return false
    }
  }

  const crearSede = async (e) => {
    e.preventDefault()
    setError('')
    const form = e.target
    const nombre = new FormData(form).get('nueva_sede').trim()
    if (!nombre) return
    if (sedes.some((x) => norm(x.nombre) === norm(nombre))) {
      setError('Ya existe una sede con ese nombre.')
      return
    }
    try {
      const r = await api.post('/sedes', { nombre })
      setSedes((s) => [...s, r.data.sede])
      form.reset()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la sede')
    }
  }

  const eliminarSede = async (sede) => {
    setError('')
    if (sede.unidades?.length > 0) {
      setError('No se puede eliminar la sede porque tiene unidades asociadas.')
      return
    }
    if (!window.confirm(`¿Eliminar la sede "${sede.nombre}"?`)) return
    try {
      await api.delete(`/sedes/${sede.id}`)
      setSedes((s) => s.filter((x) => x.id !== sede.id))
      setUnidades((u) => u.filter((x) => x.sede_id !== sede.id))
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar la sede')
    }
  }

  const toggleSede = async (sede) => {
    setError('')
    const objetivo = !sede.activa
    try {
      const r = await api.put(`/sedes/${sede.id}`, { activa: objetivo })
      setSedes((s) => s.map((x) => (x.id === sede.id ? { ...x, activa: r.data.sede.activa } : x)))
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar el estado de la sede')
    }
  }

  const toggleUnidad = async (unidad) => {
    setError('')
    const objetivo = !unidad.activa
    try {
      const r = await api.put(`/unidades/${unidad.id}`, { activa: objetivo })
      setUnidades((u) => u.map((x) => (x.id === unidad.id ? { ...x, activa: r.data.unidad.activa } : x)))
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar el estado de la unidad')
    }
  }

  const guardarUnidad = async (unidad, cambios) => {
    setError('')
    const sedeFinal = cambios.sede_id ?? unidad.sede_id
    const nombreFinal = cambios.nombre ?? unidad.nombre
    if (unidades.some((x) => x.id !== unidad.id && x.sede_id === sedeFinal && norm(x.nombre) === norm(nombreFinal))) {
      setError('Ya existe una unidad con ese nombre en la sede seleccionada.')
      return false
    }
    try {
      const r = await api.put(`/unidades/${unidad.id}`, cambios)
      setUnidades((u) => u.map((x) => (x.id === unidad.id ? r.data.unidad : x)))
      return true
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la unidad')
      return false
    }
  }

  const crearUnidad = async (e) => {
    e.preventDefault()
    setError('')
    const form = e.target
    const nombre = new FormData(form).get('nueva_unidad').trim()
    const sedeId = form.sede_id.value
    if (!nombre || !sedeId) return
    if (unidades.some((x) => x.sede_id === Number(sedeId) && norm(x.nombre) === norm(nombre))) {
      setError('Ya existe una unidad con ese nombre en la sede seleccionada.')
      return
    }
    try {
      const r = await api.post('/unidades', { nombre, sede_id: Number(sedeId) })
      setUnidades((u) => [...u, r.data.unidad])
      form.reset()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la unidad')
    }
  }

  const eliminarUnidad = async (unidad) => {
    setError('')
    if (!window.confirm(`¿Eliminar la unidad "${unidad.nombre}"?`)) return
    try {
      await api.delete(`/unidades/${unidad.id}`)
      setUnidades((u) => u.filter((x) => x.id !== unidad.id))
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar la unidad')
    }
  }

  const termino = busqueda.trim().toLowerCase()
  const unidadesBase = unidades.filter((u) => verInactivas || u.activa)
  const unidadesFiltradas = unidadesBase
    .filter((u) => !termino || u.nombre.toLowerCase().includes(termino) || sedeDe(u.sede_id).toLowerCase().includes(termino))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const sedesVisibles = sedes.filter((s) => verInactivas || s.activa)

  return (
    <Layout title="Sedes y Unidades de destino" back="/">
      <Aviso mensaje={error} onCerrar={() => setError('')} />
      {loading ? (
        <p className="muted">Cargando...</p>
      ) : (
        <>
          {puedeGestionar && (
            <div className="panel-admin">
              <div className="panel-admin-section">
                <h3>Sedes</h3>
                <div className="sedes-grid">
                  {sedesVisibles.map((sede) => (
                    <div key={sede.id} className={`sede-card ${sede.activa ? '' : 'inactiva'}`}>
                      <input
                        className="editable-input"
                        type="text"
                        defaultValue={sede.nombre}
                        onBlur={async (e) => {
                          const valor = e.target.value.trim()
                          if (valor && valor !== sede.nombre) {
                            const ok = await guardarSede(sede, valor)
                            if (!ok) e.target.value = sede.nombre
                          } else {
                            e.target.value = sede.nombre
                          }
                        }}
                      />
                      <div className="sede-card-meta">
                        <span className="result-count">{sede.unidades?.length ?? 0} unidades</span>
                        {puedeGestionar && (
                          <div className="row-actions">
                            <button className="btn-link" onClick={() => toggleSede(sede)}>
                              {sede.activa ? 'Desactivar' : 'Activar'}
                            </button>
                            <button className="btn-link btn-link-danger" onClick={() => eliminarSede(sede)}>Eliminar</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <form className="inline-form" onSubmit={crearSede}>
                  <input name="nueva_sede" type="text" placeholder="Nombre de la nueva sede" required />
                  <button className="btn btn-primary" type="submit">+ Agregar sede</button>
                </form>
              </div>

              <div className="panel-admin-section">
                <h3>Nueva unidad de destino</h3>
                <form className="inline-form" onSubmit={crearUnidad}>
                  <input name="nueva_unidad" type="text" placeholder="Ej. Secretaría Académica" required />
                  <select name="sede_id" required defaultValue="">
                    <option value="" disabled>Seleccionar sede...</option>
                    {sedes.filter((s) => s.activa).map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                  <button className="btn btn-primary" type="submit">+ Crear unidad</button>
                </form>
              </div>
            </div>
          )}

          <div className="filters-bar">
            <input
              className="search-input"
              type="text"
              placeholder="Buscar por nombre o sede..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={verInactivas}
                onChange={(e) => setVerInactivas(e.target.checked)}
              />
              Ver desactivadas
            </label>
            <span className="result-count">{unidadesFiltradas.length} unidades</span>
          </div>

          {unidadesFiltradas.length === 0 ? (
            <div className="placeholder">
              <h2>Sin resultados</h2>
              <p>No hay unidades que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Sede</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {unidadesFiltradas.map((u) => (
                  <tr key={u.id} className={u.activa ? '' : 'inactiva'}>
                    <td data-label="Nombre">
                      <input
                        className="editable-input"
                        type="text"
                        defaultValue={u.nombre}
                        onBlur={async (e) => {
                          const valor = e.target.value.trim()
                          if (valor && valor !== u.nombre) {
                            const ok = await guardarUnidad(u, { nombre: valor })
                            if (!ok) e.target.value = u.nombre
                          } else {
                            e.target.value = u.nombre
                          }
                        }}
                      />
                    </td>
                    <td data-label="Sede">
                      <select
                        className="editable-select"
                        value={u.sede_id}
                        onChange={async (e) => {
                          const ok = await guardarUnidad(u, { sede_id: Number(e.target.value) })
                          if (!ok) e.target.value = u.sede_id
                        }}
                      >
                        {sedes.map((s) => (
                          <option key={s.id} value={s.id}>{s.nombre}{s.activa ? '' : ' (inactiva)'}</option>
                        ))}
                      </select>
                    </td>
                    <td data-label="Acciones">
                      {puedeGestionar && (
                        <div className="row-actions">
                          <button className="btn-link" onClick={() => toggleUnidad(u)}>
                            {u.activa ? 'Desactivar' : 'Activar'}
                          </button>
                          <button className="btn-link btn-link-danger" onClick={() => eliminarUnidad(u)}>Eliminar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
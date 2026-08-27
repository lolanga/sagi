import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import '../styles/inventario.css'
import '../styles/unidades.css'

export default function Unidades() {
  const { user } = useAuth()
  const toast = useToast()
  const [sedes, setSedes] = useState([])
  const [unidades, setUnidades] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('sedes')
  const [busqueda, setBusqueda] = useState('')
  const [verInactivas, setVerInactivas] = useState(false)
  const [sedesAbiertas, setSedesAbiertas] = useState({})

  const [showCrearSede, setShowCrearSede] = useState(false)
  const [sedeEdit, setSedeEdit] = useState(null)
  const [sedeEliminar, setSedeEliminar] = useState(null)
  const [formSede, setFormSede] = useState('')
  const [errorSede, setErrorSede] = useState('')
  const [savingSede, setSavingSede] = useState(false)

  const [showCrearUnidad, setShowCrearUnidad] = useState(false)
  const [unidadEdit, setUnidadEdit] = useState(null)
  const [unidadEliminar, setUnidadEliminar] = useState(null)
  const [formUnidad, setFormUnidad] = useState({ nombre: '', sede_id: '' })
  const [errorUnidad, setErrorUnidad] = useState('')
  const [savingUnidad, setSavingUnidad] = useState(false)

  const puedeGestionar = user?.rol?.slug === 'admin'

  const cargar = async () => {
    try {
      const [rS, rU] = await Promise.all([api.get('/sedes'), api.get('/unidades')])
      setSedes(rS.data.sedes || [])
      setUnidades(rU.data.unidades || [])
    } catch {
      toast?.error('No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const norm = (s) => String(s ?? '').trim().toLowerCase()
  const sedeDe = (id) => sedes.find((s) => s.id === id)?.nombre ?? '-'

  const abrirCrearSede = () => { setFormSede(''); setErrorSede(''); setShowCrearSede(true) }
  const abrirEditarSede = (s) => { setSedeEdit(s); setFormSede(s.nombre); setErrorSede('') }
  const abrirEliminarSede = (s) => { setSedeEliminar(s) }

  const submitCrearSede = async (e) => {
    e.preventDefault()
    const nombre = formSede.trim()
    if (!nombre) { setErrorSede('El nombre es obligatorio'); return }
    if (sedes.some((x) => norm(x.nombre) === norm(nombre))) { setErrorSede('Ya existe una sede con ese nombre'); return }
    setSavingSede(true)
    try {
      const r = await api.post('/sedes', { nombre })
      setSedes((s) => [...s, r.data.sede])
      setShowCrearSede(false)
      toast?.success('Sede creada correctamente')
    } catch (err) {
      setErrorSede(err.response?.data?.message || 'Error al crear la sede')
    } finally {
      setSavingSede(false)
    }
  }

  const submitEditarSede = async (e) => {
    e.preventDefault()
    const nombre = formSede.trim()
    if (!nombre) { setErrorSede('El nombre es obligatorio'); return }
    if (sedes.some((x) => x.id !== sedeEdit.id && norm(x.nombre) === norm(nombre))) { setErrorSede('Ya existe una sede con ese nombre'); return }
    setSavingSede(true)
    try {
      const r = await api.put(`/sedes/${sedeEdit.id}`, { nombre })
      setSedes((s) => s.map((x) => (x.id === sedeEdit.id ? r.data.sede : x)))
      setSedeEdit(null)
      toast?.success('Sede actualizada')
    } catch (err) {
      setErrorSede(err.response?.data?.message || 'Error al guardar')
    } finally {
      setSavingSede(false)
    }
  }

  const confirmEliminarSede = async () => {
    if (!sedeEliminar) return
    setSavingSede(true)
    try {
      await api.delete(`/sedes/${sedeEliminar.id}`)
      setSedes((s) => s.filter((x) => x.id !== sedeEliminar.id))
      setUnidades((u) => u.filter((x) => x.sede_id !== sedeEliminar.id))
      setSedeEliminar(null)
      toast?.success('Sede eliminada')
    } catch (err) {
      toast?.error(err.response?.data?.message || 'Error al eliminar')
      setSedeEliminar(null)
    } finally {
      setSavingSede(false)
    }
  }

  const toggleSede = async (sede) => {
    try {
      const r = await api.put(`/sedes/${sede.id}`, { activa: !sede.activa })
      setSedes((s) => s.map((x) => (x.id === sede.id ? r.data.sede : x)))
      toast?.success(sede.activa ? 'Sede desactivada' : 'Sede activada')
    } catch (err) {
      toast?.error(err.response?.data?.message || 'Error al cambiar estado')
    }
  }

  const abrirCrearUnidad = () => { setFormUnidad({ nombre: '', sede_id: '' }); setErrorUnidad(''); setShowCrearUnidad(true) }
  const abrirEditarUnidad = (u) => { setUnidadEdit(u); setFormUnidad({ nombre: u.nombre, sede_id: u.sede_id }); setErrorUnidad('') }
  const abrirEliminarUnidad = (u) => { setUnidadEliminar(u) }

  const submitCrearUnidad = async (e) => {
    e.preventDefault()
    const nombre = formUnidad.nombre.trim()
    const sedeId = Number(formUnidad.sede_id)
    if (!nombre) { setErrorUnidad('El nombre es obligatorio'); return }
    if (!sedeId) { setErrorUnidad('Seleccioná una sede'); return }
    if (unidades.some((x) => x.sede_id === sedeId && norm(x.nombre) === norm(nombre))) { setErrorUnidad('Ya existe una unidad con ese nombre en la sede'); return }
    setSavingUnidad(true)
    try {
      const r = await api.post('/unidades', { nombre, sede_id: sedeId })
      setUnidades((u) => [...u, r.data.unidad])
      setShowCrearUnidad(false)
      toast?.success('Unidad creada correctamente')
    } catch (err) {
      setErrorUnidad(err.response?.data?.message || 'Error al crear la unidad')
    } finally {
      setSavingUnidad(false)
    }
  }

  const submitEditarUnidad = async (e) => {
    e.preventDefault()
    const nombre = formUnidad.nombre.trim()
    const sedeId = Number(formUnidad.sede_id)
    if (!nombre) { setErrorUnidad('El nombre es obligatorio'); return }
    if (!sedeId) { setErrorUnidad('Seleccioná una sede'); return }
    if (unidades.some((x) => x.id !== unidadEdit.id && x.sede_id === sedeId && norm(x.nombre) === norm(nombre))) { setErrorUnidad('Ya existe una unidad con ese nombre en la sede'); return }
    setSavingUnidad(true)
    try {
      const r = await api.put(`/unidades/${unidadEdit.id}`, { nombre, sede_id: sedeId })
      setUnidades((u) => u.map((x) => (x.id === unidadEdit.id ? r.data.unidad : x)))
      setUnidadEdit(null)
      toast?.success('Unidad actualizada')
    } catch (err) {
      setErrorUnidad(err.response?.data?.message || 'Error al guardar')
    } finally {
      setSavingUnidad(false)
    }
  }

  const confirmEliminarUnidad = async () => {
    if (!unidadEliminar) return
    setSavingUnidad(true)
    try {
      await api.delete(`/unidades/${unidadEliminar.id}`)
      setUnidades((u) => u.filter((x) => x.id !== unidadEliminar.id))
      setUnidadEliminar(null)
      toast?.success('Unidad eliminada')
    } catch (err) {
      toast?.error(err.response?.data?.message || 'Error al eliminar')
      setUnidadEliminar(null)
    } finally {
      setSavingUnidad(false)
    }
  }

  const toggleUnidad = async (u) => {
    try {
      const r = await api.put(`/unidades/${u.id}`, { activa: !u.activa })
      setUnidades((us) => us.map((x) => (x.id === u.id ? r.data.unidad : x)))
      toast?.success(u.activa ? 'Unidad desactivada' : 'Unidad activada')
    } catch (err) {
      toast?.error(err.response?.data?.message || 'Error al cambiar estado')
    }
  }

  const termino = busqueda.trim().toLowerCase()
  const unidadesVisibles = unidades
    .filter((u) => verInactivas || u.activa)
    .filter((u) => !termino || u.nombre.toLowerCase().includes(termino) || sedeDe(u.sede_id).toLowerCase().includes(termino))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const sedesVisibles = sedes.filter((s) => verInactivas || s.activa)

  const toggleSedeAbierta = (sedeId) => {
    setSedesAbiertas((prev) => ({ ...prev, [sedeId]: !prev[sedeId] }))
  }

  const unidadesPorSede = sedesVisibles.map((sede) => ({
    sede,
    unidades: unidadesVisibles.filter((u) => u.sede_id === sede.id),
  })).filter((g) => g.unidades.length > 0 || !termino)

  const SkeletonCards = ({ count = 4 }) => (
    <div className="sedes-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sede-card skeleton-card">
          <div className="skeleton-line" style={{ width: '60%', height: 20 }} />
          <div className="skeleton-line" style={{ width: '40%', height: 14, marginTop: 8 }} />
          <div className="skeleton-line" style={{ width: '80%', height: 14, marginTop: 6 }} />
        </div>
      ))}
    </div>
  )

  return (
    <Layout title="Sedes y Unidades de destino" back="/">
      <div className="unidades-page">
        {puedeGestionar && (
          <div className="tabs-bar">
            <button className={`tab-btn ${tab === 'sedes' ? 'tab-active' : ''}`} onClick={() => setTab('sedes')}>
              Sedes
            </button>
            <button className={`tab-btn ${tab === 'unidades' ? 'tab-active' : ''}`} onClick={() => setTab('unidades')}>
              Unidades de destino
            </button>
          </div>
        )}

        {tab === 'sedes' && (
          <div className="tab-content">
            <div className="filters-bar">
              <input
                className="search-input"
                type="text"
                placeholder="Buscar sede..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <label className="checkbox-inline">
                <input type="checkbox" checked={verInactivas} onChange={(e) => setVerInactivas(e.target.checked)} />
                Ver desactivadas
              </label>
              {puedeGestionar && (
                <button className="btn btn-primary" onClick={abrirCrearSede}>+ Nueva sede</button>
              )}
            </div>

            {loading ? (
              <SkeletonCards />
            ) : sedesVisibles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">&#127970;</div>
                <h3>No hay sedes</h3>
                <p>Creá la primera sede para comenzar a organizar las unidades de destino.</p>
                {puedeGestionar && <button className="btn btn-primary" onClick={abrirCrearSede}>+ Crear primera sede</button>}
              </div>
            ) : (
              <div className="sedes-grid">
                {sedesVisibles.map((sede) => (
                  <div key={sede.id} className={`sede-card ${sede.activa ? '' : 'sede-inactiva'}`}>
                    <div className="sede-card-header">
                      <span className="sede-badge-id">#{String(sede.id).padStart(2, '0')}</span>
                      <span className={`sede-badge-estado ${sede.activa ? 'badge-activa' : 'badge-inactiva'}`}>
                        {sede.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <div className="sede-card-body">
                      <h4 className="sede-nombre">{sede.nombre}</h4>
                      <span className="sede-count">{sede.unidades?.length ?? 0} unidad{(sede.unidades?.length ?? 0) !== 1 ? 'es' : ''}</span>
                    </div>
                      {puedeGestionar && (
                      <div className="sede-card-actions">
                        <button className="btn-icon" title="Editar" onClick={() => abrirEditarSede(sede)}>✎</button>
                        <button className="btn-icon" title={sede.activa ? 'Desactivar' : 'Activar'} onClick={() => toggleSede(sede)}>
                          {sede.activa ? '👁' : '🚫'}
                        </button>
                        <button className="btn-icon btn-icon-danger" title="Eliminar" onClick={() => abrirEliminarSede(sede)}>🗑</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'unidades' && (
          <div className="tab-content">
            <div className="filters-bar">
              <input
                className="search-input"
                type="text"
                placeholder="Buscar por nombre o sede..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <label className="checkbox-inline">
                <input type="checkbox" checked={verInactivas} onChange={(e) => setVerInactivas(e.target.checked)} />
                Ver desactivadas
              </label>
              <span className="result-count">{unidadesVisibles.length} unidad{unidadesVisibles.length !== 1 ? 'es' : ''}</span>
              {puedeGestionar && (
                <button className="btn btn-primary" onClick={abrirCrearUnidad}>+ Nueva unidad</button>
              )}
            </div>

            {loading ? (
              <SkeletonCards />
            ) : unidadesVisibles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">&#128230;</div>
                <h3>No hay unidades</h3>
                <p>{termino ? 'No hay unidades que coincidan con la búsqueda.' : 'Creá la primera unidad de destino para comenzar.'}</p>
                {!termino && puedeGestionar && <button className="btn btn-primary" onClick={abrirCrearUnidad}>+ Crear primera unidad</button>}
              </div>
            ) : (
              <div className="unidades-grupo-list">
                {unidadesPorSede.map(({ sede, unidades }) => {
                  const abierta = sedesAbiertas[sede.id] !== false
                  return (
                    <div key={sede.id} className={`unidades-grupo ${abierta ? 'abierto' : ''}`}>
                      <button className="unidades-grupo-header" onClick={() => toggleSedeAbierta(sede.id)}>
                        <span className={`grupo-flecha ${abierta ? 'flecha-abierta' : ''}`}>&#9654;</span>
                        <span className="grupo-nombre">{sede.nombre}</span>
                        <span className="grupo-count">{unidades.length}</span>
                        {!sede.activa && <span className="badge-inactiva" style={{ marginLeft: 8 }}>Inactiva</span>}
                      </button>
                      {abierta && (
                        <div className="unidades-grupo-body">
                          {unidades.length === 0 ? (
                            <p className="muted" style={{ padding: '12px 16px' }}>Sin unidades en esta sede.</p>
                          ) : (
                            <div className="unidades-lista">
                              {unidades.map((u) => (
                                <div key={u.id} className={`unidad-row ${u.activa ? '' : 'unidad-inactiva'}`}>
                                  <div className="unidad-row-info">
                                    <span className="unidad-row-id">#{String(u.id).padStart(2, '0')}</span>
                                    <span className="unidad-row-nombre">{u.nombre}</span>
                                    {!u.activa && <span className="badge-inactiva">Inactiva</span>}
                                  </div>
                                  {puedeGestionar && (
                                    <div className="unidad-row-actions">
                                      <button className="btn-icon-sm" title="Editar" onClick={() => abrirEditarUnidad(u)}>✎</button>
                                      <button className="btn-icon-sm" title={u.activa ? 'Desactivar' : 'Activar'} onClick={() => toggleUnidad(u)}>
                                        {u.activa ? '👁' : '🚫'}
                                      </button>
                                      <button className="btn-icon-sm btn-icon-danger" title="Eliminar" onClick={() => abrirEliminarUnidad(u)}>🗑</button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={showCrearSede} title="Nueva sede" onClose={() => setShowCrearSede(false)}>
        <form onSubmit={submitCrearSede} className="form-modal">
          <div className="field">
            <label>Nombre de la sede *</label>
            <input type="text" value={formSede} onChange={(e) => { setFormSede(e.target.value); setErrorSede('') }} autoFocus placeholder="Ej. Sede Central" />
            {errorSede && <span className="field-error">{errorSede}</span>}
          </div>
          <div className="form-actions-modal">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCrearSede(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={savingSede}>{savingSede ? 'Creando...' : 'Crear sede'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!sedeEdit} title="Editar sede" onClose={() => setSedeEdit(null)}>
        <form onSubmit={submitEditarSede} className="form-modal">
          <div className="field">
            <label>Nombre de la sede *</label>
            <input type="text" value={formSede} onChange={(e) => { setFormSede(e.target.value); setErrorSede('') }} autoFocus />
            {errorSede && <span className="field-error">{errorSede}</span>}
          </div>
          <div className="form-actions-modal">
            <button type="button" className="btn btn-secondary" onClick={() => setSedeEdit(null)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={savingSede}>{savingSede ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!sedeEliminar} title="Eliminar sede" onClose={() => setSedeEliminar(null)}>
        <div className="form-modal">
          <p className="modal-confirm-text">
            ¿Eliminar la sede <strong>{sedeEliminar?.nombre}</strong>?
          </p>
          {(sedeEliminar?.unidades?.length ?? 0) > 0 && (
            <p className="modal-confirm-warning">
              Esta sede tiene {sedeEliminar.unidades.length} unidad{(sedeEliminar.unidades.length) !== 1 ? 'es' : ''} asociada{(sedeEliminar.unidades.length) !== 1 ? 's' : ''}. No se puede eliminar.
            </p>
          )}
          <div className="form-actions-modal">
            <button type="button" className="btn btn-secondary" onClick={() => setSedeEliminar(null)}>Cancelar</button>
            {(sedeEliminar?.unidades?.length ?? 0) === 0 && (
              <button type="button" className="btn btn-danger" onClick={confirmEliminarSede} disabled={savingSede}>{savingSede ? 'Eliminando...' : 'Eliminar'}</button>
            )}
          </div>
        </div>
      </Modal>

      <Modal open={showCrearUnidad} title="Nueva unidad de destino" onClose={() => setShowCrearUnidad(false)}>
        <form onSubmit={submitCrearUnidad} className="form-modal">
          <div className="field">
            <label>Nombre *</label>
            <input type="text" value={formUnidad.nombre} onChange={(e) => { setFormUnidad((f) => ({ ...f, nombre: e.target.value })); setErrorUnidad('') }} autoFocus placeholder="Ej. Secretaría Académica" />
            {errorUnidad && <span className="field-error">{errorUnidad}</span>}
          </div>
          <div className="field">
            <label>Sede *</label>
            <select value={formUnidad.sede_id} onChange={(e) => { setFormUnidad((f) => ({ ...f, sede_id: e.target.value })); setErrorUnidad('') }}>
              <option value="" disabled>Seleccionar sede...</option>
              {sedes.filter((s) => s.activa).map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
          <div className="form-actions-modal">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCrearUnidad(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={savingUnidad}>{savingUnidad ? 'Creando...' : 'Crear unidad'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!unidadEdit} title="Editar unidad" onClose={() => setUnidadEdit(null)}>
        <form onSubmit={submitEditarUnidad} className="form-modal">
          <div className="field">
            <label>Nombre *</label>
            <input type="text" value={formUnidad.nombre} onChange={(e) => { setFormUnidad((f) => ({ ...f, nombre: e.target.value })); setErrorUnidad('') }} autoFocus />
            {errorUnidad && <span className="field-error">{errorUnidad}</span>}
          </div>
          <div className="field">
            <label>Sede *</label>
            <select value={formUnidad.sede_id} onChange={(e) => { setFormUnidad((f) => ({ ...f, sede_id: e.target.value })); setErrorUnidad('') }}>
              <option value="" disabled>Seleccionar sede...</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}{s.activa ? '' : ' (inactiva)'}</option>
              ))}
            </select>
          </div>
          <div className="form-actions-modal">
            <button type="button" className="btn btn-secondary" onClick={() => setUnidadEdit(null)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={savingUnidad}>{savingUnidad ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!unidadEliminar} title="Eliminar unidad" onClose={() => setUnidadEliminar(null)}>
        <div className="form-modal">
          <p className="modal-confirm-text">
            ¿Eliminar la unidad <strong>{unidadEliminar?.nombre}</strong>?
          </p>
          <p className="modal-confirm-warning">Esta acción no se puede deshacer.</p>
          <div className="form-actions-modal">
            <button type="button" className="btn btn-secondary" onClick={() => setUnidadEliminar(null)}>Cancelar</button>
            <button type="button" className="btn btn-danger" onClick={confirmEliminarUnidad} disabled={savingUnidad}>{savingUnidad ? 'Eliminando...' : 'Eliminar'}</button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

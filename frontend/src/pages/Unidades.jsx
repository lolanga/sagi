import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Modal from '../components/Modal'
import Layout from '../components/Layout'
import '../styles/inventario.css'

export default function Unidades() {
  const { user } = useAuth()
  const [sedes, setSedes] = useState([])
  const [unidades, setUnidades] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNueva, setShowNueva] = useState(false)
  const [editando, setEditando] = useState(null)
  const [nombre, setNombre] = useState('')
  const [sedeId, setSedeId] = useState('')
  const [error, setError] = useState('')

  const puedeGestionar = user?.rol?.slug === 'admin'

  const cargar = () => {
    api.get('/sedes').then((res) => setSedes(res.data.sedes || [])).catch(() => {})
    api
      .get('/unidades')
      .then((res) => setUnidades(res.data.unidades || []))
      .catch(() => setUnidades([]))
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [])

  const abrirNueva = () => {
    setNombre('')
    setSedeId(sedes[0]?.id ? String(sedes[0].id) : '')
    setError('')
    setShowNueva(true)
  }

  const abrirEditar = (u) => {
    setEditando(u)
    setNombre(u.nombre)
    setSedeId(String(u.sede_id))
    setError('')
    setShowNueva(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = { nombre, sede_id: Number(sedeId) }
      if (editando) {
        await api.put(`/unidades/${editando.id}`, payload)
      } else {
        await api.post('/unidades', payload)
      }
      setShowNueva(false)
      setEditando(null)
      cargar()
    } catch (err) {
      const msg = err.response?.data?.message
      const errors = err.response?.data?.errors
      const first = errors ? Object.values(errors)[0]?.[0] : null
      setError(first || msg || 'Error al guardar la unidad')
    }
  }

  const eliminar = async (u) => {
    if (!window.confirm(`¿Eliminar la unidad "${u.nombre}"?`)) return
    setError('')
    try {
      await api.delete(`/unidades/${u.id}`)
      cargar()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar la unidad')
    }
  }

  const sedeDe = (id) => sedes.find((s) => s.id === id)?.nombre ?? '-'

  return (
    <Layout
      title="Sedes y Unidades de destino"
      back="/"
      actions={
        puedeGestionar && (
          <button className="btn btn-primary" onClick={abrirNueva}>
            + Nueva unidad
          </button>
        )
      }
    >
      {loading ? (
        <p className="muted">Cargando...</p>
      ) : (
        <>
          <div className="filters-bar">
            <span className="result-count">{unidades.length} unidades de destino</span>
          </div>

          {sedes.map((sede) => {
            const deSede = unidades.filter((u) => u.sede_id === sede.id)
            if (deSede.length === 0) return null
            return (
              <div key={sede.id} className="stat-card" style={{ marginBottom: 16 }}>
                <h3>{sede.nombre} <span className="result-count">({deSede.length})</span></h3>
                <table className="table">
                  <tbody>
                    {deSede.map((u) => (
                      <tr key={u.id}>
                        <td>{u.nombre}</td>
                        <td className="muted">{sedeDe(u.sede_id)}</td>
                        {puedeGestionar && (
                          <td className="row-actions">
                            <button className="btn-link" onClick={() => abrirEditar(u)}>Editar</button>
                            <button className="btn-link btn-link-danger" onClick={() => eliminar(u)}>Eliminar</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </>
      )}

      <Modal
        open={showNueva}
        title={editando ? `Editar unidad — ${editando.nombre}` : 'Nueva unidad de destino'}
        onClose={() => {
          setShowNueva(false)
          setEditando(null)
        }}
      >
        <form onSubmit={guardar} className="item-form">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="u-nombre">Nombre *</label>
              <input
                id="u-nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Secretaría Académica"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="u-sede">Sede *</label>
              <select id="u-sede" value={sedeId} onChange={(e) => setSedeId(e.target.value)} required>
                <option value="">Seleccionar sede...</option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowNueva(false)
                setEditando(null)
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">{editando ? 'Guardar cambios' : 'Crear unidad'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
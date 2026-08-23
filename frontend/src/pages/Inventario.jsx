import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Aviso from '../components/Aviso'
import Modal from '../components/Modal'
import ItemForm from '../components/ItemForm'
import ItemDetalle from '../components/ItemDetalle'
import Layout from '../components/Layout'
import '../styles/inventario.css'

export default function Inventario() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [categorias, setCategorias] = useState([])
  const [unidades, setUnidades] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [showAlta, setShowAlta] = useState(false)
  const [editando, setEditando] = useState(null)
  const [viendo, setViendo] = useState(null)
  const [eliminando, setEliminando] = useState(null)
  const [error, setError] = useState('')

  const puedeEditar = ['admin', 'jefe', 'carga'].includes(user?.rol?.slug)

  const cargarItems = useCallback(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoriaId) params.set('categoria_id', categoriaId)
    params.set('page', page)
    setLoading(true)
    api
      .get(`/items?${params.toString()}`)
      .then((res) => {
        setItems(res.data.data || [])
        setTotal(res.data.total || 0)
        setLastPage(res.data.last_page || 1)
      })
      .catch(() => {
        setItems([])
        setTotal(0)
        setLastPage(1)
      })
      .finally(() => setLoading(false))
  }, [search, categoriaId, page])

  useEffect(() => {
    api.get('/categorias').then((res) => setCategorias(res.data.categorias || []))
    api.get('/unidades').then((res) => setUnidades((res.data.unidades || []).filter((u) => u.activa))).catch(() => {})
  }, [])

  useEffect(() => {
    const timeout = setTimeout(cargarItems, 300)
    return () => clearTimeout(timeout)
  }, [cargarItems])

  const confirmarEliminar = async () => {
    setError('')
    try {
      await api.delete(`/items/${eliminando.id}`)
      setEliminando(null)
      cargarItems()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el ítem')
    }
  }

  const formatValores = (item) => {
    const campos = categorias
      .find((c) => c.id === item.categoria_id)
      ?.campos_dinamicos?.filter((c) => c.activo)
      .filter((c) => (item.tipo_item_id ? c.tipo_item_id === item.tipo_item_id : !c.tipo_item_id))
    const detalles = campos
      ? campos
          .slice(0, 2)
          .map((c) => item.valores_dinamicos?.[String(c.id)] ?? '')
          .filter(Boolean)
      : []
    if (item.tipo_item?.nombre) detalles.unshift(item.tipo_item.nombre)
    return detalles.join(' · ') || '-'
  }

  return (
    <Layout
      title="Inventario"
      actions={
        <>
          {user?.rol?.slug === 'admin' && (
            <Link to="/categorias" className="btn btn-secondary">Categorías</Link>
          )}
          {puedeEditar && (
            <button className="btn btn-primary" onClick={() => setShowAlta(true)}>
              + Registrar alta
            </button>
          )}
        </>
      }
    >
      <div className="filters-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Ej. SAGI-000001 o escritorio"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias
            .filter((c) => !c.es_transitoria)
            .map((c) => (
              <option key={c.id} value={c.id}>{c.codigo} – {c.nombre}</option>
            ))}
        </select>
        <span className="result-count">{total} ítems</span>
      </div>

      {loading ? (
        <p className="muted">Cargando...</p>
      ) : items.length === 0 ? (
        <div className="placeholder">
          <h2>Sin resultados</h2>
          <p>No hay ítems que coincidan con la búsqueda. Registra un alta para comenzar.</p>
        </div>
      ) : (
        <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Categoría</th>
              <th>Detalle</th>
              <th>Estado</th>
              <th>Cant.</th>
              <th>Unidad</th>
              <th>Responsable</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td data-label="Código"><strong>{item.codigo_unico}</strong></td>
                <td data-label="Categoría">{item.categoria?.codigo}</td>
                <td data-label="Detalle">{formatValores(item)}</td>
                <td data-label="Estado">
                  <span className={`badge badge-estado-${item.estado_conservacion.replace(/\s+/g, '-')}`}>{item.estado_conservacion}</span>
                </td>
                <td data-label="Cant.">{item.cantidad}</td>
                <td data-label="Unidad">{item.unidad?.nombre ?? '-'}</td>
                <td data-label="Responsable">{item.responsable?.name}</td>
                <td data-label="Acciones">
                  <div className="row-actions">
                    <button className="btn-link btn-link-ver" onClick={() => setViendo(item)}>Ver</button>
                    {puedeEditar && (
                      <>
                        <button className="btn-link btn-link-editar" onClick={() => setEditando(item)}>Editar</button>
                        <button className="btn-link btn-link-danger" onClick={() => setEliminando(item)}>Eliminar</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {lastPage > 1 && (
        <div className="pagination">
          <button
            className={page === 1 ? 'btn btn-secondary disabled' : 'btn btn-secondary'}
            onClick={() => setPage((page) => page - 1)}
            disabled={page === 1}
            aria-label="Página anterior">
            Anterior
          </button>
          <span>Página {page} de {lastPage}</span>
          <button
            className={page === lastPage ? 'btn btn-secondary disabled' : 'btn btn-secondary'}
            onClick={() => setPage((page) => page + 1)}
            disabled={page === lastPage}
            aria-label="Página siguiente">
            Siguiente
          </button>
        </div>
      )}

      <Modal open={showAlta} title="Registrar alta de ítem" onClose={() => setShowAlta(false)} wide>
        <ItemForm
          categorias={categorias}
          unidades={unidades}
          onSaved={() => {
            setShowAlta(false)
            cargarItems()
          }}
          onCancel={() => setShowAlta(false)}
        />
      </Modal>

      <Modal open={Boolean(editando)} title={`Editar ítem ${editando?.codigo_unico ?? ''}`} onClose={() => setEditando(null)} wide>
        {editando && (
          <ItemForm
            key={editando.id}
            categorias={categorias}
            unidades={unidades}
            item={editando}
            onSaved={() => {
              setEditando(null)
              cargarItems()
            }}
            onCancel={() => setEditando(null)}
          />
        )}
      </Modal>

      <Modal open={Boolean(viendo)} title={`Detalle ${viendo?.codigo_unico ?? ''}`} onClose={() => setViendo(null)} wide>
        {viendo && (
          <ItemDetalle
            itemId={viendo.id}
            categorias={categorias}
            onClose={() => setViendo(null)}
          />
        )}
      </Modal>

      <Modal open={Boolean(eliminando)} title={`Eliminar ítem ${eliminando?.codigo_unico ?? ''}`} onClose={() => setEliminando(null)}>
        <p className="muted">
          ¿Seguro que deseas eliminar el ítem <strong>{eliminando?.codigo_unico}</strong>?
          Esta acción no se puede deshacer y eliminará sus movimientos asociados.
        </p>
        <Aviso mensaje={error} onCerrar={() => setError('')} />
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setEliminando(null)}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" onClick={confirmarEliminar}>
            Eliminar
          </button>
        </div>
      </Modal>
    </Layout>
  )
}
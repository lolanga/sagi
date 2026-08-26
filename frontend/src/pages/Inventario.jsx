import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import { extractApiError } from '../utils/helpers'
import Aviso from '../components/Aviso'
import Modal from '../components/Modal'
import ItemForm from '../components/ItemForm'
import ItemDetalle from '../components/ItemDetalle'
import Layout from '../components/Layout'
import Skeleton from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import '../styles/inventario.css'

export default function Inventario() {
  const { user } = useAuth()
  const toast = useToast()
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
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortKey, setSortKey] = useState('')
  const [sortDir, setSortDir] = useState('asc')

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
    api.get('/categorias').then((res) => setCategorias(res.data.categorias || [])).catch(() => {})
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
      toast.success('Ítem eliminado correctamente')
      cargarItems()
    } catch (err) {
      const msg = extractApiError(err, 'Error al eliminar el ítem')
      setError(msg)
      toast.error(msg)
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

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedItems = useMemo(() => {
    if (!sortKey) return items
    return [...items].sort((a, b) => {
      let aVal, bVal
      switch (sortKey) {
        case 'codigo_unico': aVal = a.codigo_unico; bVal = b.codigo_unico; break
        case 'categoria': aVal = a.categoria?.codigo || ''; bVal = b.categoria?.codigo || ''; break
        case 'estado': aVal = a.estado; bVal = b.estado; break
        case 'estado_conservacion': aVal = a.estado_conservacion || ''; bVal = b.estado_conservacion || ''; break
        case 'cantidad': aVal = a.cantidad; bVal = b.cantidad; break
        case 'unidad': aVal = a.unidad?.nombre || ''; bVal = b.unidad?.nombre || ''; break
        case 'responsable': aVal = a.responsable?.name || ''; bVal = b.responsable?.name || ''; break
        default: return 0
      }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [items, sortKey, sortDir])

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
        <div className="filters-search-row">
          <div className="search-wrapper">
            <input
              className="search-input"
              type="text"
              placeholder="Ej. SAGI-000001 o escritorio"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              aria-label="Buscar items"
            />
            {search && (
              <button
                className="search-clear"
                onClick={() => { setSearch(''); setPage(1) }}
                aria-label="Limpiar búsqueda"
                type="button"
              >
                ×
              </button>
            )}
          </div>
          <button
            className="btn btn-secondary filters-toggle"
            onClick={() => setFiltersOpen(!filtersOpen)}
            type="button"
            aria-label="Filtros"
            aria-expanded={filtersOpen}
          >
            {filtersOpen ? 'Ocultar filtros' : 'Filtros'}
          </button>
        </div>
        <div className={`filters-extra ${filtersOpen ? 'filters-extra--open' : ''}`}>
          <select
            className="filter-select"
            value={categoriaId}
            onChange={(e) => {
              setCategoriaId(e.target.value)
              setPage(1)
            }}
            aria-label="Filtrar por categoría"
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
      </div>

      {loading ? (
        <>
          <Skeleton type="table" rows={6} cols={9} />
          <Skeleton type="card" rows={4} />
        </>
      ) : items.length === 0 ? (
        <EmptyState
          icon={search ? 'search' : 'inventory'}
          title={search ? 'Sin resultados' : 'Inventario vacío'}
          description={search
            ? 'No hay ítems que coincidan con la búsqueda. Prueba con otros términos.'
            : 'No hay ítems registrados. Comienza registrando un alta.'
          }
          action={!search && puedeEditar ? (
            <button className="btn btn-primary" onClick={() => setShowAlta(true)}>
              + Registrar primer ítem
            </button>
          ) : null}
        />
      ) : (
        <>
          <div className="table-wrap desktop-only">
            <table className="table" aria-label="Inventario de ítems">
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort('codigo_unico')}
                    className="sortable-th"
                    role="button"
                    tabIndex={0}
                    aria-sort={sortKey === 'codigo_unico' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSort('codigo_unico') }}
                  >
                    Código {sortKey === 'codigo_unico' && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    onClick={() => handleSort('categoria')}
                    className="sortable-th"
                    role="button"
                    tabIndex={0}
                    aria-sort={sortKey === 'categoria' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSort('categoria') }}
                  >
                    Categoría {sortKey === 'categoria' && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                  <th>Detalle</th>
                  <th onClick={() => handleSort('estado')} className="sortable-th">
                    Estado {sortKey === 'estado' && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('estado_conservacion')} className="sortable-th">
                    Conservación {sortKey === 'estado_conservacion' && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('cantidad')} className="sortable-th">
                    Cant. {sortKey === 'cantidad' && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('unidad')} className="sortable-th">
                    Unidad {sortKey === 'unidad' && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('responsable')} className="sortable-th">
                    Responsable {sortKey === 'responsable' && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item) => (
                  <tr key={item.id} className={item.estado === 'baja' ? 'fila-baja' : ''}>
                    <td data-label="Código"><strong>{item.codigo_unico}</strong></td>
                    <td data-label="Categoría">{item.categoria?.codigo ?? '-'}</td>
                    <td data-label="Detalle">{formatValores(item)}</td>
                    <td data-label="Estado">
                      <span className={`badge badge-estado-${item.estado}`}>{item.estado}</span>
                    </td>
                    <td data-label="Conservación">
                      <span className={`badge badge-estado-${(item.estado_conservacion || '').replace(/\s+/g, '-')}`}>{item.estado_conservacion ?? '-'}</span>
                    </td>
                    <td data-label="Cant.">{item.cantidad}</td>
                    <td data-label="Unidad">{item.unidad?.nombre ?? '-'}</td>
                    <td data-label="Responsable">{item.responsable?.name ?? '-'}</td>
                    <td data-label="Acciones">
                      <div className="row-actions">
                        <button className="btn-link btn-link-ver" onClick={() => setViendo(item)} aria-label={`Ver ${item.codigo_unico}`}>Ver</button>
                        {puedeEditar && item.estado !== 'baja' && (
                          <>
                            <button className="btn-link btn-link-editar" onClick={() => setEditando(item)} aria-label={`Editar ${item.codigo_unico}`}>Editar</button>
                            <button className="btn-link btn-link-danger" onClick={() => setEliminando(item)} aria-label={`Eliminar ${item.codigo_unico}`}>Eliminar</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cards-grid mobile-only">
            {sortedItems.map((item) => (
              <div key={item.id} className={`item-card ${item.estado === 'baja' ? 'item-card-baja' : ''}`}>
                <div className="item-card-header">
                  <span className="item-card-codigo">{item.codigo_unico}</span>
                  <span className={`badge badge-estado-${item.estado}`}>{item.estado}</span>
                </div>
                <div className="item-card-body">
                  <p className="item-card-detalle">{formatValores(item)}</p>
                  <div className="item-card-meta">
                    <span>{item.categoria?.codigo ?? '-'}</span>
                    <span>{item.unidad?.nombre ?? '-'}</span>
                  </div>
                  <div className="item-card-meta">
                    <span className={`badge badge-estado-${(item.estado_conservacion || '').replace(/\s+/g, '-')}`}>{item.estado_conservacion ?? '-'}</span>
                    <span>Cant: {item.cantidad}</span>
                  </div>
                </div>
                <div className="item-card-footer">
                  <button className="btn btn-sm btn-secondary" onClick={() => setViendo(item)}>Ver</button>
                  {puedeEditar && item.estado !== 'baja' && (
                    <>
                      <button className="btn btn-sm btn-secondary" onClick={() => setEditando(item)}>Editar</button>
                      <button className="btn btn-sm btn-danger" onClick={() => setEliminando(item)}>Eliminar</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Pagination page={page} lastPage={lastPage} onPageChange={setPage} />

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
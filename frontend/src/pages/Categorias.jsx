import { useEffect, useState } from 'react'
import api from '../services/api'
import Aviso from '../components/Aviso'
import Layout from '../components/Layout'
import ElementoEditor from '../components/ElementoEditor'
import NuevoElementoWizard from '../components/NuevoElementoWizard'
import '../styles/categorias.css'

const norm = (s) => String(s ?? '').trim().toLowerCase()

export default function Categorias() {
  const [categorias, setCategorias] = useState([])
  const [selected, setSelected] = useState(null)
  const [editandoCampo, setEditandoCampo] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState('lista')
  const [mostrarWizard, setMostrarWizard] = useState(false)

  const cargar = () => {
    api.get('/categorias').then((res) => {
      const cats = res.data.categorias || []
      setCategorias(cats)
      if (selected) {
        const actualizada = cats.find((c) => c.id === selected.id)
        setSelected(actualizada || null)
      }
    }).finally(() => setLoading(false))
  }

  useEffect(cargar, [])

  const ordenar = (lista) => [...(lista || [])].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))

  const camposGenerales = selected
    ? (selected.campos_dinamicos || []).filter((c) => !c.tipo_item_id && c.activo)
    : []

  const contarCamposElemento = (tipo) => {
    return (selected?.campos_dinamicos || []).filter(
      (c) => c.tipo_item_id === tipo.id && c.activo
    ).length
  }

  const eliminarElemento = async (tipo) => {
    setError('')
    if (!window.confirm(`¿Eliminar el elemento "${tipo.nombre}"?`)) return
    try {
      await api.delete(`/tipos-item/${tipo.id}`)
      if (editandoCampo?.id === tipo.id) setEditandoCampo(null)
      cargar()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar')
    }
  }

  const handleGuardado = () => {
    setEditandoCampo(null)
    setMostrarWizard(false)
    cargar()
    setVista('lista')
  }

  if (loading) {
    return (
      <Layout title="Administración de categorías" back="/inventario">
        <p className="muted">Cargando...</p>
      </Layout>
    )
  }

  return (
    <Layout title="Administración de categorías" back="/inventario">
      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <div className="categorias-layout">
        <div className={`categorias-sidebar ${vista === 'detalle' ? 'categorias-sidebar--hidden-mobile' : ''}`}>
          <h3 className="categorias-sidebar-title">Categorías</h3>
          {categorias.map((c) => (
            <button
              key={c.id}
              className={`categoria-card ${selected?.id === c.id ? 'active' : ''}`}
              onClick={() => { setSelected(c); setVista('detalle'); setEditandoCampo(null); setMostrarWizard(false) }}
            >
              <div className="categoria-card-codigo">{c.codigo}</div>
              <div className="categoria-card-info">
                <span className="categoria-card-nombre">{c.nombre}</span>
                <span className="categoria-card-meta">
                  {(c.tipos_items || []).length} elemento{(c.tipos_items || []).length !== 1 ? 's' : ''}
                  {c.es_transitoria && ' · transitoria'}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className={`categorias-main ${vista === 'lista' ? 'categorias-main--hidden-mobile' : ''}`}>
          {!selected ? (
            <div className="categorias-empty">
              <p>Selecciona una categoría para administrar sus elementos y campos.</p>
            </div>
          ) : editandoCampo ? (
            <ElementoEditor
              elemento={editandoCampo}
              campos={(selected.campos_dinamicos || []).filter((c) =>
                editandoCampo === 'general'
                  ? !c.tipo_item_id
                  : c.tipo_item_id === editandoCampo.id
              ).filter((c) => c.activo || c._eliminado)}
              esGeneral={editandoCampo === 'general'}
              onGuardado={handleGuardado}
              onVolver={() => setEditandoCampo(null)}
            />
          ) : mostrarWizard ? (
            <NuevoElementoWizard
              categoria={selected}
              onGuardado={handleGuardado}
              onCancel={() => setMostrarWizard(false)}
            />
          ) : (
            <>
              <div className="main-header main-header--with-btn">
                <h3>{selected.codigo} — {selected.nombre}</h3>
                <button className="btn-add-elemento" onClick={() => setMostrarWizard(true)}>
                  + Nuevo elemento
                </button>
              </div>

              <div className="elemento-lista">
                <button
                  className="elemento-item"
                  onClick={() => setEditandoCampo('general')}
                >
                  <span className="elemento-item-icono">📋</span>
                  <span className="elemento-item-nombre">Campos generales</span>
                  <span className="elemento-item-meta">{camposGenerales.length} campo{camposGenerales.length !== 1 ? 's' : ''}</span>
                  <span className="elemento-item-arrow">→</span>
                </button>

                {ordenar(selected.tipos_items).map((tipo) => (
                  <div key={tipo.id} className="elemento-item-row">
                    <button
                      className="elemento-item"
                      onClick={() => setEditandoCampo(tipo)}
                    >
                      <span className="elemento-item-icono">📦</span>
                      <span className="elemento-item-nombre">{tipo.nombre}</span>
                      <span className="elemento-item-meta">{contarCamposElemento(tipo)} campo{contarCamposElemento(tipo) !== 1 ? 's' : ''}</span>
                      <span className="elemento-item-arrow">→</span>
                    </button>
                    <button
                      className="btn-icon btn-danger elemento-item-delete"
                      onClick={(e) => { e.stopPropagation(); eliminarElemento(tipo) }}
                      title="Eliminar elemento"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import api from '../services/api'
import Aviso from '../components/Aviso'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import '../styles/inventario.css'

const entidades = ['auth', 'item', 'categoria', 'tipo_item', 'campo_dinamico', 'movimiento']
const acciones = ['login', 'crear', 'editar', 'eliminar', 'mover', 'solicitar', 'aprobar', 'rechazar']

const Etiquetas = {
  categoria: 'Categoría', categoria_id: 'Categoría', categoria_original: 'Categoría',
  tipo_item: 'Elemento', tipo_item_id: 'Elemento',
  estado_conservacion: 'Estado conservación', cantidad: 'Cantidad',
  unidad: 'Unidad', unidad_id: 'Unidad', unidad_origen: 'Origen', unidad_destino: 'Destino',
  sede: 'Sede', sede_id: 'Sede',
  codigo: 'Código', nombre: 'Nombre', tipo: 'Tipo', opciones: 'Opciones',
  placeholder: 'Placeholder', requerido: 'Requerido', activo: 'Activo',
  activa: 'Activa', activa_anterior: 'Activa', activa_nueva: 'Activa',
  motivo: 'Motivo', motivo_rechazo: 'Motivo rechazo', motivo_baja: 'Motivo baja',
  prioridad: 'Prioridad', mensaje: 'Mensaje', campo: 'Campo',
  responsable: 'Responsable', estado: 'Estado', estado_item: 'Estado ítem',
  valores_dinamicos: 'Campos dinámicos', direccion: 'Dirección', item: 'Ítem',
  es_transitoria: 'Transitoria', dni: 'DNI',
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s }

function formatearDetalle(detalle, accion, entidad) {
  if (!detalle) return '-'

  if (detalle.antes && detalle.despues && typeof detalle.antes === 'object' && typeof detalle.despues === 'object') {
    const cambios = []
    const expandDinamicos = (obj) => {
      if (!obj || typeof obj !== 'object') return obj
      const out = {}
      for (const [k, v] of Object.entries(obj)) {
        if (k === 'valores_dinamicos' && typeof v === 'object' && v !== null) {
          for (const [campoId, valor] of Object.entries(v)) {
            out[`dyn_${campoId}`] = valor
          }
        } else {
          out[k] = v
        }
      }
      return out
    }
    const antes = expandDinamicos(detalle.antes)
    const despues = expandDinamicos(detalle.despues)
    const campos = new Set([...Object.keys(antes), ...Object.keys(despues)])
    for (const k of campos) {
      const a = antes[k]
      const d = despues[k]
      const av = a ?? '(vacío)'
      const dv = d ?? '(vacío)'
      if (String(av) !== String(dv)) {
        const label = Etiquetas[k] || (k.startsWith('dyn_') ? `Campo #${k.slice(4)}` : k)
        cambios.push(`${label}: ${av} → ${dv}`)
      }
    }
    const prefijo = detalle.codigo ? `${detalle.codigo} — ` : ''
    return cambios.length > 0 ? prefijo + cambios.join(' · ') : 'Sin cambios detectados'
  }

  const e = entidad
  const a = accion

  if (e === 'item' && a === 'crear') return `Ítem ${detalle.codigo} creado en categoría ${detalle.categoria}`
  if (e === 'item' && a === 'reactivar') return `Ítem ${detalle.codigo} reactivado a categoría ${detalle.categoria}`
  if (e === 'item' && a === 'eliminar') return `Ítem ${detalle.codigo} eliminado (${detalle.categoria}, ${detalle.unidad})`

  if (e === 'movimiento' && a === 'solicitar') {
    if (detalle.tipo === 'traslado') return `Traslado de ${detalle.item}: ${detalle.unidad_origen} → ${detalle.unidad_destino}`
    if (detalle.tipo === 'baja') return `Baja de ${detalle.item} desde ${detalle.unidad_origen}`
  }
  if (e === 'movimiento' && a === 'aprobar') return `${capitalize(detalle.tipo)} de ${detalle.item} aprobado`
  if (e === 'movimiento' && a === 'rechazar') return `${capitalize(detalle.tipo)} de ${detalle.item} rechazado`

  if (e === 'unidad' && a === 'crear') return `Unidad "${detalle.nombre}" creada en ${detalle.sede}`
  if (e === 'unidad' && a === 'eliminar') return `Unidad "${detalle.nombre}" eliminada`
  if (e === 'unidad' && (a === 'editar' || a === 'activar' || a === 'desactivar')) return `Unidad "${detalle.nombre || '?'}"` 

  if (e === 'sede' && a === 'crear') return `Sede "${detalle.nombre}" creada`
  if (e === 'sede' && a === 'eliminar') return `Sede "${detalle.nombre}" eliminada`

  if (e === 'auth' && a === 'login') return `Sesión iniciada (DNI ${detalle.dni})`
  if (e === 'user' && a === 'editar') return 'Contraseña actualizada'

  if (e === 'categoria' && a === 'crear') return `Categoría ${detalle.codigo} (${detalle.nombre}) creada`
  if (e === 'categoria' && a === 'editar') return `Categoría ${detalle.codigo} editada`
  if (e === 'categoria' && a === 'eliminar') return `Categoría ${detalle.codigo} (${detalle.nombre}) eliminada`

  if (e === 'tipo_item' && a === 'crear') return `Elemento "${detalle.nombre}" creado en ${detalle.categoria}`
  if (e === 'tipo_item' && a === 'eliminar') return `Elemento "${detalle.nombre}" eliminado de ${detalle.categoria}`
  if (e === 'tipo_item' && a === 'mover') return `Elemento "${detalle.nombre}" movido ${detalle.direccion === 'up' ? '↑' : '↓'}`

  if (e === 'campo_dinamico' && a === 'crear') return `Campo "${detalle.nombre}" (${detalle.tipo}) creado en ${detalle.categoria}`
  if (e === 'campo_dinamico' && a === 'eliminar') return `Campo "${detalle.nombre}" eliminado de ${detalle.categoria}`
  if (e === 'campo_dinamico' && a === 'mover') return `Campo "${detalle.nombre}" movido ${detalle.direccion === 'up' ? '↑' : '↓'}`

  if (e === 'alerta' && a === 'crear') return `Alerta creada — ${detalle.prioridad}`
  if (e === 'alerta' && a === 'cerrar') return 'Alerta cerrada'

  const partes = Object.entries(detalle)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${Etiquetas[k] || k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
  return partes.join(' · ') || '-'
}

export default function Auditoria() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [entidad, setEntidad] = useState('')
  const [accion, setAccion] = useState('')
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [pageSize, setPageSize] = useState(() => {
    try { return Number(localStorage.getItem('sagi_audit_page_size')) || 50 } catch { return 50 }
  })

  const cargar = () => {
    const params = new URLSearchParams()
    if (entidad) params.set('entidad', entidad)
    if (accion) params.set('accion', accion)
    params.set('page', page)
    params.set('per_page', pageSize)
    setLoading(true)
    api
      .get(`/auditoria?${params.toString()}`)
      .then((res) => {
        setLogs(res.data.data || [])
        setTotal(res.data.total || 0)
        setLastPage(res.data.last_page || 1)
      })
      .catch(() => {
        setLogs([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1) }, [entidad, accion, pageSize])
  useEffect(cargar, [entidad, accion, page, pageSize])

  const traerTodo = async () => {
    const base = new URLSearchParams()
    if (entidad) base.set('entidad', entidad)
    if (accion) base.set('accion', accion)

    const todos = []
    let page = 1
    let ultima = 1
    do {
      const p = new URLSearchParams(base)
      p.set('page', page)
      const res = await api.get(`/auditoria?${p.toString()}`)
      todos.push(...(res.data.data || []))
      ultima = res.data.last_page || 1
      page += 1
    } while (page <= ultima)
    return todos
  }

  const exportarJson = async () => {
    setError('')
    try {
      const registros = await traerTodo()
      const blob = new Blob([JSON.stringify(registros, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al exportar la auditoría')
    }
  }

  const exportarExcel = async () => {
    setError('')
    try {
      const registros = await traerTodo()
      const filas = registros.map((r) => [
        new Date(r.created_at).toLocaleString(),
        r.user?.name ?? '',
        r.accion,
        r.entidad,
        formatearDetalle(r.detalle, r.accion, r.entidad),
      ])
      const hoja = XLSX.utils.aoa_to_sheet([
        ['Fecha', 'Usuario', 'Acción', 'Entidad', 'Detalle'],
        ...filas,
      ])
      hoja['!cols'] = [{ wch: 20 }, { wch: 22 }, { wch: 12 }, { wch: 16 }, { wch: 60 }]
      hoja['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: filas.length, c: 4 } }) }
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, hoja, 'Auditoría')
      XLSX.writeFile(wb, `auditoria-${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al exportar la auditoría')
    }
  }

  return (
    <Layout
      title="Auditoría"
      back="/"
      actions={
        <>
          <button className="btn btn-primary" onClick={exportarExcel}>Excel</button>
          <button className="btn btn-secondary" onClick={exportarJson}>JSON</button>
        </>
      }
    >
      <Aviso mensaje={error} onCerrar={() => setError('')} />
      <div className="filters-bar">
        <select className="filter-select" value={entidad} onChange={(e) => setEntidad(e.target.value)}>
          <option value="">Todas las entidades</option>
          {entidades.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select className="filter-select" value={accion} onChange={(e) => setAccion(e.target.value)}>
          <option value="">Todas las acciones</option>
          {acciones.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <span className="result-count">{total} registros</span>
      </div>

      {loading ? (
        <p className="muted">Cargando...</p>
      ) : logs.length === 0 ? (
        <div className="placeholder">
          <h2>Sin registros</h2>
          <p>No hay movimientos de auditoría que coincidan con los filtros.</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td data-label="Fecha">{new Date(log.created_at).toLocaleString()}</td>
                  <td data-label="Usuario">{log.user?.name}</td>
                  <td data-label="Acción"><span className={`badge badge-accion badge-${log.accion}`}>{log.accion}</span></td>
                  <td data-label="Entidad">{log.entidad}</td>
                  <td data-label="Detalle" className="audit-detalle">{formatearDetalle(log.detalle, log.accion, log.entidad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <Pagination
            page={page}
            lastPage={lastPage}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              localStorage.setItem('sagi_audit_page_size', size)
              setPageSize(size)
            }}
          />
        </>
      )}
    </Layout>
  )
}
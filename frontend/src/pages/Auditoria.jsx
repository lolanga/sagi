import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import api from '../services/api'
import Aviso from '../components/Aviso'
import Layout from '../components/Layout'
import '../styles/inventario.css'

const entidades = ['auth', 'item', 'categoria', 'tipo_item', 'campo_dinamico', 'movimiento']
const acciones = ['login', 'crear', 'editar', 'eliminar', 'mover', 'solicitar', 'aprobar', 'rechazar']

function formatearDetalle(detalle) {
  if (!detalle) return '-'
  const partes = Object.entries(detalle)
    .filter(([k, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
  return partes.join(' · ')
}

export default function Auditoria() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [entidad, setEntidad] = useState('')
  const [accion, setAccion] = useState('')
  const [error, setError] = useState('')

  const cargar = () => {
    const params = new URLSearchParams()
    if (entidad) params.set('entidad', entidad)
    if (accion) params.set('accion', accion)
    setLoading(true)
    api
      .get(`/auditoria?${params.toString()}`)
      .then((res) => {
        setLogs(res.data.data || [])
        setTotal(res.data.total || 0)
      })
      .catch(() => {
        setLogs([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [entidad, accion])

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
        formatearDetalle(r.detalle),
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
                <td data-label="Detalle" className="audit-detalle">{formatearDetalle(log.detalle)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </Layout>
  )
}
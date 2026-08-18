import { useEffect, useState } from 'react'
import api from '../services/api'
import Layout from '../components/Layout'
import '../styles/dashboard.css'

function Tabla({ titulo, encabezados, filas }) {
  return (
    <div className="stat-card reporte-card">
      <h3>{titulo}</h3>
      <table className="table">
        <thead>
          <tr>
            {encabezados.map((h, i) => <th key={i}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i}>
              {f.map((c, j) => <td key={j}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Reportes() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/reportes/resumen')
      .then((res) => setData(res.data))
      .catch(() => setError('No se pudieron cargar los reportes'))
      .finally(() => setLoading(false))
  }, [])

  const exportarItems = async () => {
    setError('')
    try {
      const res = await api.get('/reportes/items')
      const items = res.data || []
      const rows = [
        ['Codigo', 'Categoria', 'Elemento', 'Estado', 'Conservacion', 'Cantidad', 'Area', 'Responsable', 'Fecha alta'],
        ...items.map((i) => [
          i.codigo_unico,
          i.categoria?.codigo ?? '',
          i.tipo_item?.nombre ?? '',
          i.estado,
          i.estado_conservacion,
          i.cantidad,
          i.area?.nombre ?? '',
          i.responsable?.name ?? '',
          i.fecha_alta ?? '',
        ]),
      ]
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventario-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al exportar')
    }
  }

  return (
    <Layout
      title="Reportes"
      back="/"
      actions={<button className="btn btn-secondary" onClick={exportarItems}>Exportar inventario (CSV)</button>}
    >
      {loading ? (
        <p className="muted">Cargando...</p>
      ) : error && !data ? (
        <div className="placeholder">
          <h2>{error}</h2>
        </div>
      ) : data ? (
        <>
          {error && <p className="form-error">{error}</p>}
          <div className="reportes-grid">
            <Tabla
              titulo="Ítems activos por categoría"
              encabezados={['Código', 'Categoría', 'Ítems']}
              filas={data.por_categoria.map((c) => [c.codigo, c.nombre, c.total])}
            />
            <Tabla
              titulo="Ítems por estado de conservación"
              encabezados={['Estado', 'Ítems']}
              filas={data.por_estado_conservacion.map((e) => [e.estado_conservacion, e.total])}
            />
            <Tabla
              titulo="Ítems activos por área"
              encabezados={['Área', 'Ítems']}
              filas={data.por_area.map((a) => [a.nombre, a.total])}
            />
            <Tabla
              titulo="Ítems activos por elemento"
              encabezados={['Elemento', 'Ítems']}
              filas={data.por_elemento.map((e) => [e.nombre, e.total])}
            />
            <Tabla
              titulo="Movimientos por mes (últimos 6)"
              encabezados={['Mes', 'Tipo', 'Cantidad']}
              filas={data.movimientos_mes.map((m) => [m.mes, m.tipo, m.total])}
            />
          </div>
        </>
      ) : null}
    </Layout>
  )
}
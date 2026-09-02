import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import api from '../services/api'
import { extractApiError } from '../utils/helpers'
import { exportarFormatoOficial } from '../utils/exportarFormatoOficial'
import Aviso from '../components/Aviso'
import Layout from '../components/Layout'
import '../styles/dashboard.css'

function Tabla({ titulo, encabezados, filas }) {
  return (
    <div className="stat-card reporte-card">
      <h3>{titulo}</h3>
      <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {encabezados.map((h, i) => <th key={i}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i}>
              {f.map((c, j) => <td key={j} data-label={encabezados[j]}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}

export default function Reportes() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exportando, setExportando] = useState(false)

  useEffect(() => {
    api
      .get('/reportes/resumen')
      .then((res) => setData(res.data))
      .catch(() => setError('No se pudieron cargar los reportes'))
      .finally(() => setLoading(false))
  }, [])

  const exportarExcel = async () => {
    setError('')
    try {
      const [resItems, resCats] = await Promise.all([
        api.get('/reportes/items'),
        api.get('/categorias'),
      ])
      const items = resItems.data || []
      const categorias = resCats.data.categorias || []

      const nombreCampo = {}
      categorias.forEach((c) => {
        ;(c.campos_dinamicos || []).forEach((cp) => {
          nombreCampo[cp.id] = cp.nombre
        })
      })

      const porCategoria = new Map()
      items.forEach((i) => {
        const clave = i.categoria?.codigo ?? 'OTROS'
        if (!porCategoria.has(clave)) porCategoria.set(clave, { nombre: i.categoria?.nombre ?? 'Sin categoría', items: [] })
        porCategoria.get(clave).items.push(i)
      })

      const wb = XLSX.utils.book_new()
      const claves = [...porCategoria.keys()].sort()

      claves.forEach((clave) => {
        const grupo = porCategoria.get(clave)
        const usados = []
        grupo.items.forEach((i) => {
          Object.keys(i.valores_dinamicos || {}).forEach((id) => {
            if (!usados.includes(id)) usados.push(id)
          })
        })
        usados.sort((a, b) => Number(a) - Number(b))

        const encabezados = [
          'Código único', 'Elemento', 'Estado', 'Conservación', 'Cantidad',
          'Sede', 'Unidad', 'Responsable', 'Fecha de alta',
          ...usados.map((id) => nombreCampo[id] ?? `Campo ${id}`),
        ]

        const filas = grupo.items.map((i) => [
          i.codigo_unico,
          i.tipo_item?.nombre ?? '',
          i.estado,
          i.estado_conservacion,
          i.cantidad,
          i.unidad?.sede?.nombre ?? '',
          i.unidad?.nombre ?? '',
          i.responsable?.name ?? '',
          i.fecha_alta ? String(i.fecha_alta).slice(0, 10) : 'Desconocida',
          ...usados.map((id) => i.valores_dinamicos?.[id] ?? ''),
        ])

        const hoja = XLSX.utils.aoa_to_sheet([encabezados, ...filas])
        hoja['!cols'] = encabezados.map((h, colIdx) => ({
          wch: Math.min(30, Math.max(10, String(h).length + 2, ...filas.map((f) => String(f[colIdx] ?? '').length + 2))),
        }))
        hoja['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: filas.length, c: encabezados.length - 1 } }) }

        let nombreHoja = `${clave} ${grupo.nombre}`
        nombreHoja = nombreHoja.replace(/[\\/?*[\]:]/g, '-').slice(0, 31)
        XLSX.utils.book_append_sheet(wb, hoja, nombreHoja)
      })

      XLSX.writeFile(wb, `inventario-${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (err) {
      setError(extractApiError(err, 'Error al exportar'))
    }
  }

  const exportarCsv = async () => {
    setError('')
    try {
      const res = await api.get('/reportes/items')
      const items = res.data || []
      const rows = [
        ['Codigo', 'Categoria', 'Elemento', 'Estado', 'Conservacion', 'Cantidad', 'Sede', 'Unidad', 'Responsable', 'Fecha alta'],
        ...items.map((i) => [
          i.codigo_unico,
          i.categoria?.codigo ?? '',
          i.tipo_item?.nombre ?? '',
          i.estado,
          i.estado_conservacion,
          i.cantidad,
          i.unidad?.sede?.nombre ?? '',
          i.unidad?.nombre ?? '',
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
      setError(extractApiError(err, 'Error al exportar'))
    }
  }

  const exportarPdf = async () => {
    setError('')
    try {
      const res = await api.get('/reportes/items')
      const items = res.data || []

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      doc.setFontSize(18)
      doc.text('SAGI - Reporte de Inventario', 14, 15)
      doc.setFontSize(10)
      doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 22)
      doc.text(`Total: ${items.length} items`, 14, 28)

      const columnas = [
        { header: 'Codigo', dataKey: 'codigo' },
        { header: 'Elemento', dataKey: 'elemento' },
        { header: 'Estado', dataKey: 'estado' },
        { header: 'Conservacion', dataKey: 'conservacion' },
        { header: 'Cant.', dataKey: 'cantidad' },
        { header: 'Sede', dataKey: 'sede' },
        { header: 'Unidad', dataKey: 'unidad' },
        { header: 'Responsable', dataKey: 'responsable' },
      ]

      const filas = items.map((i) => ({
        codigo: i.codigo_unico,
        elemento: i.tipo_item?.nombre ?? '',
        estado: i.estado,
        conservacion: i.estado_conservacion,
        cantidad: String(i.cantidad),
        sede: i.unidad?.sede?.nombre ?? '',
        unidad: i.unidad?.nombre ?? '',
        responsable: i.responsable?.name ?? '',
      }))

      autoTable(doc, {
        startY: 35,
        columns: columnas,
        body: filas,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [74, 143, 212] },
        alternateRowStyles: { fillColor: [240, 245, 250] },
        margin: { top: 35 },
      })

      doc.save(`inventario-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al exportar PDF')
    }
  }

  const handleExportarFormatoOficial = async () => {
    setError('')
    setExportando(true)
    try {
      await exportarFormatoOficial()
    } catch (err) {
      setError(extractApiError(err, 'Error al exportar formato oficial'))
    } finally {
      setExportando(false)
    }
  }

  return (
    <Layout
      title="Reportes"
      back="/"
      actions={
        <>
          <button className="btn btn-primary" onClick={handleExportarFormatoOficial} disabled={exportando}>
            {exportando ? 'Exportando...' : 'Formato Oficial'}
          </button>
          <button className="btn btn-secondary" onClick={exportarExcel}>Excel</button>
          <button className="btn btn-secondary" onClick={exportarCsv}>CSV</button>
          <button className="btn btn-secondary" onClick={exportarPdf}>PDF</button>
        </>
      }
    >
      {loading ? (
        <p className="muted">Cargando...</p>
      ) : error && !data ? (
        <div className="placeholder">
          <h2>{error}</h2>
        </div>
      ) : data ? (
        <>
          <Aviso mensaje={error} onCerrar={() => setError('')} />
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
              titulo="Ítems activos por sede"
              encabezados={['Sede', 'Ítems']}
              filas={data.por_sede.map((s) => [s.nombre, s.total])}
            />
            <Tabla
              titulo="Ítems activos por unidad de destino"
              encabezados={['Unidad', 'Sede', 'Ítems']}
              filas={data.por_unidad.map((u) => [u.nombre, u.sede_nombre ?? '', u.total])}
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
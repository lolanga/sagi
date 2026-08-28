import * as XLSX from 'xlsx'
import api from '../services/api'

const NOMBRE_ARCHIVO = `inventario-oficial-${new Date().toISOString().slice(0, 10)}.xlsx`

const DEPENDENCIA = 'DEPENDENCIA: División Secretaría General, sede Rosario.'
const DIRECCION = 'DIRECCION / UNIDAD REGIONAL: I.Se.P.'

function extraerFecha(fecha) {
  if (!fecha) return ''
  try {
    const d = new Date(fecha)
    if (isNaN(d.getTime())) return String(fecha).slice(0, 10)
    return d.toLocaleDateString('es-AR')
  } catch {
    return String(fecha).slice(0, 10)
  }
}

function resolverValoresDinamicos(item, nombreCampoMap) {
  const vd = item.valores_dinamicos || {}
  const resultado = {}
  for (const [id, valor] of Object.entries(vd)) {
    const nombre = nombreCampoMap[Number(id)] || nombreCampoMap[id] || `Campo ${id}`
    resultado[nombre] = valor ?? ''
  }
  return resultado
}

function construirDescripcion(item, valores) {
  const partes = [
    valores.Marca,
    valores.Modelo,
    valores.Color,
    valores['Número de serie'],
    valores.Procesador,
    valores.RAM,
    valores['Tamaño (pulgadas)'],
    valores.Capacidad,
    valores.Tipo,
    valores.Conectividad,
    valores.Puertos,
    valores['Tipo de protección'],
    valores.Talla,
    valores.Calibre,
  ].filter(Boolean)
  return partes.join(', ') || item.tipoItem?.nombre || ''
}

const HOJAS = {
  A1: {
    titulo: 'A1 - AMOBLAMIENTO Y UTILES',
    columnas: [
      { header: 'CANT. NUM', width: 10 },
      { header: 'AMOBLAMIENTO Y UTILES', width: 25 },
      { header: 'MATERIAL DETALLE', width: 20 },
      { header: 'MEDIDA EN CM Alto-Ancho- Largo', width: 28 },
      { header: 'CARACTERISTICAS (puertas, cajones, vidrio, estantes, ruedas, forma, tapizado, agregados, etc)', width: 45 },
      { header: 'ESPECIFICAR COLORES', width: 18 },
      { header: 'ESTADO (Malo-Regular-Bueno-Muy Bueno)', width: 25 },
      { header: 'PROCEDENCIA (Adquirido- Donado-Etc)', width: 25 },
      { header: 'FECHA DE ALTA', width: 14 },
      { header: 'OBSERVACION', width: 30 },
      { header: 'Codificación', width: 15 },
    ],
    filas: (items, nombreCampoMap) =>
      items.map((item, idx) => {
        const v = resolverValoresDinamicos(item, nombreCampoMap)
        return [
          idx + 1,
          item.tipoItem?.nombre ?? '',
          v.Material ?? '',
          v.Medidas ?? '',
          v.Características ?? v.Caracteristicas ?? '',
          v.Color ?? '',
          item.estado_conservacion ?? '',
          v.Procedencia ?? '',
          extraerFecha(item.fecha_alta),
          v.Observaciones ?? '',
          item.codigo_unico ?? '',
        ]
      }),
  },
  A2: {
    titulo: 'A2 - ARTEFACTOS ELECTRICOS',
    columnas: [
      { header: 'CANT. NUM', width: 10 },
      { header: 'ARTEFACTOS ELECTRICOS', width: 25 },
      { header: 'N° DE SERIE', width: 15 },
      { header: 'CARACTERISTICAS (Frigorias, funcion, material, marca, modelo, capacidad, dimensiones, whatts, colgante, de pared, de pie, etc)', width: 50 },
      { header: 'COLOR', width: 15 },
      { header: 'ESTADO (Malo-Regular-Bueno-Muy Bueno)', width: 25 },
      { header: 'PROCEDENCIA (Adquirido- Donado-Etc)', width: 25 },
      { header: 'FECHA DE ALTA', width: 14 },
      { header: 'OBS.', width: 25 },
      { header: 'Codificación', width: 15 },
    ],
    filas: (items, nombreCampoMap) =>
      items.map((item, idx) => {
        const v = resolverValoresDinamicos(item, nombreCampoMap)
        return [
          idx + 1,
          item.tipoItem?.nombre ?? '',
          v['Número de serie'] ?? v['Numero de serie'] ?? '',
          construirDescripcion(item, v),
          v.Color ?? '',
          item.estado_conservacion ?? '',
          v.Procedencia ?? '',
          extraerFecha(item.fecha_alta),
          v.Observaciones ?? '',
          item.codigo_unico ?? '',
        ]
      }),
  },
  A3: {
    titulo: 'A3 - EQUIPO DE RADIOCOMUNICACIÓN, TELEFONIA E INFORMATICA',
    columnas: [
      { header: 'CANT. NUM', width: 10 },
      { header: 'EQUIPO DE RADIOCOMUNICACION, TELEFONIA E INFORMATICA', width: 40 },
      { header: 'N° DE SERIE', width: 15 },
      { header: 'CARACTERISTICAS (marca, velocidad, color, modelo, lcd, led, pulgadas, otra función, color, procesador, disco duro, memoria ram, sistema operativo, tipo, inalambrico, numero de tomas, linea, clase de protección, puertos, conectividad, etc)', width: 60 },
      { header: 'ESTADO (Malo-Regular-Bueno-Muy Bueno)', width: 25 },
      { header: 'PROCEDENCIA (Adquirido- Donado-Etc)', width: 25 },
      { header: 'FECHA DE ALTA', width: 14 },
      { header: 'OBS.', width: 25 },
      { header: 'Codificación', width: 15 },
    ],
    filas: (items, nombreCampoMap) =>
      items.map((item, idx) => {
        const v = resolverValoresDinamicos(item, nombreCampoMap)
        return [
          idx + 1,
          item.tipoItem?.nombre ?? '',
          v['Número de serie'] ?? v['Numero de serie'] ?? '',
          construirDescripcion(item, v),
          item.estado_conservacion ?? '',
          v.Procedencia ?? '',
          extraerFecha(item.fecha_alta),
          v.Observaciones ?? '',
          item.codigo_unico ?? '',
        ]
      }),
  },
  A4: {
    titulo: 'A4 - ARMAMENTO, MUNICIONES Y EQUIPO DE PROTECCION PERSONAL Y BALISTICA',
    columnas: [
      { header: 'CANT. NUM', width: 10 },
      { header: 'ARMAMENTO, MUNICIONES O EQUIPO DE PROTECCION', width: 40 },
      { header: 'TIPO CLASIFICACION', width: 18 },
      { header: 'NUMERACION', width: 15 },
      { header: 'CARACTERISTICAS (marca, modelo, calibre, cartucho, tipo de disparo, otras inscripciones, carga/relleno, modelo, talle, material, etc)', width: 55 },
      { header: 'ESTADO (Malo-Regular-Bueno-Muy Bueno)', width: 25 },
      { header: 'PROCEDENCIA (Adquirido- Donado-Etc)', width: 25 },
      { header: 'FECHA DE ALTA', width: 14 },
      { header: 'OBS. (poner aquí Fecha de Fabric. en Chalecos)', width: 35 },
      { header: 'Codificación', width: 15 },
    ],
    filas: (items, nombreCampoMap) =>
      items.map((item, idx) => {
        const v = resolverValoresDinamicos(item, nombreCampoMap)
        return [
          idx + 1,
          item.tipoItem?.nombre ?? '',
          v.Tipo ?? '',
          v.Numeración ?? v['Número de serie'] ?? '',
          construirDescripcion(item, v),
          item.estado_conservacion ?? '',
          v.Procedencia ?? '',
          extraerFecha(item.fecha_alta),
          v.Observaciones ?? '',
          item.codigo_unico ?? '',
        ]
      }),
  },
  A5: {
    titulo: 'A5 - MAQUINAS Y HERRAMIENTAS',
    columnas: [
      { header: 'CANT. NUM', width: 10 },
      { header: 'MAQUINAS Y HERRAMIENTAS', width: 28 },
      { header: 'TIPO CLASIFICACION', width: 18 },
      { header: 'Nº DE SERIE', width: 15 },
      { header: 'CARACTERISTICAS (marca, color, modelo, material, tamaño, etc)', width: 45 },
      { header: 'ESTADO (Malo-Regular-Bueno-Muy Bueno)', width: 25 },
      { header: 'PROCEDENCIA (Adquirido- Donado-Etc)', width: 25 },
      { header: 'FECHA DE ALTA', width: 14 },
      { header: 'OBS.', width: 25 },
      { header: 'Codificación', width: 15 },
    ],
    filas: (items, nombreCampoMap) =>
      items.map((item, idx) => {
        const v = resolverValoresDinamicos(item, nombreCampoMap)
        return [
          idx + 1,
          item.tipoItem?.nombre ?? '',
          v.Tipo ?? '',
          v['Número de serie'] ?? v['Numero de serie'] ?? '',
          construirDescripcion(item, v),
          item.estado_conservacion ?? '',
          v.Procedencia ?? '',
          extraerFecha(item.fecha_alta),
          v.Observaciones ?? '',
          item.codigo_unico ?? '',
        ]
      }),
  },
  A6: {
    titulo: 'A6 - VEHICULOS',
    columnas: [
      { header: 'N° ORDEN', width: 10 },
      { header: 'VEHICULO (Automovil, motovehiculo, camioneta, utilitario, etc.)', width: 35 },
      { header: 'TIPO (PickUp, Sedán, etc)', width: 20 },
      { header: 'MARCA', width: 15 },
      { header: 'MODELO', width: 15 },
      { header: 'AÑO', width: 8 },
      { header: 'DOMINIO', width: 12 },
      { header: 'ECONOMIA CONSUMO (Malo, Regular, Bueno, Muy Bueno)', width: 30 },
      { header: 'ESTADO FUNCIONAMIENTO (En Servicio, Radiado, Fuera de Serv.)', width: 35 },
      { header: 'NUMERO IDENTIFICATORIO', width: 20 },
      { header: 'PROCEDENCIA (Adquirido- Donado-Etc)', width: 25 },
      { header: 'N° EXPTE', width: 12 },
      { header: 'Codificación', width: 15 },
    ],
    filas: (items, nombreCampoMap) =>
      items.map((item, idx) => {
        const v = resolverValoresDinamicos(item, nombreCampoMap)
        return [
          idx + 1,
          item.tipoItem?.nombre ?? '',
          v.Tipo ?? '',
          v.Marca ?? '',
          v.Modelo ?? '',
          v.Año ?? v.Ano ?? '',
          v.Dominio ?? '',
          v['Economía de consumo'] ?? v['Economia de consumo'] ?? '',
          v['Estado de funcionamiento'] ?? item.estado_conservacion ?? '',
          v['Número de identificación'] ?? '',
          v.Procedencia ?? '',
          v['Número de expediente'] ?? '',
          item.codigo_unico ?? '',
        ]
      }),
  },
  A7: {
    titulo: 'A7 - ALTAS',
    columnas: [
      { header: 'ORDEN', width: 8 },
      { header: 'ELEMENTO DADO DE ALTA (Vehículo, Mueble, etc.)', width: 40 },
      { header: 'ALIMENTACION (Eléctrica, Gas, etc.)', width: 20 },
      { header: 'Nº DE SERIE / DOMINIO', width: 20 },
      { header: 'CARACTERISTICAS (marca, color, modelo, nuevo, usado, material, tamaño, N.I., chasis, motor, etc)', width: 55 },
      { header: 'ESTADO (Malo-Regular-Bueno-Muy Bueno)', width: 25 },
      { header: 'PROCEDENCIA (Adquirido- Donado-Comodato-Etc)', width: 28 },
      { header: 'FECHA DE ALTA', width: 14 },
      { header: 'Nº EXPEDIENTE O INFORME', width: 22 },
    ],
    filas: (items, nombreCampoMap) =>
      items.map((item, idx) => {
        const v = resolverValoresDinamicos(item, nombreCampoMap)
        const serie = v['Número de serie'] ?? v.Dominio ?? ''
        return [
          idx + 1,
          item.tipoItem?.nombre ?? '',
          v.Tipo ?? '',
          serie,
          construirDescripcion(item, v),
          item.estado_conservacion ?? '',
          v.Procedencia ?? '',
          extraerFecha(item.fecha_alta),
          v['Número de expediente'] ?? '',
        ]
      }),
  },
  A8: {
    titulo: 'A8 - BAJAS',
    columnas: [
      { header: 'ORDEN', width: 8 },
      { header: 'ELEMENTO DADO DE BAJA (Vehículo, Mueble, etc.)', width: 40 },
      { header: 'ALIMENTACION (Eléctrica, Gas, etc.)', width: 20 },
      { header: 'Nº DE SERIE / DOMINIO', width: 20 },
      { header: 'CARACTERISTICAS (marca, color, modelo, material, tamaño, N.I., chasis, motor, etc)', width: 55 },
      { header: 'ESTADO (Malo-Regular-Bueno-Muy Bueno)', width: 25 },
      { header: 'MOTIVO (Destruccion, Cambio de Destino, Préstamo, Sustraccion, Etc.)', width: 40 },
      { header: 'LUGAR ACTUAL (del Nuevo Destino o Depósito)', width: 30 },
      { header: 'FECHA DE BAJA', width: 14 },
      { header: 'Nº EXPEDIENTE O INFORME INTERNO, citar Nº Resolucion o Decreto que Autorizó la Baja', width: 55 },
    ],
    filas: (items) =>
      items.map((item, idx) => [
        idx + 1,
        item.tipoItem?.nombre ?? '',
        '',
        item.valores_dinamicos?.['Número de serie'] ?? item.valores_dinamicos?.Dominio ?? '',
        [
          item.valores_dinamicos?.Marca,
          item.valores_dinamicos?.Modelo,
          item.valores_dinamicos?.Color,
        ].filter(Boolean).join(', ') || '',
        item.estado_conservacion ?? '',
        item.motivo_baja ?? '',
        item.unidad?.sede?.nombre ?? '',
        extraerFecha(item.fecha_baja),
        item.valores_dinamicos?.['Número de expediente'] ?? '',
      ]),
  },
  B1: {
    titulo: 'B1 - PROPIEDAD PROVINCIAL',
    columnas: [
      { header: 'ORDEN', width: 8 },
      { header: 'DIRECCION', width: 30 },
      { header: 'MZNA', width: 8 },
      { header: 'PARCELA', width: 8 },
      { header: 'LOTE', width: 8 },
      { header: 'N° PLANO MENSURA', width: 15 },
      { header: 'N° PARTIDA INMOBILIARIA', width: 18 },
      { header: 'N° PADRON MUNICIPAL', width: 18 },
      { header: 'N° DOMINIO', width: 12 },
      { header: 'N° FOLIO', width: 10 },
      { header: 'N° TOMO', width: 10 },
      { header: 'N° FOLIO', width: 10 },
      { header: 'FECHA', width: 14 },
      { header: 'SUP. TERRENO', width: 14 },
      { header: 'SUP. CUBIERTA', width: 14 },
      { header: 'CANTIDAD DE AMBIENTES (DESCRIPCION)', width: 35 },
    ],
    filas: () => [],
  },
  B2: {
    titulo: 'B2 - PROPIEDAD NO PROVINCIAL',
    columnas: [
      { header: 'ORDEN', width: 8 },
      { header: 'DIRECCION', width: 30 },
      { header: 'PERTENENCIA (Nacional, Municipal, Particular, etc.)', width: 30 },
      { header: 'CONTRATO (Alquiler, Comodato, Donación)', width: 28 },
      { header: 'MZNA', width: 8 },
      { header: 'PARCELA', width: 8 },
      { header: 'LOTE', width: 8 },
      { header: 'N° PLANO MENSURA', width: 15 },
      { header: 'N° PARTIDA INMOBILIARIA', width: 18 },
      { header: 'N° PADRON MUNICIPAL', width: 18 },
      { header: 'N° DOMINIO', width: 12 },
      { header: 'N° FOLIO', width: 10 },
      { header: 'N° TOMO', width: 10 },
      { header: 'N° FOLIO', width: 10 },
      { header: 'FECHA', width: 14 },
      { header: 'SUP. TERRENO', width: 14 },
    ],
    filas: () => [],
  },
}

function generarHoja(hojaConfig, filas) {
  const { titulo, columnas } = hojaConfig
  const numCols = columnas.length
  const maxCol = numCols - 1

  const headerRow1 = [titulo, ...Array(maxCol).fill('')]
  const headerRow2 = [DEPENDENCIA, ...Array(maxCol).fill('')]
  const headerRow3 = [DIRECCION, ...Array(maxCol).fill('')]
  const headerRow4 = columnas.map((c) => c.header)

  const datos = [headerRow1, headerRow2, headerRow3, headerRow4, ...filas]

  const ws = XLSX.utils.aoa_to_sheet(datos)

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: maxCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: maxCol } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: maxCol } },
  ]

  ws['!cols'] = columnas.map((c) => ({ wch: c.width || 15 }))

  if (filas.length > 0) {
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: 3, c: 0 },
        e: { r: 3 + filas.length, c: maxCol },
      }),
    }
  }

  return ws
}

const CODIGOS_INVENTARIO = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6']

export async function exportarFormatoOficial(onProgress) {
  const paso = (msg) => onProgress?.(msg)

  paso('Consultando categorías...')
  const resCats = await api.get('/categorias')
  const categorias = resCats.data?.categorias || []

  const nombreCampoMap = {}
  for (const cat of categorias) {
    for (const cp of cat.campos_dinamicos || []) {
      nombreCampoMap[cp.id] = cp.nombre
    }
  }

  paso('Consultando ítems...')
  const resItems = await api.get('/reportes/items')
  const todosItems = resItems.data || []

  const itemsActivos = todosItems.filter(
    (i) => i.estado === 'activo' && i.categoria?.codigo && CODIGOS_INVENTARIO.includes(i.categoria.codigo)
  )
  const itemsBaja = todosItems.filter((i) => i.estado === 'baja')

  const porCategoria = new Map()
  for (const item of itemsActivos) {
    const codigo = item.categoria.codigo
    if (!porCategoria.has(codigo)) porCategoria.set(codigo, [])
    porCategoria.get(codigo).push(item)
  }

  const wb = XLSX.utils.book_new()
  const ordenHojas = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'B1', 'B2']

  for (const codigo of ordenHojas) {
    const config = HOJAS[codigo]
    if (!config) continue

    let filas = []

    if (codigo === 'A7') {
      filas = config.filas(itemsActivos, nombreCampoMap)
    } else if (codigo === 'A8') {
      filas = config.filas(itemsBaja)
    } else if (codigo === 'B1' || codigo === 'B2') {
      filas = []
    } else {
      const itemsCategoria = porCategoria.get(codigo) || []
      filas = config.filas(itemsCategoria, nombreCampoMap)
    }

    const hoja = generarHoja(config, filas)
    XLSX.utils.book_append_sheet(wb, hoja, codigo)
  }

  paso('Generando archivo...')
  XLSX.writeFile(wb, NOMBRE_ARCHIVO)
}

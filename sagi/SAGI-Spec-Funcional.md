---
title: "SAGI - Spec Funcional por Elemento"
subtitle: "Inventario detallado de cada componente, elemento y comportamiento de la interfaz"
author: "Instituto de Seguridad Publica (ISeP)"
date: "31 de agosto de 2026"
version: "1.2"
---

# SAGI - Spec Funcional por Elemento

Inventario detallado de cada componente, elemento y comportamiento de la interfaz.

Versión: 1.2 | Fecha: 31 de agosto de 2026

---

## Indice

1. Elementos Globales (Layout, Sidebar, Topbar)
2. Login
3. Dashboard
4. Inventario
5. Formulario de Item (ItemForm)
6. Detalle de Item (ItemDetalle)
7. Categorias
8. Movimientos
9. Alertas
10. Reportes
11. Auditoria
12. Sedes y Unidades
13. Componentes Reutilizables
14. Sistema de Notificaciones (Toast)
15. Sistema de Temas (Claro/Oscuro)
16. Matriz de Permisos por Rol

---

## 1. Elementos Globales

### 1.1 Sidebar

| Elemento | Tipo | Comportamiento |
|----------|------|----------------|
| Logo SAGI | SVG + texto | Hexagono con gradiente azul-naranja. Texto "SAGI" con gradiente clipped. |
| Boton colapsar | `<button>` | Chevron a la izquierda. Alterna sidebar entre 240px y 60px. Estado persistido en `localStorage.sagi_sidebar_collapsed`. |
| Grupo: Operaciones | Seccion colapsable | Contiene Dashboard y Alertas. Header clickeable para expandir/colapsar. Estado en `localStorage.sagi_open_groups`. |
| Grupo: Inventario | Seccion colapsable | Contiene Inventario y Movimientos. |
| Grupo: Configuracion | Seccion colapsable | Contiene Categorias y Sedes y Unidades. Solo admin. |
| Grupo: Control | Seccion colapsable | Contiene Reportes y Auditoria. |
| Nav item: Dashboard | NavLink | Icono grid 2x2. Texto "Dashboard". Visible: todos los roles. |
| Nav item: Alertas | NavLink | Icono campana. Texto "Alertas". Badge rojo con contador de alertas abiertas (>99 muestra "99+"). En sidebar colapsado: punto rojo. Visible: admin, jefe, carga. |
| Nav item: Inventario | NavLink | Icono cubo 3D. Texto "Inventario". Visible: todos los roles. |
| Nav item: Movimientos | NavLink | Icono flechas circulares. Texto "Movimientos". Visible: admin, jefe, carga. |
| Nav item: Categorias | NavLink | Icono lista con puntos. Texto "Categorias". Visible: solo admin. |
| Nav item: Sedes y Unidades | NavLink | Icono casa. Texto "Sedes y Unidades". Visible: solo admin. |
| Nav item: Reportes | NavLink | Icono barras verticales. Texto "Reportes". Visible: admin, jefe. |
| Nav item: Auditoria | NavLink | Icono documento. Texto "Auditoria". Visible: admin, jefe. |
| Footer | `<div>` | Texto: "Departamento Tecnologia, Desarrollo e Innovacion". Oculto en modo colapsado. |

**Estilos:**
- Background sidebar: `#131722`
- Item activo: fondo `rgba(111, 178, 232, 0.18)`, texto `#6fb2e8`
- Item hover: fondo `rgba(255, 255, 255, 0.08)`, texto `#ffffff`
- Transicion colapsado: `width 0.2s ease`

### 1.2 Topbar

| Elemento | Tipo | Comportamiento |
|----------|------|----------------|
| Boton hamburger | `<button>` | Solo visible en movil (<900px). Abre sidebar overlay. Icono 3 lineas horizontales. |
| Link "Volver" | `<Link>` | Pills boton naranja con `border: 1px solid rgba(245, 124, 0, 0.5)`. Aparece cuando la prop `back` esta definida. |
| Titulo pagina | `<h1>` | Font-size 20px (17px en movil). |
| Info usuario | `<p class="topbar-user">` | "{nombre} . {rol} . {sede}". Font-size 13px, color muted. |
| Area de acciones | `<div>` | Recibe prop `actions` de cada pagina. Botones alineados a la derecha. |
| Boton tema | `<button>` | Emoji sol/luna. Alterna entre dark y light. Estado en `localStorage.sagi_theme`. |
| Boton cambiar contrasena | `<button>` | Emoji llave. Abre modal de cambio de contrasena. |
| Boton cerrar sesion | `<button>` | Texto "Cerrar sesion". Llama `logout()` del AuthContext. |

### 1.3 Bottom Nav (Movil)

Visible en pantallas <900px. Barra fija en la parte inferior.

| Elemento | Comportamiento |
|----------|----------------|
| Dashboard | Icono + texto "Dashboard". Activo en `/`. |
| Alertas | Icono + texto "Alertas" + badge rojo. |
| Inventario | Icono + texto "Inventario". |
| Movimientos | Icono + texto "Movimientos". |

### 1.4 Modal Cambiar Contrasena

| Campo | Tipo | Validacion |
|-------|------|------------|
| Contrasena actual | `<input type="password">` | Requerido |
| Nueva contrasena | `<input type="password">` | Requerido, min 6 caracteres |
| Confirmar contrasena | `<input type="password">` | Requerido, debe coincidir |

**Botones:** Cancelar, Guardar.
**API:** `POST /api/change-password`
**Comportamiento:** Exito muestra mensaje verde, cierra automaticamente en 2s.

---

## 2. Login (`/login`)

| Elemento | Tipo | Comportamiento |
|----------|------|----------------|
| Contenedor auth | `<div class="auth-card">` | Tarjeta centrada con borde naranja superior. |
| Logo SAGI | SVG + texto | Mismo que sidebar. |
| Titulo | `<h1>` | "Sistema de Administracion y Gestion de Inventarios" |
| Subtitulo | `<p>` | "Instituto de Seguridad Publica" |
| Campo DNI | `<input type="text">` | Label: "DNI". Placeholder: "Ej. 10000001 o admin". Requerido. |
| Campo contrasena | `<input type="password">` | Label: "Contrasena". Placeholder: "Ej. Admin1234". Requerido. |
| Mensaje de error | `<p>` | Banner rojo. Muestra error de API o "Error al iniciar sesion". |
| Boton submit | `<button type="submit">` | Texto: "Ingresar". Loading: "Ingresando...". Deshabilitado durante carga. |
| Credenciales de prueba | `<div>` | 4 cuentas: admin/Admin1234, jefe/Jefe1234, carga/Carga1234, consulta/Consulta1234. |

**API:** `POST /api/login` con `{ dni, password }`.
**Exito:** Guarda token en `localStorage.sagi_token`, usuario en `localStorage.sagi_user`. Redirige a `/`.

---

## 3. Dashboard (`/`)

### 3.1 Tarjetas de Estadisticas

Grid de 4 tarjetas (min 220px cada una):

| Tarjeta | Icono | Dato | Label |
|---------|-------|------|-------|
| Total items | Archivo | `stats.total` | "Total de items" |
| Items activos | Check circle | `stats.activos` | "Items activos" |
| Movimientos pendientes | Reloj | `stats.movimientos_pendientes` | "Movimientos pendientes" |
| Alertas activas | Campana | `stats.alertas_activas` | "Alertas activas" |

### 3.2 Graficos

| Grafico | Tipo | Datos |
|---------|------|-------|
| Items por categoria | Chart.js `<Bar>` | Eje X: codigos de categorias. Eje Y: cantidad. Barras azules. Altura: 220px. |
| Distribucion por estado | Chart.js `<Doughnut>` | Labels: nombres de categorias. 6 colores. Leyenda abajo. Altura: 260px. |

### 3.3 Tabla "Items activos por categoria"

| Columna | Contenido |
|---------|-----------|
| Codigo | `cat.codigo` |
| Categoria | `cat.nombre` |
| Items | `cat.items_count` |

**API:** `GET /api/dashboard/stats`

---

## 4. Inventario (`/inventario`)

### 4.1 Barra de Filtros

| Elemento | Tipo | Comportamiento |
|----------|------|----------------|
| Input busqueda | `<input>` | Placeholder: "Ej. SAGI-000001 o escritorio". Debounced 300ms. Reset pagina a 1. |
| Boton limpiar busqueda | `<button>` | Icono "x". Aparece solo si hay texto. Limpia busqueda y resetea a pagina 1. |
| Boton "Filtros" | `<button>` | Solo visible en movil. Colapsa/expande filtros extra. |
| Select categoria | `<select>` | "Todas las categorias" + categorias no transitorias. Reset pagina a 1 al cambiar. |
| Contador resultados | `<span>` | "{N} items" |

### 4.2 Toggle de Columnas (Desktop)

Barra de pills debajo de filtros:

| Pill | Columna que controla | Obligatoria |
|------|---------------------|-------------|
| Categoría | columna categoria | No |
| Detalle | columna detalle | No |
| Conservación | columna estado_conservacion | No |
| Cant. | columna cantidad | No |
| Unidad | columna unidad | No |
| Responsable | columna responsable | No |

Columnas siempre visibles: Codigo, Estado, Acciones.
Estado persistido en `localStorage.sagi_hidden_cols`.

### 4.3 Tabla Desktop (VirtualTable)

Flexbox table con header sticky y body con scroll (`max-height: 70vh`).

| Columna | Flex | Contenido | Visibilidad |
|---------|------|-----------|-------------|
| Codigo | 1.4 | `item.codigo_unico` en `<strong>` | Siempre |
| Categoria | 0.7 | `item.categoria.codigo` | Configurable |
| Detalle | 2 | `formatValores(item)`: tipo_item + primeros 2 valores dinamicos | Configurable |
| Estado | 0.6 | Badge color-coded: activo (verde), pendiente (naranja), baja (rojo) | Siempre |
| Conservacion | 0.8 | Badge: Muy bueno (verde), Bueno (azul), Regular (naranja), Malo (rojo) | Configurable |
| Cantidad | 0.4 | Numero | Configurable |
| Unidad | 0.7 | `item.unidad.nombre` | Configurable |
| Responsable | 0.9 | `item.responsable.name` | Configurable |
| Motivo Baja | 1 | Texto truncado con tooltip. Solo muestra si estado=baja. | Solo admin/jefe |
| Acciones | 1.2 | Ver (siempre), Editar (admin/jefe/carga + no baja), Eliminar (admin/jefe/carga + no baja) | Siempre |

**Fila:** Click abre modal detalle. Items baja: opacity 0.55. Hover: fondo azul claro.

### 4.4 Cards Mobile

Visible en <768px. Grid 1 columna (2 en >=480px):

| Parte | Contenido |
|-------|-----------|
| Header | Codigo + badge estado |
| Body | Detalle, categoria + unidad, conservacion + cantidad |
| Motivo Baja | Solo visible si estado=baja y usuario=admin/jefe. Texto rojo con borde izquierdo. |
| Footer | Ver, Editar (si aplica), Eliminar (si aplica) |

### 4.5 Paginacion

| Elemento | Comportamiento |
|----------|----------------|
| Anterior | Deshabilitado en pagina 1 |
| Pagina X de Y | Texto con `aria-live="polite"` |
| Siguiente | Deshabilitado en ultima pagina |

**API:** `GET /api/items?search=&categoria_id=&page=`

---

## 5. Formulario de Item (`ItemForm`)

### 5.1 Campos Fijos (siempre visibles)

| Campo | Tipo | Requisito | Notas |
|-------|------|-----------|-------|
| Categoria | `<select>` | Si | Filtra categorias transitorias. Deshabilitado en edicion. |
| Estado de conservacion | `<select>` | Si | Opciones: Muy bueno, Bueno, Regular, Malo |
| Elemento | `<select>` | Condicional | Solo si la categoria tiene tipos. Carga desde API. Cambio pide confirmacion si hay campos dinamicos con valores. |
| Cantidad | `<input type="number">` | Si | min=1, step=any |

### 5.2 Campos de Alta (ocultos en edicion)

| Campo | Tipo | Requisito | Notas |
|-------|------|-----------|-------|
| Fecha de alta | `<input type="date">` | Si* | Max = hoy. *O salta si "Fecha desconocida" |
| Fecha desconocida | `<input type="checkbox">` | No | Si checked, deshabilita campo fecha |
| Unidad de destino | `<select>` | Si | Solo unidades activas, muestra nombre de sede |
| Motivo del alta | `<textarea>` | Si | Placeholder segun tipo de movimiento |

### 5.3 Campos Dinamicos

Seccion visible solo si hay categoria + tipo_item seleccionados.

| Tipo de campo | Render |
|---------------|--------|
| texto | `<input type="text">` |
| numero | `<input type="number" step="any">` |
| fecha | `<input type="date">` |
| select | `<select>` con opciones de `campo.opciones` (separadas por coma) |
| textarea | `<textarea>` 3 filas |

**Validacion:** Campos requeridos (segun `campo.requerido`) se validan antes de enviar.
**Errores inline:** `fieldErrors` state con mensajes por campo. `aria-invalid="true"` en campos con error. Mensajes en espanol.

### 5.4 Comportamiento del Formulario

| Evento | Comportamiento |
|--------|----------------|
| Cambio de categoria | Carga tipos de elemento + campos dinamicos. AbortController cancela request anterior. |
| Cambio de tipo_item | Pide confirmacion si hay campos dinamicos con valores. Si confirma, limpia valores. AbortController cancela request anterior. |
| Submit exitoso | Llama `onSaved()`. Muestra toast success. |
| Error de API | Muestra toast error con mensaje descriptivo. Errores de validacion por campo. |
| Cancelar | Llama `onCancel()`. |

**API:** `POST /api/items` (alta) o `PUT /api/items/:id` (edicion)

---

## 6. Detalle de Item (`ItemDetalle`)

### 6.1 Seccion: Datos del item

| Campo | Contenido |
|-------|-----------|
| Codigo | `item.codigo_unico` |
| Categoria | `item.categoria.codigo` + `item.categoria.nombre` |
| Elemento | `item.tipo_item.nombre` |
| Estado | Badge color-coded |
| Conservacion | Badge color-coded |
| Cantidad | Numero |
| Unidad actual | `item.unidad.nombre` + sede |
| Responsable | `item.responsable.name` |
| Fecha de alta | Formateada DD/MM/YYYY HH:mm o "Desconocida" |
| Motivo de baja | Solo visible si estado=baja y usuario=admin/jefe. Texto rojo con motivo. |
| Fecha de baja | Solo visible si estado=baja y usuario=admin/jefe. |

### 6.2 Seccion: Campos del elemento

Lista de pares clave-valor de `item.valores_dinamicos`, filtrada por campos activos y que coincidan con el tipo_item.

### 6.3 Seccion: Historial de movimientos

Timeline vertical con scroll (`max-height: 400px`):

| Elemento | Contenido |
|----------|-----------|
| Dot | Color por estado: aprobado (verde), pendiente (naranja), rechazado (rojo) |
| Badge tipo | alta (verde), traslado (azul), baja (rojo) |
| Badge estado | aprobado/pendiente/rechazado |
| Fecha | `m.created_at` formateada |
| Origen -> Destino | Para traslados. Solo origen para altas/bajas. |
| Motivo | Texto del motivo |
| Solicitante | Nombre |
| Validador | Nombre (si existe) |
| Rechazo | Caja roja con motivo de rechazo (si aplica) |

**API:** `GET /api/items/:id`

### 6.4 Boton Reactivar (solo admin/jefe)

Visible solo si `item.estado === 'baja'` y usuario es admin o jefe.

| Elemento | Comportamiento |
|----------|----------------|
| Boton "Reactivar ítem" | Abre modal de reactivación |

#### Modal Reactivar

| Campo | Tipo | Validacion |
|-------|------|------------|
| Motivo de reactivación | `<textarea>` | Requerido, max 500 caracteres |

**Botones:** Cancelar, Reactivar.
**API:** `POST /api/items/:id/reactivar` con `{ motivo_reactivacion }`.
**Comportamiento:** Al enviar, cambia estado a "activo", restaura categoría original, limpia motivo_baja/fecha_baja/categoria_original_id, crea movimiento "alta" aprobado, muestra toast success.

---

## 7. Categorias (`/categorias`)

### 7.1 Panel Izquierdo: Lista de categorias

| Elemento | Comportamiento |
|----------|----------------|
| Botones de categoria | Muestran codigo + nombre. Activo: fondo highlighted. Categoria transitoria: badge "transitoria". |
| Click | Selecciona categoria y muestra sus campos/detalles en el panel derecho. |

### 7.2 Panel Derecho: Detalle de categoria seleccionada

#### 7.2.1 Campos dinamicos

| Elemento | Comportamiento |
|----------|----------------|
| Selector de ambito | `<select>`: "Campos generales de la categoria" + tipos de elemento. Filtra que campos se muestran. |
| Form agregar campo | Grid 3 columnas: nombre + tipo + boton agregar. |
| Tipos de campo | texto, numero, fecha, select, textarea |
| Input opciones | Solo visible cuando tipo = select. Placeholder: "Ej. Rojo, Azul, Verde" |

**Tabla de campos:**

| Columna | Contenido |
|---------|-----------|
| # | Numero de orden |
| Campo | `campo.nombre` |
| Tipo | `campo.tipo` + opciones si select |
| Requerido | Si / No |
| Activo | Si / No |
| Acciones | Orden (arriba/abajo), Editar, Activar/Desactivar, Eliminar |

Filas inactivas: opacity 0.5.

#### 7.2.2 Elementos de la categoria

| Elemento | Comportamiento |
|----------|----------------|
| Boton "+ Nuevo elemento" | Abre wizard de creacion en 2 pasos |
| Tabla de elementos | Muestra #, nombre, acciones (editar, eliminar, orden) |

### 7.3 Wizard NuevoElementoWizard

Componente: `NuevoElementoWizard.jsx`

#### Paso 1: Introduccion

| Elemento | Comportamiento |
|----------|----------------|
| Icono | Emoji de paquete |
| Titulo | "Nuevo elemento en {codigo}" |
| Subtitulo | Indica que se creara un nuevo tipo de elemento en la categoria seleccionada |
| Boton "Cancelar" | Cierra el wizard |
| Boton "Comenzar →" | Avanza al paso 2 |

#### Paso 2: Configuracion

Layout de dos columnas (desktop: lado a lado, mobile: apilado).

**Columna izquierda - Formulario:**

| Campo | Tipo | Comportamiento |
|-------|------|----------------|
| Nombre del elemento * | `<input type="text">` | Placeholder: "Ej. Escritorio, Computadora, Teclado". Validacion de duplicados en tiempo real (case-insensitive, normalizado). |
| Info campos fijos | `<div>` | Aviso con lista de campos que ya existen: Categoria, Elemento, Estado de conservacion, Cantidad, Fecha de alta, Unidad de destino |
| Campos adicionales | Lista dinamica | Cada campo: nombre + tipo + opciones (si select) + requerido + boton eliminar |

**Columna derecha - Vista previa:**

| Elemento | Comportamiento |
|----------|----------------|
| Preview card | Tarjeta con header (codigo + nombre) y body (lista de campos) |
| Header | Badge con codigo de categoria + nombre del elemento (o placeholder si esta vacio) |
| Campos fijos | Se muestran con valores de ejemplo (ej: "Bueno" para estado, fecha actual para fecha alta) |
| Campos adicionales | Se agregan en tiempo real al escribir/eliminar campos. Tipo select muestra primera opcion, fecha muestra "dd/mm/aaaa", numero muestra "0", textarea muestra "Texto..." |
| Divider | Linea punteada separando campos fijos de adicionales |
| Campo requerido | Indicador "*" al lado del nombre |

**Funcionamiento de campos adicionales:**

| Accion | Resultado |
|--------|-----------|
| Click "+ Agregar campo" | Agrega nueva fila con: nombre vacio, tipo "texto", sin opciones, no requerido |
| Cambiar nombre | Se refleja inmediatamente en la vista previa |
| Cambiar tipo | Se actualiza el placeholder en la vista previa |
| Cambiar opciones (select) | La primera opcion se muestra como ejemplo en la vista previa |
| Marcar requerido | Aparece "*" junto al nombre en la vista previa |
| Eliminar campo | Se elimina de la lista y de la vista previa |

**API calls al guardar:**
1. `POST /categorias/{id}/tipos` con `{ nombre }`
2. Por cada campo con nombre: `POST /categorias/{id}/campos` con `{ nombre, tipo, requerido, tipo_item_id, orden, opciones? }`

### 7.3 Modales

| Modal | Campos |
|-------|--------|
| Editar campo | Nombre, Tipo (select), Opciones (si select), Requerido (checkbox) |
| Editar elemento | Nombre |

**API:** GET/POST/PUT/DELETE para categorias, campos-dinamicos, tipos-item. Validacion de duplicados client-side.

---

## 8. Movimientos (`/movimientos`)

### 8.1 Filtros

| Filtro | Opciones |
|--------|----------|
| Tipo | Todos los tipos, Alta, Traslado, Baja |
| Estado | Todos los estados, Pendiente, Aprobado, Rechazado |

Contador: "{N} movimientos"

### 8.2 Tabla de Movimientos

| Columna | Contenido |
|---------|-----------|
| Fecha | `m.created_at` formateada |
| Tipo | Texto: "Traslado" / "Baja" / "Alta" |
| Item | `m.item.codigo_unico` (bold) + `m.item.tipo_item.nombre` |
| Origen -> Destino | Unidad origen -> destino + motivo + motivo_rechazo (si existe) |
| Estado | Badge color-coded |
| Solicitante | `m.solicitante.name` + "validado por {validador}" si existe |
| Acciones | Aprobar + Rechazar (solo si pendiente y puedeValidar) |

### 8.3 Modal Nueva Solicitud

Componente: `Movimientos.jsx`

**Al abrir el modal:**
1. Se cargan los movimientos pendientes del usuario actual (`GET /api/movimientos?estado=pendiente&user_id={userId}`)
2. Se extraen los `item_id` de los movimientos pendientes
3. Se almacenan en `itemsConPendientes` para validacion

| Campo | Tipo | Notas |
|-------|------|-------|
| Tipo | `<select>` | Alta, Traslado, Baja. Baja se selecciona automaticamente si unidad destino es "Baja administrativa". |
| Item | Buscador con dropdown | Muestra resultados filtrados por codigo/nombre. **Validacion**: Si el item ya tiene movimiento pendiente, muestra tag "⚠ Pendiente" al lado. Si el item esta dado de baja (estado="baja"), bloquea la seleccion. |
| Unidad destino | `<select>` | Solo si tipo = traslado. Si selecciona "Baja administrativa", cambia tipo a "baja" y deshabilita item (busca automaticamente). |
| Motivo | `<textarea>` | Requerido. Placeholder: "Describa el motivo de la solicitud..." |
| Imagen evidencia | Upload | Opcional. Boton de camara para upload. |

**Logica de proteccion contra duplicados:**
- Al buscar items, se filtran los que tienen movimiento pendiente
- En los resultados, los items con pendiente muestran tag visual "⚠ Pendiente"
- Al seleccionar un item con pendiente, se muestra un aviso amarillo con tipo de movimiento y solicitante
- Si el item ya tiene movimiento pendiente, el boton "Solicitar" se deshabilita

**Botones:** Cancelar, Solicitar.

**API calls:**
1. `GET /api/movimientos?estado=pendiente&user_id={userId}` (al abrir modal)
2. `GET /api/items?search={query}&categoria_id={catId}&page=1&per_page=20` (busqueda)
3. `POST /api/movimientos` con `{ item_id, unidad_destino_id, tipo, descripcion, imagen_evidencia, usuario_id }` (al solicitar)
   - Server revalida que no exista movimiento pendiente para el item (validacion doble)
   - Retorna 422 si ya existe un pendiente

### 8.4 Modal Rechazar

| Campo | Tipo |
|-------|------|
| Motivo del rechazo | `<input>` requerido |

**Botones:** Cancelar, Rechazar.

**API:**
- `POST /api/movimientos/traslados`
- `POST /api/movimientos/bajas`
- `POST /api/movimientos/:id/aprobar`
- `POST /api/movimientos/:id/rechazar`

---

## 9. Alertas (`/alertas`)

### 9.1 Filtros

| Filtro | Opciones | Default |
|--------|----------|---------|
| Estado | Todas, Abiertas, Cerradas | Abiertas |

Contador: "{N} alertas"

### 9.2 Tabla de Alertas

| Columna | Contenido |
|---------|-----------|
| Fecha | `a.created_at` formateada |
| Prioridad | Badge: critica (rojo), importante (naranja), informativa (azul) |
| Mensaje | `a.mensaje`. Si cerrada: "Cerrada: {fecha}" en texto small muted |
| Item | `a.item.codigo_unico` o "-" |
| Estado | Badge: abierta/cerrada |
| Acciones | "Cerrar" (solo si abierta y puedeGestionar) |

### 9.3 Modal Nueva Alerta

| Campo | Tipo | Notas |
|-------|------|-------|
| Mensaje | `<input>` | Requerido. Placeholder: "Ej. Mantenimiento programado del equipo" |
| Prioridad | `<select>` | Critica, Importante, Informativa |
| Unidad | `<select>` | Unidades activas con sede |
| Item | `<select>` | Opcional. Default: "Sin item asociado" |

**Botones:** Cancelar, Crear alerta.

**API:**
- `GET /api/alertas?estado=`
- `POST /api/alertas`
- `POST /api/alertas/:id/cerrar`

---

## 10. Reportes (`/reportes`)

### 10.1 Botones de Exportacion

| Boton | Formato | Filename |
|-------|---------|----------|
| Formato Oficial | `.xlsx` (10 hojas, formato institucional ISeP) | `inventario-YYYY-MM-DD.xlsx` |
| Excel | `.xlsx` (multi-hoja por categoria) | `inventario-YYYY-MM-DD.xlsx` |
| CSV | `.csv` (UTF-8 BOM, delimitador ;) | `inventario-YYYY-MM-DD.csv` |
| PDF | `.pdf` (A4 landscape, autoTable) | `inventario-YYYY-MM-DD.pdf` |

### 10.2 Formato Oficial (exportarFormatoOficial.js)

Genera archivo `.xlsx` con 10 hojas siguiendo el formato institucional del ISeP.

**Estructura por hoja (4 filas de encabezado + datos):**
- Fila 1: Titulo de la hoja (merged, estilo bold 16pt)
- Fila 2: "DEPENDENCIA: Division Secretaria General, sede Rosario."
- Fila 3: "DIRECCION / UNIDAD REGIONAL: I.Se.P."
- Fila 4: Encabezados de columnas (fondo azul #1F4E79, texto blanco bold, auto-filter)

**Hoja: A1 - Amoblamiento y Utiles**

| Columna | Fuente |
|---------|--------|
| Codigo del item | `item.codigo_unico` |
| Elemento | `item.tipo_item.nombre` |
| Detalle del elemento | `item.valores_dinamicos.campo_1` |
| Cantidad | `item.cantidad` |
| Estado de conservacion | `item.estado_conservacion` |
| Marca | `item.valores_dinamicos.campo_2` |
| Modelo | `item.valores_dinamicos.campo_3` |
| Nro. Serie | `item.valores_dinamicos.campo_4` |
| Fecha de alta | `item.fecha_alta` |
| Unidad de destino | `item.unidad.nombre` |
| Sede | `item.unidad.sede.nombre` |
| Estado | `item.estado` |
| Observaciones | "Activo" o `item.motivo_baja` si estado=baja |

**Hojas: A2, A3, A4, A5, A6** — Mismas columnas, filtradas por `categoria_id` correspondiente (2, 3, 4, 5, 6).

**Hoja: A7 - Altas**
- Fuente: Items con `estado='activo'` (no movimientos)
- Columnas: Fecha, Codigo del item, Elemento, Detalle, Cantidad, Estado conservacion, Marca, Modelo, Nro. Serie, Unidad de destino, Sede, Observaciones

**Hoja: A8 - Bajas**
- Fuente: Items con `estado='baja'`
- Columnas: Fecha de baja, Codigo del item, Elemento, Detalle, Cantidad, Estado conservacion, Marca, Modelo, Nro. Serie, Unidad de destino, Sede, Motivo de baja, Observaciones

**Hojas: B1 y B2** — Solo encabezados (sin datos).

### 10.3 API Backend

- `GET /api/reportes/items` — Retorna todos los items con eager-loading: `categoria`, `tipoItem`, `unidad`, `unidad.sede`, `categoriaOriginal`, `responsable`, `campoDinamico` (valores), `responsableAsignado`
- `GET /api/reportes/resumen` — Estadisticas: items activos, items por categoria, por conservacion, por sede, por unidad, por elemento, movimientos por mes

### 10.4 Changelog v1.2 (31 agosto 2026)

- Added Formato Oficial export (10 sheets, institutional ISeP format)
- Added duplicate movement prevention in Movimientos (step 8.3)
- Added NuevoElementoWizard 2-step flow (step 7.3)

### 10.2 Tablas de Resumen

| Tabla | Columnas |
|-------|----------|
| Items activos por categoria | Codigo, Categoria, Items |
| Items por estado de conservacion | Estado, Items |
| Items activos por sede | Sede, Items |
| Items activos por unidad de destino | Unidad, Sede, Items |
| Items activos por elemento | Elemento, Items |
| Movimientos por mes (ultimos 6) | Mes, Tipo, Cantidad |

**API:** `GET /api/reportes/resumen`, `GET /api/reportes/items`

---

## 11. Auditoria (`/auditoria`)

### 11.1 Filtros

| Filtro | Opciones |
|--------|----------|
| Entidad | Todas, auth, item, categoria, tipo_item, campo_dinamico, movimiento |
| Accion | Todas, login, crear, editar, eliminar, mover, solicitar, aprobar, rechazar |

Contador: "{N} registros"

### 11.2 Tabla de Auditoria

| Columna | Contenido |
|---------|-----------|
| Fecha | `log.created_at` formateada |
| Usuario | `log.user.name` |
| Accion | Badge color-coded: login (azul), crear (verde), editar (naranja), eliminar (rojo), mover (gris), solicitar (azul), aprobar (verde), rechazar (rojo) |
| Entidad | `log.entidad` |
| Detalle | Pares clave:valor separados por " . " |

### 11.3 Exportacion

| Boton | Formato | Comportamiento |
|-------|---------|----------------|
| Excel | `.xlsx` | Exporta TODAS las paginas. Hoja "Auditoria". Filename: `auditoria-YYYY-MM-DD.xlsx` |
| JSON | `.json` | Exporta TODAS las paginas. Filename: `auditoria-YYYY-MM-DD.json` |

**API:** `GET /api/auditoria?entidad=&accion=&page=`

---

## 12. Sedes y Unidades (`/unidades`)

### 12.1 Panel Admin (solo admin)

Dos columnas:

**Izquierda: Sedes**

| Elemento | Comportamiento |
|----------|----------------|
| Cards de sede | Nombre editable (input inline, guarda en blur via PUT). Meta: "IdSede XX . N unidades". Botones: Desactivar/Activar, Eliminar. |
| Form nueva sede | Input nombre + boton "+ Agregar sede" |
| Eliminar sede | Bloqueado si tiene unidades asociadas |

**Derecha: Nueva Unidad**

| Campo | Tipo |
|-------|------|
| Nombre | `<input>` |
| Sede | `<select>` (solo activas) |

Boton: "+ Crear unidad"

### 12.2 Filtros

| Filtro | Comportamiento |
|--------|----------------|
| Busqueda | Filtra por nombre de unidad o sede |
| Ver desactivadas | Checkbox. Default: no muestra inactivas |

Contador: "{N} unidades"

### 12.3 Grid de Unidades

Cards en grid auto-fill (min 280px):

| Parte | Contenido |
|-------|-----------|
| Header | ID badge (2 digitos, fondo azul) + nombre sede |
| Body | Nombre editable (input inline), Sede select (cambia sede en onChange) |
| Footer | Desactivar/Activar, Eliminar (con confirmacion) |

Inactivas: opacity 0.55.

**API:** GET/POST/PUT/DELETE para sedes y unidades.

---

## 13. Componentes Reutilizables

### 13.1 Modal

| Prop | Tipo | Default | Comportamiento |
|------|------|---------|----------------|
| open | boolean | - | Si false, no renderiza nada |
| title | string | - | Titulo en header del modal |
| onClose | function | - | Callback al cerrar |
| children | ReactNode | - | Contenido del modal |
| wide | boolean | false | Si true, max-width 760px (default 520px) |

**Comportamiento:** Cierra con Escape, click en overlay, o boton X. Bloquea scroll del body.

### 13.2 Pagination

| Prop | Tipo | Comportamiento |
|------|------|----------------|
| page | number | Pagina actual |
| lastPage | number | Total de paginas |
| onPageChange | function | Callback con nuevo numero de pagina |

Oculta si `lastPage <= 1`.

### 13.3 EmptyState

| Prop | Tipo | Opciones |
|------|------|----------|
| icon | string | "search", "inventory", "alert", "box" |
| title | string | Titulo principal |
| description | string | Texto descriptivo |
| action | ReactNode | Slot para boton u otro elemento |

### 13.4 Skeleton

| Prop | Tipo | Comportamiento |
|------|------|----------------|
| type | string | "table" o "card" |
| rows | number | Numero de filas placeholder |
| cols | number | Solo para type="table" |

Animacion pulse: opacidad 0.45 -> 0.8 en 1.4s.

### 13.5 Aviso (Error Banner)

| Prop | Tipo | Comportamiento |
|------|------|----------------|
| mensaje | string | Texto a mostrar. Si vacio, no renderiza nada. |
| onCerrar | function | Callback para cerrar. Se cierra automaticamente en 5 segundos. |

### 13.6 Image

| Prop | Tipo | Comportamiento |
|------|------|----------------|
| src | string | URL de imagen |
| alt | string | Texto alternativo |
| loading | string | Default: "lazy" |
| fallback | ReactNode | Contenido a mostrar en error |

Transicion de opacidad 0 -> 1 al cargar.

---

## 14. Sistema de Notificaciones (Toast)

### API

| Metodo | Parametro | Comportamiento |
|--------|-----------|----------------|
| `toast.success(message)` | string | Toast verde, auto-dismiss 3500ms |
| `toast.error(message)` | string | Toast rojo, auto-dismiss 3500ms |
| `toast.info(message)` | string | Toast azul, auto-dismiss 3500ms |

### Posicionamiento

- Desktop: fijo arriba-derecha
- Mobile: fijo abajo
- Max-width: 380px
- Animacion: slide-in desde la derecha (0.3s)
- Stack vertical con gap 8px

---

## 15. Sistema de Temas

### Dark (default)

| Variable | Valor |
|----------|-------|
| --color-text | #e8ecf1 |
| --color-bg | #1a1f2b |
| --color-white | #232937 |
| --color-border | #3a4150 |
| --shadow | 0 1px 3px rgba(0,0,0,0.4) |

### Light

| Variable | Valor |
|----------|-------|
| --color-text | #1a202c |
| --color-bg | #f7fafc |
| --color-white | #ffffff |
| --color-border | #e2e8f0 |
| --shadow | 0 1px 3px rgba(0,0,0,0.1) |

Se aplica via `data-theme="light"` en `<html>`. Persistido en `localStorage.sagi_theme`.

---

## 16. Matriz de Permisos por Rol

| Funcionalidad | admin | jefe | carga | consulta |
|---------------|-------|------|-------|----------|
| Ver Dashboard | Si | Si | Si | Si |
| Ver Inventario | Si | Si | Si | Si |
| Registrar item (alta) | Si | Si | Si | No |
| Editar item | Si | Si | Si | No |
| Eliminar item | Si | Si | Si | No |
| Ver detalle item | Si | Si | Si | Si |
| Ver motivo baja | Si | Si | No | No |
| Reactivar item | Si | Si | No | No |
| Ver Categorias | Si | No | No | No |
| Gestionar Categorias | Si | No | No | No |
| Ver Sedes/Unidades | Si | No | No | No |
| Gestionar Sedes/Unidades | Si | No | No | No |
| Ver Movimientos | Si | Si | Si | No |
| Solicitar movimiento | Si | Si | Si | No |
| Aprobar/Rechazar movimiento | Si | Si | No | No |
| Ver Reportes | Si | Si | No | No |
| Exportar Reportes | Si | Si | No | No |
| Ver Alertas | Si | Si | Si | No |
| Crear alerta | Si | Si | No | No |
| Cerrar alerta | Si | Si | No | No |
| Ver Auditoria | Si | Si | No | No |
| Exportar Auditoria | Si | Si | No | No |
| Cambiar contrasena | Si | Si | Si | Si |
| Cambiar tema | Si | Si | Si | Si |
| Cerrar sesion | Si | Si | Si | Si |

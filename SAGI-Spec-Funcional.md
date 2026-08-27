---
title: "SAGI - Spec Funcional por Elemento"
subtitle: "Inventario detallado de cada componente, elemento y comportamiento de la interfaz"
author: "Instituto de Seguridad Publica (ISeP)"
date: "26 de agosto de 2026"
version: "1.0"
---

# SAGI - Spec Funcional por Elemento

Inventario detallado de cada componente, elemento y comportamiento de la interfaz.

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

| Columna | Flex | Contenido |
|---------|------|-----------|
| Codigo | 1.4 | `item.codigo_unico` en `<strong>` |
| Categoria | 0.7 | `item.categoria.codigo` |
| Detalle | 2 | `formatValores(item)`: tipo_item + primeros 2 valores dinamicos |
| Estado | 0.6 | Badge color-coded: activo (verde), pendiente (naranja), baja (rojo) |
| Conservacion | 0.8 | Badge: Muy bueno (verde), Bueno (azul), Regular (naranja), Malo (rojo) |
| Cantidad | 0.4 | Numero |
| Unidad | 0.7 | `item.unidad.nombre` |
| Responsable | 0.9 | `item.responsable.name` |
| Acciones | 1.2 | Ver (siempre), Editar (admin/jefe/carga + no baja), Eliminar (admin/jefe/carga + no baja) |

**Fila:** Click abre modal detalle. Items baja: opacity 0.55. Hover: fondo azul claro.

### 4.4 Cards Mobile

Visible en <768px. Grid 1 columna (2 en >=480px):

| Parte | Contenido |
|-------|-----------|
| Header | Codigo + badge estado |
| Body | Detalle, categoria + unidad, conservacion + cantidad |
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
| Form agregar elemento | Input nombre + boton "+ Agregar" |

**Tabla de elementos:**

| Columna | Contenido |
|---------|-----------|
| # | Numero de orden |
| Elemento | `tipo.nombre` |
| Acciones | Orden (arriba/abajo), Editar, Eliminar |

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

| Campo | Tipo | Notas |
|-------|------|-------|
| Tipo | `<select>` | Alta, Traslado, Baja |
| Item | `<select>` | Items activos con codigo + nombre |
| Unidad destino | `<select>` | Solo si tipo = traslado |
| Motivo | `<input>` | Placeholder segun tipo |

**Botones:** Cancelar, Solicitar.

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
| Excel | `.xlsx` (multi-hoja por categoria) | `inventario-YYYY-MM-DD.xlsx` |
| CSV | `.csv` (UTF-8 BOM, delimitador ;) | `inventario-YYYY-MM-DD.csv` |
| PDF | `.pdf` (A4 landscape, autoTable) | `inventario-YYYY-MM-DD.pdf` |

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

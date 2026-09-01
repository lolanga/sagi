---
title: "SAGI - Manual de Usuario"
subtitle: "Sistema de Administración y Gestión de Inventarios"
author: "Instituto de Seguridad Pública (ISeP)"
date: "31 de agosto de 2026"
version: "3.4"
---

# SAGI - Manual de Usuario

**Sistema de Administración y Gestión de Inventarios**
Instituto de Seguridad Pública (ISeP)

Versión: 3.4 | Fecha: 31 de agosto de 2026

---

## Índice

1. Introducción
2. Requisitos del Sistema
3. Acceso al Sistema
4. Interfaz General
5. Dashboard
6. Gestión de Inventario
7. Gestión de Movimientos
8. Gestión de Alertas
9. Gestión de Categorías
10. Gestión de Sedes y Unidades
11. Reportes
12. Auditoría
13. Preguntas Frecuentes

---

## 1. Introducción

### 1.1 ¿Qué es SAGI?

SAGI (Sistema de Administración y Gestión de Inventarios) es una plataforma web para administrar y controlar los bienes muebles del Instituto de Seguridad Pública (ISeP).

| Funcionalidad | Descripción |
|---------------|-------------|
| Registro de ítems | Alta con campos dinámicos por categoría |
| Control de movimientos | Altas, traslados, bajas con aprobación |
| Reportes | Exportación a Excel, CSV, JSON |
| Auditoría | Registro completo de acciones |

### 1.2 ¿Quién puede usar SAGI?

| Rol | Funciones Principales |
|-----|----------------------|
| Administrador | Gestión completa del sistema, usuarios, categorías, sedes |
| Jefe de Área | Aprobar movimientos, ver reportes, gestionar alertas |
| Personal de Carga | Registrar ítems, solicitar movimientos |
| Personal de Consulta | Solo visualizar información |

---

## 2. Requisitos del Sistema

### 2.1 Navegador Web

| Navegador | Versión Mínima |
|-----------|----------------|
| Google Chrome | 90 o superior |
| Mozilla Firefox | 88 o superior |
| Microsoft Edge | 90 o superior |
| Safari | 14 o superior |

### 2.2 Otros Requisitos

| Requisito | Detalle |
|-----------|---------|
| Conexión a internet | Estable |
| Resolución mínima | 1024 x 768 píxeles |
| Dispositivo | Computador o móvil (responsive) |

---

## 3. Acceso al Sistema

### 3.1 Iniciar Sesión

1. Abra su navegador web
2. Ingrese la URL del sistema
3. Verá la pantalla de inicio de sesión

| Campo | Descripción |
|-------|-------------|
| DNI | Documento Nacional de Identidad |
| Contraseña | Contraseña asignada por el administrador |

4. Haga clic en **"Iniciar Sesión"**

### 3.2 Cerrar Sesión

1. Haga clic en su nombre de usuario (esquina superior derecha)
2. Seleccione **"Cerrar Sesión"**

### 3.3 ¿Olvidó su Contraseña?

Contacte al administrador del sistema para restablecerla.

---

## 4. Interfaz General

### 4.1 Elementos de la Pantalla

| Zona | Ubicación | Función |
|------|-----------|---------|
| Sidebar | Izquierda | Menú de navegación jerárquico con iconos |
| Topbar | Arriba | Título, botón de tema (oscuro/claro), usuario, cerrar sesión |
| Contenido | Centro | Página actual |
| Bottom Nav | Abajo (móvil) | Accesos rápidos a Operaciones e Inventario |

### 4.2 Menú Jerárquico

El menú se organiza en 4 bloques temáticos:

| Bloque | Módulos |
|--------|---------|
| **Operaciones** | Dashboard, Alertas |
| **Inventario** | Inventario, Movimientos |
| **Configuración** | Categorías, Sedes y Unidades |
| **Control** | Reportes, Auditoría |

### 4.3 Menú Según Rol

| Menú | Admin | Jefe | Carga | Consulta |
|------|:-----:|:----:|:-----:|:--------:|
| Dashboard | Si | Si | Si | Si |
| Alertas | Si | Si | Si | No |
| Inventario | Si | Si | Si | Si |
| Movimientos | Si | Si | Si | No |
| Categorías | Si | No | No | No |
| Sedes y Unidades | Si | No | No | No |
| Reportes | Si | Si | No | No |
| Auditoría | Si | Si | No | No |

### 4.4 Funcionalidades del Menú

- **Colapsar sidebar**: Click en el botón `‹` para maximizar área de trabajo
- **Expandir/colapsar grupos**: Click en el nombre del bloque temático
- **Active route**: La página actual se resalta en azul
- **Badge de alertas**: Muestra contador de alertas abiertas

### 4.5 Dispositivos Móviles

- **Bottom nav**: Accesos rápidos a Dashboard, Alertas, Inventario, Movimientos
- **Hamburguesa**: Abre el drawer con todos los módulos
- **Filtros colapsables**: Botón "Filtros" para expandir/ocultar
- **Cards**: Los ítems se muestran como tarjetas en lugar de tabla
- **Skeleton loading**: Animación de carga en lugar de texto

---

## 5. Dashboard

El Dashboard muestra un resumen del estado del inventario.

### 5.1 Tarjetas de Estadísticas

| Tarjeta | Descripción |
|---------|-------------|
| Total de Ítems | Cantidad total de ítems registrados |
| Ítems activos | Ítems en estado activo |
| Movimientos pendientes | Traslados o bajas esperando aprobación |
| Alertas activas | Alertas abiertas que requieren atención |

### 5.2 Gráficos

El Dashboard incluye dos gráficos interactivos:

| Gráfico | Tipo | Descripción |
|---------|------|-------------|
| Ítems por Categoría | Barras (Bar Chart) | Muestra la cantidad de ítems agrupados por categoría |
| Distribución General | Dona (Doughnut Chart) | Muestra la distribución porcentarial de ítems por estado |

### 5.3 Ítems por Categoría (Tabla)

Tabla con la cantidad de ítems agrupados por categoría:

| Columna | Descripción |
|---------|-------------|
| Código | Identificador de la categoría (A1, A2, etc.) |
| Categoría | Nombre completo |
| Ítems | Cantidad de ítems en esa categoría |

### 5.4 Backup de Base de Datos

**Solo administradores** tienen acceso a esta función.

1. Haga clic en el botón **"Backup"** en el Dashboard
2. El sistema creará un archivo SQL de respaldo
3. El archivo se descargará automáticamente

---

## 6. Gestión de Inventario

### 6.1 Ver Lista de Ítems

Haga clic en **"Inventario"** en el menú lateral.

**En escritorio:** Se muestra una tabla con columnas configurables.
**En móvil:** Se muestran tarjetas con la información del ítem.

| Columna | Descripción | Ancho |
|---------|-------------|-------|
| Código | Código único del ítem (ej: A1-03-47-000001) | 1.5 |
| Categoría | Código de categoría | 0.5 |
| Detalle | Campos dinámicos del ítem | 2.5 |
| Estado | Estado del ítem (activo/pendiente/baja) | 0.5 |
| Conservación | Estado de conservación | 0.7 |
| Cant. | Cantidad | 0.4 |
| Unidad | Unidad de destino | 0.5 |
| Responsable | Persona responsable | 0.7 |
| Motivo Baja | Razón de la baja (solo admin/jefe) | 0.8 |
| Acciones | Iconos de ver, editar, eliminar | 0.8 |

### 6.2 Configurar Columnas (Escritorio)

Debajo de los filtros verá una barra de pills con las columnas disponibles:

| Pill | Columna que controla |
|------|---------------------|
| Categoría | Oculta/muestra columna de categoría |
| Detalle | Oculta/muestra columna de detalle |
| Conservación | Oculta/muestra columna de conservación |
| Cant. | Oculta/muestra columna de cantidad |
| Unidad | Oculta/muestra columna de unidad |
| Responsable | Oculta/muestra columna de responsable |

**Las columnas Código, Estado y Acciones siempre están visibles.**

Su configuración se guarda automáticamente y se recuerda en su próxima visita.

### 6.3 Buscar Ítems

| Filtro | Uso |
|--------|-----|
| Campo de búsqueda | Buscar por código, estado conservación, estado, valores dinámicos, categoría, elemento, unidad o responsable. Use el botón "×" para limpiar. |
| Categoría (desplegable) | Filtrar por categoría específica |
| Estado (desplegable) | Filtrar por estado: Activo, Pendiente, Baja o Todos |

**Nota:** Al cambiar búsqueda, categoría o estado, la paginación vuelve a la página 1.

### 6.4 Registrar Nuevo Ítem (Alta)

1. Haga clic en **"+ Registrar alta"**
2. Complete el formulario:

| Campo | Requerido | Descripción |
|-------|:---------:|-------------|
| Categoría | Si | Seleccione la categoría |
| Elemento | Si | Tipo de elemento (según categoría) |
| Estado conservación | Si | Muy bueno, Bueno, Regular, Malo |
| Cantidad | Si | Número de unidades |
| Fecha de alta | No | Fecha de incorporación (puede marcar "Desocida") |
| Unidad de destino | Si | Unidad organizacional |
| Motivo de alta | Si | Razón del registro |
| Campos dinámicos | Variable | Según categoría seleccionada |

3. Haga clic en **"Registrar"**
4. El sistema genera automáticamente:
   - Código único (ej: A1-03-47-000001)
   - Movimiento de alta aprobado
   - Registro de auditoría

### 6.5 Ver Detalle de un Ítem

1. Haga clic en **"Ver"** en la columna de Acciones
2. Verá información completa del ítem:

| Sección | Contenido |
|---------|-----------|
| Datos del Ítem | Código, categoría, elemento, estado, conservación, cantidad, unidad, responsable, fecha |
| Detalles Adicionales | Campos dinámicos específicos de la categoría |
| Historial | Timeline unificado de movimientos (altas, traslados, bajas) y ediciones del ítem |

**Historial unificado:** El timeline muestra tanto los movimientos del ítem como las ediciones realizadas, ordenados cronológicamente. Las ediciones se identifican con un badge azul y muestran qué campos cambiaron.

### 6.6 Editar un Ítem

1. Haga clic en **"Editar"** en la columna de Acciones
2. Modifique los campos que desee
3. Haga clic en **"Guardar"**

### 6.7 Eliminar un Ítem

**Solo administradores** pueden eliminar ítems.

1. Haga clic en **"Eliminar"** en la columna de Acciones
2. Confirme la eliminación

**Nota:** El ítem será eliminado permanentemente. Sus movimientos se conservarán como históricos.

---

## 7. Gestión de Movimientos

Los movimientos registran los cambios de ubicación o estado de los ítems.

### 7.1 Tipos de Movimiento

| Tipo | Descripción |
|------|-------------|
| Traslado | Cambio de unidad de destino |
| Baja | Retiro del inventario |

**Nota:** El alta de ítems se realiza desde **Inventario > Registrar alta**.

### 7.2 Ver Lista de Movimientos

Haga clic en **"Movimientos"** en el menú lateral.

| Filtro | Opciones |
|--------|----------|
| Tipo | Traslado, Baja |
| Estado | Pendiente, Aprobado, Rechazado |

| Columna | Descripción |
|---------|-------------|
| Fecha | Fecha del movimiento |
| Tipo | Traslado o Baja |
| Ítem | Código del ítem afectado |
| Origen → Destino | Unidades involucradas |
| Estado | Pendiente, Aprobado o Rechazado |
| Solicitante | Quien realizó la solicitud |
| Acciones | Aprobar / Rechazar (solo pendientes) |

### 7.3 Solicitar Traslado

1. Haga clic en **"+ Nueva solicitud"**
2. Seleccione **"Traslado"**
3. Seleccione el **ítem** a trasladar (use el campo de búsqueda)
4. Seleccione la **unidad de destino**
5. Ingrese el **motivo**
6. Haga clic en **"Solicitar"**

**Nota:** Se creará una alerta para aprobación.

### 7.4 Solicitar Baja

1. Haga clic en **"+ Nueva solicitud"**
2. Seleccione **"Baja"**
3. Seleccione el **ítem**
4. Ingrese el **motivo**
5. Haga clic en **"Solicitar"**

**Nota:** La baja tiene prioridad crítica. La solicitud de baja generará una alerta automáticamente para que un administrador o jefe la revise y apruebe.

### 7.5 Protección contra movimientos duplicados

El sistema previene que se creen múltiples movimientos pendientes para el mismo ítem:

- Al abrir el formulario de nueva solicitud, se cargan los movimientos pendientes
- Al buscar un ítem, los que ya tienen un movimiento pendiente muestran un tag **"⚠ Pendiente"** al lado
- Al seleccionar un ítem con movimiento pendiente, se muestra un **aviso amarillo** indicando el tipo de movimiento y quién lo solicitó
- Si intenta guardar, el sistema **bloquea** la solicitud y muestra un error explicativo

**Esto garantiza que no se puedan crear traslados o bajas simultáneos sobre el mismo ítem hasta que el primero se resuelva.**

### 7.5 Aprobar o Rechazar Movimiento

**Solo administradores y jefes.**

1. Busque el movimiento con estado **"Pendiente"**
2. Haga clic en **"Aprobar"** o **"Rechazar"**

| Acción | Resultado |
|--------|-----------|
| Aprobar traslado | Cambia la unidad del ítem |
| Aprobar baja | Estado del ítem = "baja", categoría = A8 |
| Rechazar | Se registra motivo, movimiento queda como rechazado |

---

## 8. Gestión de Alertas

### 8.1 Tipos de Alerta

| Tipo | Descripción | Prioridad |
|------|-------------|-----------|
| Pendiente de aprobación | Movimiento esperando revisión | Importante |
| Pendiente de movimiento | Alerta del sistema | Importante |
| Manual | Creada por un usuario | Variable |

### 8.2 Prioridades

| Prioridad | Descripción |
|-----------|-------------|
| Crítica | Requiere atención inmediata (bajas) |
| Importante | Requiere atención pronto (traslados) |
| Informativa | Solo informativa |

### 8.3 Ver Alertas

Haga clic en **"Alertas"** en el menú lateral.

| Filtro | Opciones |
|--------|----------|
| Estado | Abiertas, Cerradas |

| Columna | Descripción |
|---------|-------------|
| Fecha | Creación de la alerta |
| Prioridad | Crítica, Importante, Informativa |
| Mensaje | Descripción de la alerta |
| Ítem | Ítem relacionado (si aplica) |
| Estado | Abierta o Cerrada |

### 8.4 Crear Alerta Manual (Admin/Jefe)

1. Haga clic en **"+ Nueva alerta"**
2. Complete el formulario:

| Campo | Descripción |
|-------|-------------|
| Mensaje | Descripción de la alerta |
| Prioridad | Crítica, Importante o Informativa |
| Unidad | Unidad afectada |
| Ítem | Opcional, ítem relacionado |

3. Haga clic en **"Crear"**

### 8.5 Cerrar Alerta (Admin/Jefe)

1. Busque la alerta abierta
2. Haga clic en **"Cerrar"**

---

## 9. Gestión de Categorías

**Solo administradores pueden acceder.**

### 9.1 Panel de Categorías

| Zona | Contenido |
|------|-----------|
| Lista de categorías | Seleccionar categoría para ver/editar |
| Campos dinámicos | Crear, editar, reordenar campos |
| Elementos | Crear, editar, reordenar tipos de ítem |

### 9.2 Crear Categoría

1. En el formulario inferior, ingrese:
   - **Código** (ej: A9)
   - **Nombre**
2. Haga clic en **"Crear"**

### 9.3 Gestionar Campos Dinámicos

**Crear campo:**
1. Seleccione la categoría
2. Seleccione el **ámbito** (General o elemento específico)
3. Haga clic en **"+ Nuevo campo"**
4. Configure:

| Campo | Descripción |
|-------|-------------|
| Nombre | Nombre del campo |
| Tipo | texto, numero, fecha, select, textarea |
| Opciones | Para tipo "select", separadas por comas |
| Requerido | Si es obligatorio |

5. Haga clic en **"Crear"**

**Editar campo:**
1. Haga clic en **"Editar"**
2. Modifique los datos
3. Haga clic en **"Guardar"**

**Reordenar:**
Use las flechas **↑** y **↓** para cambiar el orden.

### 9.4 Gestionar Elementos

Los elementos son los tipos de ítems dentro de cada categoría (ej: "Computadora", "Escritorio", "Silla" dentro de la categoría A1).

#### Crear elemento (paso a paso)

1. Seleccione la categoría en el panel izquierdo
2. Haga clic en **"+ Nuevo elemento"**
3. Se abre el wizard de creación en **2 pasos**:

**Paso 1 — Introducción:**
- Se muestra un resumen indicando que se creará un nuevo tipo de elemento en la categoría seleccionada
- Haga clic en **"Comenzar →"** para avanzar

**Paso 2 — Configuración:**
El paso 2 tiene un layout de dos columnas:

*Columna izquierda (Formulario):*

| Campo | Descripción |
|-------|-------------|
| Nombre del elemento * | Nombre del tipo de elemento (ej: "Computadora de escritorio") |
| Info de campos fijos | Aviso indicando que Categoría, Elemento, Estado de conservación, Cantidad, Fecha de alta y Unidad de destino ya existen en el formulario de alta |
| Campos adicionales | Campos personalizados que apliquen a este elemento específico |

*Columna derecha (Vista previa):*
- Muestra en tiempo real cómo quedará el elemento con todos sus campos
- Se actualiza automáticamente al escribir el nombre o agregar campos
- Los campos fijos aparecen con valores de ejemplo
- Los campos adicionales muestran el tipo de dato esperado (select muestra primera opción, fecha muestra dd/mm/aaaa, etc.)

**Agregar campos adicionales:**

1. Haga clic en **"+ Agregar campo"**
2. Complete:
   - **Nombre del campo** (ej: "Marca", "Modelo", "Número de serie")
   - **Tipo**: texto, numero, fecha, select, textarea
   - **Opciones** (solo para tipo select): separadas por coma (ej: "Samsung, LG, Dell")
   - **Requerido**: marca si el campo es obligatorio
3. El campo aparece inmediatamente en la vista previa
4. Repita para cada campo adicional que necesite

3. Haga clic en **"Crear elemento"**

#### Editar elemento

1. Haga clic en **"Editar"** en la tabla de elementos
2. Modifique el nombre
3. Haga clic en **"Guardar"**

#### Reordenar elementos

Use las flechas **↑** y **↓** para cambiar el orden en la lista.

---

## 10. Gestión de Sedes y Unidades

**Solo administradores pueden acceder.**

La página se organiza en dos pestañas: **Sedes** y **Unidades de destino**.

### 10.1 Sedes (Pestaña "Sedes")

Las sedes representan las ubicaciones físicas del instituto. Se muestran como tarjetas con badge de ID, estado y contador de unidades.

| Acción | Descripción |
|--------|-------------|
| Crear sede | Haga clic en "+ Nueva sede", ingrese nombre en el modal y confirme |
| Editar sede | Haga clic en el icono ✎ en la tarjeta, modifique nombre en el modal |
| Desactivar | Haga clic en 👁 para desactivar (la sede aparece con borde punteado) |
| Activar | Haga clic en 🚫 para reactivar |
| Eliminar | Haga clic en 🗑, confirme en el modal (no se puede eliminar si tiene unidades) |

**Filtros:**
- **Buscar**: Filtra sedes por nombre
- **Ver desactivadas**: Incluye sedes inactivas en la lista

### 10.2 Unidades (Pestaña "Unidades de destino")

Las unidades son departamentos o áreas dentro de cada sede. Se muestran **agrupadas por sede** en secciones colapsables (accordion), reduciendo el scroll.

| Elemento | Descripción |
|----------|-------------|
| Encabezado de grupo | Nombre de la sede + contador de unidades, clic para expandir/colapsar |
| Fila de unidad | ID, nombre, badge de estado, acciones |

**Crear unidad:**
1. Haga clic en **"+ Nueva unidad"**
2. Ingrese el **nombre** en el modal
3. Seleccione la **sede** del desplegable
4. Haga clic en **"Crear unidad"**

**Editar unidad:**
1. Haga clic en el icono **✎** en la fila de la unidad
2. Modifique nombre y/o sede en el modal
3. Haga clic en **"Guardar"**

**Otras acciones:**
- **Desactivar/Activar**: Icono 👁 / 🚫 en la fila
- **Eliminar**: Icono 🗑, confirma en modal

**Filtros:**
- **Buscar**: Filtra por nombre de unidad o nombre de sede
- **Ver desactivadas**: Incluye unidades inactivas

---

## 11. Reportes

**Solo administradores y jefes pueden acceder.**

### 11.1 Tipos de Reporte

| Reporte | Contenido |
|---------|-----------|
| Por Categoría | Código, nombre, cantidad de ítems |
| Por Estado | Estado de conservación, cantidad |
| Por Sede | Sede, cantidad |
| Por Unidad | Unidad, cantidad |
| Por Elemento | Los 20 elementos más frecuentes |
| Movimientos | Movimientos por mes (últimos 6 meses) |

### 11.2 Exportar Datos

| Formato | Botón | Contenido |
|---------|-------|-----------|
| Formato Oficial (.xlsx) | "Formato Oficial" | Archivo institucional con 10 hojas (A1-A8, B1-B2), encabezados oficiales y datos del inventario |
| Excel (.xlsx) | "Excel" | Hoja por categoría con campos dinámicos |
| CSV | "CSV" | Todos los ítems, separado por comas |
| PDF | "PDF" | Reportes generados con formato tabular usando jsPDF |

#### Formato Oficial

El botón **"Formato Oficial"** genera un archivo `.xlsx` que sigue el formato institucional del ISeP:

| Hoja | Contenido |
|------|-----------|
| A1 | Amoblamiento y útiles (mobiliario, equipamiento de oficina) |
| A2 | Artefactos eléctricos (aires, heladeras, estufas) |
| A3 | Equipo de radiocomunicación, telefonía e informática |
| A4 | Armamento, municiones y equipo de protección |
| A5 | Máquinas y herramientas |
| A6 | Vehículos |
| A7 | Altas (todos los ítems activos como registros de alta) |
| A8 | Bajas (ítems dados de baja con motivo y fecha) |
| B1 | Propiedad provincial (solo encabezados) |
| B2 | Propiedad no provincial (solo encabezados) |

Cada hoja incluye:
- **Fila 1**: Título de la hoja (ej: "A1 - AMOBLAMIENTO Y UTILES")
- **Fila 2**: "DEPENDENCIA: División Secretaría General, sede Rosario."
- **Fila 3**: "DIRECCION / UNIDAD REGIONAL: I.Se.P."
- **Fila 4**: Encabezados de columnas (según formato institucional)
- **Filas 5+**: Datos del inventario

**Nota:** Las hojas B1 y B2 solo contienen encabezados ya que no hay datos de propiedad en el sistema.

---

## 12. Auditoría

**Solo administradores y jefes pueden acceder.**

### 12.1 ¿Qué se Registra?

| Categoría | Acciones |
|-----------|----------|
| Sesiones | login |
| Ítems | crear, editar, eliminar |
| Categorías | crear, editar, eliminar |
| Campos dinámicos | crear, editar, eliminar, mover |
| Tipos de ítem | crear, editar, eliminar, mover |
| Sedes | crear, editar, eliminar, activar, desactivar |
| Unidades | crear, editar, eliminar, activar, desactivar |
| Movimientos | solicitar, aprobar, rechazar |
| Alertas | crear, cerrar |

### 12.2 Ver Registro

Haga clic en **"Auditoría"** en el menú lateral.

| Filtro | Opciones |
|--------|----------|
| Entidad | Item, Categoria, CampoDinamico, etc. |
| Acción | crear, editar, eliminar, aprobar, etc. |

| Columna | Descripción |
|---------|-------------|
| Fecha | Fecha y hora de la acción |
| Usuario | Quién realizó la acción |
| Acción | Tipo de acción realizada |
| Entidad | Entidad afectada |
| Detalle | Muestra solo los campos que cambiaron, con nombres legibles |

**Ejemplos de detalle:**
- Ítem editado: `A1-08-15-000001 — N° Serie: no visible → SA1243FDSA`
- Traslado: `Traslado de A1-08-15-000001: Recreo → Rosario`
- Sede activada: `Sede Central — Activa: false → true`
- Unidad creada: `Unidad "Recreo" creada en Sede Central`

**Paginación:** Use el selector de cantidad (10/25/50) y los botones de navegación para recorrer los registros.

### 12.3 Exportar Auditoría

| Formato | Botón |
|---------|-------|
| Excel | "Exportar Excel" |
| JSON | "Exportar JSON" |

---

## 13. Preguntas Frecuentes

### ¿Cómo cambio el tema de la interfaz?

Haga clic en el botón de tema (sol/luna) en la barra superior para alternar entre modo oscuro y claro. Su preferencia se guarda automáticamente.

### ¿Por qué no veo ciertas opciones?

Las opciones dependen de su rol. Solicite acceso al administrador.

### ¿Cómo funciona el código único?

**Formato:** `Categoría-Sede-Unidad-Secuencial`

**Ejemplo:** `A1-03-47-000001`

| Parte | Significado |
|-------|-------------|
| A1 | Categoría (Equipamiento Tecnológico) |
| 03 | ID de Sede |
| 47 | ID de Unidad |
| 000001 | Secuencial |

### ¿Puedo recuperar un ítem eliminado?

No, la eliminación es permanente. Sin embargo, los movimientos asociados se conservan como históricos. Debe crear uno nuevo si desea restaurar el registro.

### ¿Qué pasa si rechazo un movimiento?

El movimiento queda registrado como rechazado. El ítem mantiene su ubicación.

### ¿Puedo crear ítems sin fecha?

Sí, marque la casilla "Fecha desconocida".

### ¿Cómo creo campos personalizados?

Vaya a **Categorías** (solo admin), seleccione la categoría y haga clic en **"+ Nuevo campo"**.

### ¿Las sedes inactivas afectan el inventario?

No, solo desaparecen de los formularios de selección.

### ¿Cómo funciona la paginación?

Los ítems se muestran 25 por página (configurable: 10/25/50). Use "Anterior" y "Siguiente" para navegar. Su preferencia se guarda automáticamente.

---

## Changelog

### v3.4 (31 agosto 2026)

#### Wizard de Elementos (Categorías)
- **Paso 1 simplificado**: Solo muestra introducción con la categoría y botón "Comenzar"
- **Paso 2 mejorado**: Nombre del elemento + campos adicionales + vista previa en tiempo real
- **Vista previa**: Layout de dos columnas con tarjeta que muestra cómo quedará el elemento mientras se configura
- **Campos fijos visibles**: Se muestran los campos que ya existen en el formulario de alta

#### Movimientos
- **Protección contra duplicados**: Detección de movimientos pendientes por ítem
- **Tag visual**: Ítems con movimiento pendiente muestran "⚠ Pendiente" en los resultados de búsqueda
- **Bloqueo de submit**: No se puede crear un movimiento si ya existe uno pendiente para el mismo ítem
- **Tipo "Alta" desactivado**: El alta de ítems se realiza desde Inventario, no desde Movimientos

#### Dashboard
- **Botón Backup**: Los administradores pueden descargar un respaldo de la base de datos en formato SQL

#### Reportes - Formato Oficial
- **Nueva exportación**: Botón "Formato Oficial" genera archivo .xlsx con 10 hojas (A1-A8, B1-B2)
- **Encabezados institucionales**: Cada hoja incluye título, dependencia y dirección en las primeras 3 filas

#### Sidebar
- **Badge de alertas**: Muestra contador de alertas abiertas en el menú lateral

#### Correcciones
- **Headers en modo claro**: Texto de headers de tablas ahora es legible (color blanco sobre fondo oscuro)
- **Badge mover**: Corregido color de texto en badge de tipo de movimiento

### v3.3 (27 agosto 2026)

#### Sedes y Unidades
- **Tabs**: Separador visual "Sedes" / "Unidades de destino"
- **Cards de Sedes**: Tarjetas con badge ID, estado (Activa/Inactiva) y contador de unidades
- **Accordion de Unidades**: Unidades agrupadas por sede en secciones colapsables
- **Modales**: Crear, editar y eliminar en ventana modal (consistente con el resto de la app)
- **Toast notifications**: Confirmación visual en cada acción
- **Skeleton loading**: Animación de carga mientras se obtienen datos
- **Empty state**: Mensaje ilustrado cuando no hay datos

#### Auditoría
- **Nombres legibles**: Todos los IDs se muestran como nombres reales (ej: "Recreo" en vez de "5")
- **Detalle del ítem**: Al editar, se muestra el código del ítem (ej: "A1-08-15-000001 — ...")
- **Campos dinámicos**: Solo se muestran los campos que cambiaron, con sus nombres reales
- **Sedes/Unidades**: El detalle incluye el nombre de la entidad modificada

#### Dashboard
- **Doughnut con cifras**: Los valores y porcentajes se muestran directamente en el gráfico

#### Favicon y branding
- **Favicon**: Icono personalizado con "S" sobre fondo azul en la pestaña del navegador
- **Título**: La pestaña muestra "Inventario ISeP"
- **Sidebar**: Encabezado muestra "SAGI ISeP"

### v3.2 (27 agosto 2026)

#### Inventario
- **Filtro por estado**: Nuevo desplegable para filtrar por Activo, Pendiente, Baja o Todos
- **Eliminar restringido**: Solo administradores pueden eliminar ítems
- **Movimientos preservados**: Al eliminar un ítem, sus movimientos se conservan como históricos

#### Auditoría
- **Detalle mejorado**: Solo muestra los campos que cambiaron en cada edición (diff antes/después)
- **Paginación mejorada**: Selector de cantidad de registros (10/25/50) reemplaza paginación simple

#### Historial del Ítem
- **Timeline unificado**: Combina movimientos (altas, traslados, bajas) y ediciones en un solo historial
- **Ediciones visibles**: Las ediciones del ítem aparecen con badge azul mostrando qué campos cambiaron
- **Orden cronológico**: Todos los eventos se muestran de más reciente a más antiguo

#### Responsive
- **Modal mejorado**: Se ajusta al alto de la pantalla en desktop, tablet y móvil
- **Navegación visible**: Botón "Cerrar" siempre visible en todos los tamaños de pantalla
- **Tabla optimizada**: Iconos de acciones más compactos, mejor uso del espacio

### v3.0 (26 agosto 2026)

#### Nuevas Funcionalidades
- **Columnas configurables**: Muestre/oculte columnas en la tabla de inventario con pills clickeables
- **Búsqueda mejorada**: Botón "×" para limpiar búsqueda rápidamente
- **Anchos proporcionales**: Columnas con anchos adaptables (Detalle más ancho, Cantidad más estrecho)
- **Carga rápida**: Las páginas se cargan bajo demanda (más ágil)
- **Imágenes optimizadas**: Las imágenes cargan solo cuando son visibles

#### Mejoras de UX
- **Filtros resetean paginación**: Al buscar o filtrar, vuelve a página 1 automáticamente
- **Tabla responsive**: Se adapta al tamaño de pantalla automáticamente
- **Mejor accesibilidad**: Descripciones para lectores de pantalla en toda la app

### v2.0 (26 agosto 2026)

#### Nuevas Funcionalidades
- **Sidebar jerárquico**: Menú organizado en 4 bloques temáticos
- **Iconos SVG**: Cada módulo tiene un icono visual
- **Sidebar colapsable**: Maximice el área de trabajo con el botón `‹`
- **Bottom nav en móvil**: Accesos rápidos a las funciones principales
- **Active route**: La página actual se resalta automáticamente
- **Badge de alertas**: Contador de alertas abiertas en el menú
- **Skeleton loading**: Animación de carga moderna
- **Empty states ilustrados**: Mensajes vacíos con iconos SVG
- **Toast notifications**: Confirmaciones emergentes para acciones
- **Ordenar columnas**: Click en encabezados de tabla para ordenar

#### Mejoras de UX
- **Cards en móvil**: Ítems como tarjetas en lugar de tabla
- **Filtros colapsables**: Ocultar/mostrar filtros en móvil
- **Sticky header**: Encabezado de tabla fijo al hacer scroll
- **Touch area mejorado**: Botones mínimo 44x44px en móvil

---

*Manual de Usuario - SAGI v3.4*
*Fecha: 31 de agosto de 2026*
*Instituto de Seguridad Pública*

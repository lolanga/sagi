---
title: "SAGI - Manual de Usuario"
subtitle: "Sistema de Administración y Gestión de Inventarios"
author: "Instituto de Seguridad Pública (ISeP)"
date: "26 de agosto de 2026"
version: "2.0"
---

# SAGI - Manual de Usuario

**Sistema de Administración y Gestión de Inventarios**
Instituto de Seguridad Pública (ISeP)

Versión: 2.0 | Fecha: 26 de agosto de 2026

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
| Topbar | Arriba | Título, botón de tema (oscuro/claro), usuario, cambio de contraseña, cerrar sesión |
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

| Columna | Descripción |
|---------|-------------|
| Código | Código único del ítem (ej: A1-03-47-000001) |
| Categoría | Código de categoría |
| Detalle | Campos dinámicos del ítem |
| Estado | Estado de conservación |
| Cant. | Cantidad |
| Unidad | Unidad de destino |
| Responsable | Persona responsable |
| Acciones | Botones de acción |

### 6.2 Buscar Ítems

| Filtro | Uso |
|--------|-----|
| Campo de búsqueda | Buscar por código, detalle, unidad de destino o responsable |
| Categoría (desplegable) | Filtrar por categoría específica |

### 6.3 Registrar Nuevo Ítem (Alta)

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

### 6.4 Ver Detalle de un Ítem

1. Haga clic en **"Ver"** en la columna de Acciones
2. Verá información completa del ítem:

| Sección | Contenido |
|---------|-----------|
| Datos del Ítem | Código, categoría, elemento, estado, conservación, cantidad, unidad, responsable, fecha |
| Detalles Adicionales | Campos dinámicos específicos de la categoría |
| Historial de Movimientos | Timeline visual de todos los movimientos del ítem |

### 6.5 Editar un Ítem

1. Haga clic en **"Editar"** en la columna de Acciones
2. Modifique los campos que desee
3. Haga clic en **"Guardar"**

### 6.6 Eliminar un Ítem

1. Haga clic en **"Eliminar"** en la columna de Acciones
2. Confirme la eliminación

**Nota:** La eliminación es permanente y eliminará los movimientos asociados.

---

## 7. Gestión de Movimientos

Los movimientos registran los cambios de ubicación o estado de los ítems.

### 7.1 Tipos de Movimiento

| Tipo | Descripción |
|------|-------------|
| Alta | Registro inicial de un ítem |
| Traslado | Cambio de unidad de destino |
| Baja | Retiro del inventario |

### 7.2 Ver Lista de Movimientos

Haga clic en **"Movimientos"** en el menú lateral.

| Filtro | Opciones |
|--------|----------|
| Tipo | Alta, Traslado, Baja |
| Estado | Pendiente, Aprobado, Rechazado |

| Columna | Descripción |
|---------|-------------|
| Fecha | Fecha del movimiento |
| Tipo | Alta, Traslado o Baja |
| Ítem | Código del ítem afectado |
| Origen → Destino | Unidades involucradas |
| Estado | Pendiente, Aprobado o Rechazado |
| Solicitante | Quien realizó la solicitud |
| Acciones | Aprobar / Rechazar (solo pendientes) |

### 7.3 Solicitar Traslado

1. Haga clic en **"+ Nueva solicitud"**
2. Seleccione **"Traslado"**
3. Seleccione el **ítem** a trasladar
4. Seleccione la **unidad de destino**
5. Ingrese el **motivo**
6. Haga clic en **"Registrar"**

**Nota:** Se creará una alerta para aprobación.

### 7.4 Solicitar Baja

1. Haga clic en **"+ Nueva solicitud"**
2. Seleccione **"Baja"**
3. Seleccione el **ítem**
4. Ingrese el **motivo**
5. Haga clic en **"Registrar"**

**Nota:** La baja tiene prioridad crítica.

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

**Crear elemento:**
1. Seleccione la categoría
2. Haga clic en **"+ Nuevo elemento"**
3. Ingrese el **nombre**
4. Haga clic en **"Crear"**

**Editar elemento:**
1. Haga clic en **"Editar"**
2. Modifique el nombre
3. Haga clic en **"Guardar"**

---

## 10. Gestión de Sedes y Unidades

**Solo administradores pueden acceder.**

### 10.1 Sedes

Las sedes representan las ubicaciones físicas del instituto.

| Acción | Descripción |
|--------|-------------|
| Crear sede | Ingrese nombre en "Nueva Sede" y haga clic en "Crear" |
| Editar sede | Modifique el nombre directamente en el campo de texto |
| Desactivar | Haga clic en "Desactivar" (no aparece en formularios) |
| Activar | Haga clic en "Activar" para habilitar nuevamente |

### 10.2 Unidades

Las unidades son departamentos o áreas dentro de cada sede.

| Columna | Descripción |
|---------|-------------|
| IdUnidad | Identificador de la unidad |
| Sede | Sede a la que pertenece |
| Nombre | Nombre de la unidad |
| Activo | Estado de la unidad |
| Acciones | Desactivar, Eliminar |

**Crear unidad:**
1. Haga clic en **"+ Nueva unidad"**
2. Seleccione la **sede**
3. Ingrese el **nombre**
4. Haga clic en **"Crear"**

**Editar unidad:**
- Modifique el nombre directamente en el campo de texto

**Filtros:**

| Filtro | Descripción |
|--------|-------------|
| Buscar | Filtrar por nombre |
| Ver inactivas | Incluir unidades desactivadas |

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
| Excel (.xlsx) | "Exportar Excel" | Hoja por categoría con campos dinámicos |
| CSV | "Exportar CSV" | Todos los ítems, separado por comas |
| PDF | "Exportar PDF" | Reportes generados con formato tabular usando jsPDF |

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
| Detalle | Información adicional |

**Paginación:** Use los botones **"Anterior"** y **"Siguiente"** para navegar entre páginas de registros.

### 12.3 Exportar Auditoría

| Formato | Botón |
|---------|-------|
| Excel | "Exportar Excel" |
| JSON | "Exportar JSON" |

---

## 13. Preguntas Frecuentes

### ¿Cómo cambio mi contraseña?

1. Haga clic en su nombre de usuario en la esquina superior derecha
2. Seleccione **"Cambiar Contraseña"**
3. Ingrese su contraseña actual
4. Ingrese la nueva contraseña y confírmela
5. Haga clic en **"Guardar"**

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

No, la eliminación es permanente. Debe crear uno nuevo.

### ¿Qué pasa si rechazo un movimiento?

El movimiento queda registrado como rechazado. El ítem mantiene su ubicación.

### ¿Puedo crear ítems sin fecha?

Sí, marque la casilla "Fecha desconocida".

### ¿Cómo creo campos personalizados?

Vaya a **Categorías** (solo admin), seleccione la categoría y haga clic en **"+ Nuevo campo"**.

### ¿Las sedes inactivas afectan el inventario?

No, solo desaparecen de los formularios de selección.

### ¿Cómo funciona la paginación?

Los ítems se muestran 20 por página. Use "Anterior" y "Siguiente" para navegar.

---

## Changelog v2.0

### Nuevas Funcionalidades
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

### Mejoras de UX
- **Cards en móvil**: Ítems como tarjetas en lugar de tabla
- **Filtros colapsables**: Ocultar/mostrar filtros en móvil
- **Sticky header**: Encabezado de tabla fijo al hacer scroll
- **Touch area mejorado**: Botones mínimo 44x44px en móvil

---

*Manual de Usuario - SAGI v2.0*
*Fecha: 26 de agosto de 2026*
*Instituto de Seguridad Pública*

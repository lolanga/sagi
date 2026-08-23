# SAGI - Manual de Usuario

**Sistema de Administración y Gestión de Inventarios**
Instituto de Seguridad Pública (ISeP)

Versión: 1.0
Fecha: 23 de agosto de 2026

---

## Índice

1. [Introducción](#1-introducción)
2. [Requisitos del Sistema](#2-requisitos-del-sistema)
3. [Acceso al Sistema](#3-acceso-al-sistema)
4. [Interfaz General](#4-interfaz-general)
5. [Dashboard](#5-dashboard)
6. [Gestión de Inventario](#6-gestión-de-inventario)
7. [Gestión de Movimientos](#7-gestión-de-movimientos)
8. [Gestión de Alertas](#8-gestión-de-alertas)
9. [Gestión de Categorías](#9-gestión-de-categorías)
10. [Gestión de Sedes y Unidades](#10-gestión-de-sedes-y-unidades)
11. [Reportes](#11-reportes)
12. [Auditoría](#12-auditoría)
13. [Preguntas Frecuentes](#13-preguntas-frecuentes)

---

## 1. Introducción

### 1.1 ¿Qué es SAGI?

SAGI (Sistema de Administración y Gestión de Inventarios) es una plataforma web diseñada para administrar y controlar los bienes muebles del Instituto de Seguridad Pública (ISeP). Permite:

- Registrar y mantener un inventario actualizado de todos los bienes
- Controlar los movimientos de los ítems (altas, traslados, bajas)
- Generar reportes para la toma de decisiones
- Mantener un registro completo de todas las acciones realizadas

### 1.2 ¿Quién puede usar SAGI?

| Rol | Funciones Principales |
|-----|----------------------|
| **Administrador** | Gestión completa del sistema, usuarios, categorías, sedes |
| **Jefe de Área** | Aprobar movimientos, ver reportes, gestionar alertas |
| **Personal de Carga** | Registrar ítems, solicitar movimientos |
| **Personal de Consulta** | Solo visualizar información |

---

## 2. Requisitos del Sistema

### 2.1 Navegador Web

SAGI funciona en cualquier navegador moderno:

- Google Chrome (versión 90 o superior)
- Mozilla Firefox (versión 88 o superior)
- Microsoft Edge (versión 90 o superior)
- Safari (versión 14 o superior)

### 2.2 Conexión a Internet

Se requiere una conexión a internet estable para acceder al sistema.

### 2.3 Resolución de Pantalla

Se recomienda una resolución mínima de **1024 x 768 píxeles**. El sistema es responsive y se adapta a dispositivos móviles.

---

## 3. Acceso al Sistema

### 3.1 Iniciar Sesión

1. Abra su navegador web
2. Ingrese la URL del sistema: `http://localhost:5173` (desarrollo) o la URL de producción
3. Verá la pantalla de inicio de sesión

```
┌─────────────────────────────────────┐
│           SAGI                      │
│   Sistema de Administración y       │
│   Gestión de Inventarios            │
│                                     │
│   DNI: [_____________]              │
│   Contraseña: [_____________]       │
│                                     │
│         [Iniciar Sesión]            │
└─────────────────────────────────────┘
```

4. Ingrese su **DNI** (Documento Nacional de Identidad)
5. Ingrese su **contraseña**
6. Haga clic en **"Iniciar Sesión"**

### 3.2 Cerrar Sesión

1. Haga clic en su nombre de usuario en la esquina superior derecha
2. Seleccione **"Cerrar Sesión"**

### 3.3 ¿Olvidó su Contraseña?

Si olvidó su contraseña, contacte al administrador del sistema para que pueda restablecerla.

---

## 4. Interfaz General

### 4.1 Layout de la Aplicación

Una vez que inicie sesión, verá la siguiente estructura:

```
┌──────────┬────────────────────────────────────────────┐
│          │  ☰  Título de Página     Usuario  [Salir] │
│ SAGI     ├────────────────────────────────────────────┤
│          │                                            │
│ Dashboard│           Contenido Principal              │
│ Inventario│                                          │
│ Movim.   │                                            │
│ Reportes │                                            │
│ Alertas  │                                            │
│ Categor. │                                            │
│ Sedes    │                                            │
│ Auditoría│                                            │
│          │                                            │
│──────────│                                            │
│ Departamento│                                         │
│ Tecnología  │                                         │
└──────────┴────────────────────────────────────────────┘
```

### 4.2 Barra Lateral (Sidebar)

La barra lateral contiene el menú de navegación. Los elementos que se muestran dependen de su rol:

| Menú | Administrador | Jefe | Carga | Consulta |
|------|:------------:|:----:|:-----:|:--------:|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Inventario | ✓ | ✓ | ✓ | ✓ |
| Movimientos | ✓ | ✓ | ✓ | ✗ |
| Reportes | ✓ | ✓ | ✗ | ✗ |
| Alertas | ✓ | ✓ | ✓ | ✗ |
| Categorías | ✓ | ✗ | ✗ | ✗ |
| Sedes y Unidades | ✓ | ✗ | ✗ | ✗ |
| Auditoría | ✓ | ✓ | ✗ | ✗ |

### 4.3 Barra Superior (Topbar)

- **☰ (Hamburguesa)**: Abre/cierra el menú en dispositivos móviles
- **Título**: Nombre de la página actual
- **Nombre de usuario**: Muestra quién está conectado
- **Cerrar sesión**: Botón para salir del sistema

---

## 5. Dashboard

El Dashboard es la pantalla principal que muestra un resumen del estado del inventario.

### 5.1 Tarjetas de Estadísticas

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│    Total     │   Activos    │  Pendientes  │   Alertas    │
│     Ítems    │    Ítems     │  Movimientos │   Activas    │
│      8       │      6       │      1       │      1       │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

- **Total de Ítems**: Cantidad total de ítems registrados
- **Ítems activos**: Ítems en estado activo
- **Movimientos pendientes**: Traslados o bajas esperando aprobación
- **Alertas activas**: Alertas abiertas que requieren atención

### 5.2 Ítems por Categoría

Debajo de las tarjetas se muestra una tabla con la cantidad de ítems por categoría:

| Código | Categoría | Ítems |
|--------|-----------|-------|
| A1 | Equipamiento Tecnológico | 3 |
| A2 | Mobiliario de Oficina | 2 |
| A3 | Elementos de Seguridad | 1 |

---

## 6. Gestión de Inventario

### 6.1 Ver Lista de Ítems

1. Haga clic en **"Inventario"** en el menú lateral
2. Verá la tabla con todos los ítems registrados

```
┌─────────────┬───────────┬──────────────┬──────────┬──────┬─────────┬───────────────┬──────────┐
│ Código      │ Categoría │ Detalle      │ Estado   │ Cant │ Unidad  │ Responsable   │ Acciones │
├─────────────┼───────────┼──────────────┼──────────┼──────┼─────────┼───────────────┼──────────┤
│ A1-03-47-...│ A1        │ Laptop Dell  │ Bueno    │ 1    │ TI      │ Juan Pérez    │ Ver Edit │
│ A2-03-48-...│ A2        │ Escritorio   │ Regular  │ 2    │ Admin   │ María López  │ Ver Edit │
└─────────────┴───────────┴──────────────┴──────────┴──────┴─────────┴───────────────┴──────────┘
```

### 6.2 Buscar Ítems

1. En el campo de búsqueda, ingrese el **código** o **detalle** del ítem
2. Los resultados se filtrán automáticamente
3. También puede filtrar por **categoría** usando el menú desplegable

### 6.3 Registrar Nuevo Ítem (Alta)

1. Haga clic en **"+ Registrar alta"**
2. Se abrirá un formulario modal

```
┌─────────────────────────────────────────────────┐
│              Registrar alta de ítem              │
├─────────────────────────────────────────────────┤
│ Categoría: [Seleccionar...]                     │
│ Elemento: [Seleccionar...] (según categoría)    │
│ Estado conservación: [Muy bueno ▼]              │
│ Cantidad: [1]                                   │
│ Fecha de alta: [dd/mm/aaaa] ☐ Desconocida       │
│ Unidad de destino: [Seleccionar...]             │
│ Motivo de alta: [_________________]             │
│                                                 │
│        [Cancelar]        [Registrar]            │
└─────────────────────────────────────────────────┘
```

3. **Complete los campos**:
   - **Categoría**: Seleccione la categoría del ítem
   - **Elemento**: Seleccione el tipo de elemento (aparecerá según la categoría)
   - **Estado de conservación**: Muy bueno, Bueno, Regular o Malo
   - **Cantidad**: Número de unidades
   - **Fecha de alta**: Fecha de incorporación (puede marcar "Desocida")
   - **Unidad de destino**: Unidad organizacional donde se ubicará
   - **Motivo de alta**: Razón del registro

4. **Campos dinámicos**: Según la categoría seleccionada, aparecerán campos adicionales específicos (ej: Marca, Modelo, Serie, etc.)

5. Haga clic en **"Registrar"**

6. **El sistema generará automáticamente**:
   - Un código único (ej: A1-03-47-000001)
   - Un movimiento de alta aprobado
   - Un registro de auditoría

### 6.4 Ver Detalle de un Ítem

1. Haga clic en **"Ver"** en la columna de Acciones
2. Se abrirá un modal con información completa

```
┌─────────────────────────────────────────────────────────────────┐
│                        Detalle A1-03-47-000001                  │
├─────────────────────────────────────────────────────────────────┤
│ Datos del Ítem                                                  │
│ ─────────────                                                   │
│ Código: A1-03-47-000001                                         │
│ Categoría: Equipamiento Tecnológico                             │
│ Elemento: Laptop                                                │
│ Estado: Activo                                                  │
│ Conservación: Bueno                                             │
│ Cantidad: 1                                                     │
│ Unidad: TI                                                      │
│ Responsable: Juan Pérez                                         │
│ Fecha de alta: 15/08/2026                                       │
│                                                                 │
│ Detalles Adicionales                                            │
│ ──────────────────                                              │
│ Marca: Dell                                                     │
│ Modelo: Latitude 5520                                           │
│ Número de serie: ABC123456                                      │
│                                                                 │
│ Historial de Movimientos                                        │
│ ─────────────────────                                           │
│ 15/08/2026  Alta     -         → TI    Solicitó: Admin   OK    │
└─────────────────────────────────────────────────────────────────┘
```

### 6.5 Editar un Ítem

1. Haga clic en **"Editar"** en la columna de Acciones
2. Se abrirá el formulario con los datos actuales
3. Modifique los campos que desee
4. Haga clic en **"Guardar"**

### 6.6 Eliminar un Ítem

1. Haga clic en **"Eliminar"** en la columna de Acciones
2. Aparecerá una confirmación de seguridad
3. Haga clic en **"Eliminar"** para confirmar

> **Nota**: La eliminación es permanente y eliminará todos los movimientos asociados.

---

## 7. Gestión de Movimientos

Los movimientos registran los cambios de ubicación o estado de los ítems.

### 7.1 Tipos de Movimiento

| Tipo | Descripción |
|------|-------------|
| **Alta** | Registro inicial de un ítem |
| **Traslado** | Cambio de unidad de destino |
| **Baja** | Retiro del inventario |

### 7.2 Ver Lista de Movimientos

1. Haga clic en **"Movimientos"** en el menú lateral
2. Use los filtros para buscar:
   - **Tipo**: Alta, Traslado o Baja
   - **Estado**: Pendiente, Aprobado o Rechazado

```
┌──────────────┬────────┬─────────────┬──────────────────┬──────────┬────────────┬──────────┐
│ Fecha        │ Tipo   │ Ítem        │ Origen → Destino │ Estado   │ Solicitante│ Acciones │
├──────────────┼────────┼─────────────┼──────────────────┼──────────┼────────────┼──────────┤
│ 15/08/2026   │ Alta   │ A1-03-47... │ - → TI           │ Aprobado │ Admin      │          │
│ 20/08/2026   │ Trasl. │ A2-03-48... │ Admin → RRHH     │ Pendiente│ Jefe       │ Apro Rech│
└──────────────┴────────┴─────────────┴──────────────────┴──────────┴────────────┴──────────┘
```

### 7.3 Solicitar Traslado

1. Haga clic en **"+ Nueva solicitud"**
2. Seleccione **"Traslado"** como tipo de movimiento
3. Seleccione el **ítem** a trasladar
4. Seleccione la **unidad de destino**
5. Ingrese el **motivo** del traslado
6. Haga clic en **"Registrar"**

> **Nota**: Se creará una alerta para que un administrador o jefe apruebe el traslado.

### 7.4 Solicitar Baja

1. Haga clic en **"+ Nueva solicitud"**
2. Seleccione **"Baja"** como tipo de movimiento
3. Seleccione el **ítem** a dar de baja
4. Ingrese el **motivo** de la baja
5. Haga clic en **"Registrar"**

> **Nota**: La baja tiene prioridad crítica y requiere aprobación.

### 7.5 Aprobar o Rechazar Movimiento

**Solo administradores y jefes pueden realizar esta acción.**

1. Busque el movimiento con estado **"Pendiente"**
2. Haga clic en **"Aprobar"** o **"Rechazar"**

**Al aprobar:**
- El traslado cambia la unidad del ítem
- La baja cambia el estado del ítem a "baja"
- Se cierra la alerta asociada

**Al rechazar:**
- Se solicita un motivo de rechazo
- El movimiento queda registrado como rechazado
- Se cierra la alerta asociada

---

## 8. Gestión de Alertas

Las alertas notifican sobre eventos que requieren atención.

### 8.1 Tipos de Alerta

| Tipo | Descripción | Prioridad |
|------|-------------|-----------|
| Pendiente de aprobación | Movimiento esperando revisión | Importante |
| Pendiente de movimiento | Alerta del sistema | Importante |
| Manual | Creada por un usuario | Variable |

### 8.2 Prioridades

| Prioridad | Descripción |
|-----------|-------------|
| **Crítica** | Requiere atención inmediata (bajas) |
| **Importante** | Requiere atención pronto (traslados) |
| **Informativa** | Solo informativa |

### 8.3 Ver Alertas

1. Haga clic en **"Alertas"** en el menú lateral
2. Use el filtro de **Estado** para ver abiertas o cerradas

```
┌──────────────┬────────────┬──────────────────────────────────┬──────────┬──────────┐
│ Fecha        │ Prioridad  │ Mensaje                          │ Ítem     │ Estado   │
├──────────────┼────────────┼──────────────────────────────────┼──────────┼──────────┤
│ 20/08/2026   │ Importante │ Traslado pendiente de revisión   │ A2-03-.. │ Abierta  │
│ 18/08/2026   │ Crítica    │ Baja pendiente de aprobación     │ A3-03-.. │ Cerrada  │
└──────────────┴────────────┴──────────────────────────────────┴──────────┴──────────┘
```

### 8.4 Crear Alerta Manual (Admin/Jefe)

1. Haga clic en **"+ Nueva alerta"**
2. Ingrese el **mensaje**
3. Seleccione la **prioridad**
4. Seleccione la **unidad**
5. Opcionalmente, seleccione un **ítem** relacionado
6. Haga clic en **"Crear"**

### 8.5 Cerrar Alerta (Admin/Jefe)

1. Busque la alerta abierta
2. Haga clic en **"Cerrar"**
3. La alerta cambiará a estado "Cerrada"

---

## 9. Gestión de Categorías

> **Solo administradores pueden acceder a esta función.**

### 9.1 Estructura de Categorías

Cada categoría tiene:
- **Código**: Identificador único (ej: A1)
- **Nombre**: Descriptivo (ej: Equipamiento Tecnológico)
- **Elementos**: Tipos de ítems dentro de la categoría
- **Campos dinámicos**: Información adicional para los ítems

### 9.2 Panel de Categorías

```
┌─────────────────────────────────────────────────────────────────────┐
│  Categorías                                                         │
│  ┌──────────────┐  ┌─────────────────────────────────────────────┐  │
│  │ A1 - Equip.  │  │  A1 - Equipamiento Tecnológico              │  │
│  │ A2 - Mobili. │  │                                             │  │
│  │ A3 - Segur.  │  │  Ámbito: [General ▼]                       │  │
│  │ A4 - Vehíc.  │  │                                             │  │
│  │ A5 - Herram. │  │  Campos dinámicos                          │  │
│  │ A6 - Bibliog.│  │  ┌───────┬────────┬──────┬─────┐          │  │
│  │              │  │  │ Nombre│ Tipo   │ Req  │     │          │  │
│  │              │  │  ├───────┼────────┼──────┼─────┤          │  │
│  │              │  │  │ Marca │ Texto  │  ✓   │ ↑ ↓ │          │  │
│  │              │  │  │Modelo │ Texto  │  ✓   │ ↑ ↓ │          │  │
│  │              │  │  │Serie  │ Texto  │      │ ↑ ↓ │          │  │
│  │              │  │  └───────┴────────┴──────┴─────┘          │  │
│  │              │  │                                             │  │
│  │              │  │  [+ Nuevo campo]                            │  │
│  │              │  │                                             │  │
│  │              │  │  Elementos                                  │  │
│  │              │  │  ┌───────────┬──────────┐                  │  │
│  │              │  │  │ Nombre    │          │                  │  │
│  │              │  │  ├───────────┼──────────┤                  │  │
│  │              │  │  │ Laptop    │ ↑ ↓ Edit │                  │  │
│  │              │  │  │ Desktop   │ ↑ ↓ Edit │                  │  │
│  │              │  │  │ Tablet    │ ↑ ↓ Edit │                  │  │
│  │              │  │  └───────────┴──────────┘                  │  │
│  │              │  │                                             │  │
│  │              │  │  [+ Nuevo elemento]                         │  │
│  └──────────────┘  └─────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────┐                   │
│  │  Nueva Categoría: [Código] [Nombre] [Crear]  │                   │
│  └──────────────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.3 Crear Categoría

1. En el panel inferior, ingrese el **código** (ej: A9)
2. Ingrese el **nombre**
3. Haga clic en **"Crear"**

### 9.4 Agregar Campo Dinámico

1. Seleccione la categoría
2. Seleccione el **ámbito** (General o un elemento específico)
3. Haga clic en **"+ Nuevo campo"**
4. Ingrese el **nombre** del campo
5. Seleccione el **tipo** (texto, número, fecha, select, textarea)
6. Si eligió "select", ingrese las **opciones** separadas por comas
7. Marque si es **requerido**
8. Haga clic en **"Crear"**

### 9.5 Agregar Elemento

1. Seleccione la categoría
2. Haga clic en **"+ Nuevo elemento"**
3. Ingrese el **nombre**
4. Haga clic en **"Crear"**

### 9.6 Editar Campo o Elemento

1. Haga clic en **"Editar"** junto al campo o elemento
2. Modifique los datos
3. Haga clic en **"Guardar"**

### 9.7 Reordenar Campos/Elementos

Use las flechas **↑** y **↓** para cambiar el orden de aparición.

---

## 10. Gestión de Sedes y Unidades

> **Solo administradores pueden acceder a esta función.**

### 10.1 Sedes

Las sedes representan las ubicaciones físicas del instituto.

```
┌─────────────────────────────────────────────────────────────┐
│  Sedes                                                       │
│  ┌────────────────────┬────────────────────┬──────────────┐  │
│  │    Sede Central    │    Sede Norte      │ + Nueva Sede │  │
│  │    IdSede 01       │    IdSede 02       │              │  │
│  │ [_____________]    │ [_____________]    │ [______]     │  │
│  │ [Desactivar] [×]   │ [Desactivar] [×]   │ [Crear]      │  │
│  └────────────────────┴────────────────────┴──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### Crear Sede
1. En el formulario "Nueva Sede", ingrese el **nombre**
2. Haga clic en **"Crear"**

#### Editar Sede
1. Modifique el nombre directamente en el campo de texto
2. Los cambios se guardan automáticamente

#### Desactivar/Activar Sede
- Haga clic en **"Desactivar"** para deshabilitar la sede
- Haga clic en **"Activar"** para habilitarla nuevamente

> **Nota**: Las sedes inactivas no aparecen en los formularios de selección.

### 10.2 Unidades

Las unidades son departmentos o áreas dentro de cada sede.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Unidades                                      [Buscar...] ☐ Ver inactivas │
├────────────┬───────────────────────────────────────────────────────────────┤
│ IdUnidad   │ Sede    │ Nombre                    │ Activo │ Acciones       │
├────────────┼─────────┼───────────────────────────┼────────┼────────────────┤
│ 01         │ Central │ [Tecnología_________]     │ ✓      │ Desactivar [×] │
│ 02         │ Central │ [Administración_____]     │ ✓      │ Desactivar [×] │
│ 03         │ Norte   │ [Operaciones________]     │ ✓      │ Desactivar [×] │
└────────────┴─────────┴───────────────────────────┴────────┴────────────────┘
```

#### Crear Unidad
1. Haga clic en **"+ Nueva unidad"**
2. Seleccione la **sede**
3. Ingrese el **nombre**
4. Haga clic en **"Crear"**

#### Editar Unidad
1. Modifique el nombre directamente en el campo de texto
2. Los cambios se guardan automáticamente

#### Desactivar/Activar Unidad
- Haga clic en **"Desactivar"** para deshabilitar la unidad
- Haga clic en **"Activar"** para habilitarla nuevamente

#### Mostrar Unidades Inactivas
- Marque la casilla **"Ver inactivas"** para incluir unidades desactivadas en la lista

---

## 11. Reportes

> **Solo administradores y jefes pueden acceder a esta función.**

### 11.1 Tipos de Reporte

El sistema genera 6 tipos de reportes:

| Reporte | Descripción |
|---------|-------------|
| **Por Categoría** | Cantidad de ítems en cada categoría |
| **Por Estado** | Distribución por estado de conservación |
| **Por Sede** | Ítems por ubicación física |
| **Por Unidad** | Ítems por unidad organizacional |
| **Por Elemento** | Los 20 elementos más frecuentes |
| **Movimientos** | Movimientos por mes (últimos 6 meses) |

### 11.2 Ver Reportes

1. Haga clic en **"Reportes"** en el menú lateral
2. Verá las tablas con los datos agregados

### 11.3 Exportar a Excel

1. Haga clic en **"Exportar Excel"** en la parte superior
2. Se descargará un archivo `.xlsx` con:
   - Una hoja por categoría
   - Columnas de campos dinámicos
   - Filtros automáticos

### 11.4 Exportar a CSV

1. Haga clic en **"Exportar CSV"**
2. Se descargará un archivo `.csv` con todos los ítems

---

## 12. Auditoría

> **Solo administradores y jefes pueden acceder a esta función.**

### 12.1 ¿Qué se Registra?

El sistema registra automáticamente:

- Inicios y cierres de sesión
- Creación, edición y eliminación de ítems
- Creación, edición y eliminación de categorías
- Creación, edición y eliminación de campos dinámicos
- Solicitudes de movimiento
- Aprobaciones y rechazos
- Creación y cierre de alertas
- Activación y desactivación de sedes/unidades

### 12.2 Ver Registro de Auditoría

1. Haga clic en **"Auditoría"** en el menú lateral
2. Use los filtros para buscar:
   - **Entidad**: Tipo de elemento (Item, Categoria, etc.)
   - **Acción**: Tipo de acción (crear, editar, eliminar, etc.)

```
┌──────────────┬────────────┬──────────┬───────────┬─────────────────────────────┐
│ Fecha        │ Usuario    │ Acción   │ Entidad   │ Detalle                     │
├──────────────┼────────────┼──────────┼───────────┼─────────────────────────────┤
│ 23/08 10:15  │ admin      │ crear    │ Item      │ Código: A1-03-47-000001     │
│ 23/08 10:14  │ admin      │ login    │ -         │ IP: 192.168.1.100           │
│ 22/08 16:30  │ jefe       │ aprobar  │ Movimiento│ Traslado #12 aprobado       │
└──────────────┴────────────┴──────────┴───────────┴─────────────────────────────┘
```

### 12.3 Exportar Auditoría

1. Haga clic en **"Exportar Excel"** o **"Exportar JSON"**
2. Se descargará un archivo con todos los registros filtrados

---

## 13. Preguntas Frecuentes

### ¿Cómo cambio mi contraseña?

Contacte al administrador del sistema para solicitar un cambio de contraseña.

### ¿Por qué no veo ciertas opciones en el menú?

Las opciones del menú dependen de su rol. Si necesita acceso adicional, contacte al administrador.

### ¿Qué hago si un ítem no aparece en la lista?

1. Verifique los filtros de búsqueda
2. Asegúrese de que el ítem esté en estado "activo"
3. Si el ítem fue eliminado, ya no estará disponible

### ¿Puedo recuperar un ítem eliminado?

No, la eliminación es permanente. Si necesita restaurar un ítem, deberá crear uno nuevo.

### ¿Cómo funciona el código único?

El código sigue el formato: `Categoría-Sede-Unidad-Secuencial`
Ejemplo: `A1-03-47-000001`
- A1 = Categoría (Equipamiento Tecnológico)
- 03 = ID de Sede
- 47 = ID de Unidad
- 000001 = Secuencial

### ¿Qué pasa si rechazo un movimiento?

El movimiento queda registrado como "rechazado" con el motivo. El ítem mantiene su ubicación actual.

### ¿Puedo crear ítems sin fecha de alta?

Sí, puede marcar la casilla "Fecha desconocida" al registrar un ítem.

### ¿Cómo creo campos personalizados para una categoría?

1. Vaya a **Categorías** (solo admin)
2. Seleccione la categoría
3. Haga clic en **"+ Nuevo campo"**
4. Configure nombre, tipo y opciones

### ¿Las sedes y unidades inactivas afectan el inventario?

No, las sedes y unidades inactivas simplemente no aparecen en los formularios de selección. Los ítems existentes mantienen su referencia.

### ¿Cómo funciona la paginación?

Los ítems se muestran 20 por página. Use los botones "Anterior" y "Siguiente" para navegar.

---

## Información de Contacto

Para soporte técnico o consultas sobre el sistema, contacte:

**Departamento de Tecnología, Desarrollo e Innovación**
Instituto de Seguridad Pública (ISeP)

---

*Manual de Usuario - SAGI v1.0*
*Fecha: 23 de agosto de 2026*

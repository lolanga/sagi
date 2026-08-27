---
title: "SAGI - Manual de Especificaciones Técnicas"
subtitle: "Sistema de Administración y Gestión de Inventarios"
author: "Instituto de Seguridad Pública (ISeP)"
date: "27 de agosto de 2026"
version: "3.2"
---

# SAGI - Manual de Especificaciones Técnicas

**Sistema de Administración y Gestión de Inventarios**
Instituto de Seguridad Pública (ISeP)

Versión: 3.2 | Fecha: 27 de agosto de 2026 | Estado: Producción

---

## Índice

1. Descripción General
2. Arquitectura del Sistema
3. Stack Tecnológico
4. Modelo de Datos
5. Estructura de Base de Datos
6. API REST - Endpoints
7. Autenticación y Autorización
8. Lógica de Negocio
9. Frontend - Componentes y Rutas
10. Sistema de Auditoría
11. Exportación de Datos
12. Seguridad
13. Requisitos de Instalación

---

## 1. Descripción General

SAGI es un sistema web full-stack diseñado para la administración, registro y control de inventarios de bienes muebles del Instituto de Seguridad Pública (ISeP).

### Funcionalidades Principales

| Funcionalidad | Descripción |
|---------------|-------------|
| Registro de ítems | Alta con campos dinámicos por categoría, AbortController, validación inline |
| Control de movimientos | Altas, traslados, bajas con flujo de aprobación y motivos |
| Baja con trazabilidad | Ítems dados de baja conservan registros, motivo y fecha de baja |
| Reactivación | Re-activación de ítems dados de baja con motivo y auditoría |
| Gestión organizacional | Sedes y unidades del instituto |
| Sistema de alertas | Notificaciones para pendientes |
| Auditoría | Registro completo de acciones |
| Reportes | Exportación a Excel, CSV, PDF |
| Tabla virtual | VirtualTable con columnas configurables y scroll optimizado |
| Lazy loading | Carga bajo demanda de módulos con React.lazy |
| Compresión | Brotli/Gzip en responses del backend |

### 1.1 Alcance

- Inventario de bienes muebles (equipamiento, mobiliario, elementos de oficina)
- Control de movimientos con aprobación jerárquica
- Trazabilidad completa de cada ítem
- Gestión de categorías con campos personalizables
- Reportes para toma de decisiones

### 1.2 Público Objetivo

| Rol | Función |
|-----|---------|
| Administradores | Gestión completa del sistema |
| Jefes de Área | Aprobación de movimientos, reportes |
| Personal de Carga | Registro de ítems, solicitudes de movimiento |
| Personal de Consulta | Solo visualización |

---

## 2. Arquitectura del Sistema

### 2.1 Capas del Sistema

| Capa | Tecnología | Puerto | Función |
|------|------------|--------|---------|
| Cliente | React + Vite SPA | 5173 (dev) | Interfaz de usuario |
| Proxy | Vite Dev Server | - | Proxy inverso /api → backend |
| Servidor | Laravel 12 + Sanctum | 8000 | API REST, lógica de negocio |
| Base de datos | MySQL 8.x | 3306 | Persistencia de datos |

### 2.2 Flujo de una Petición

| Paso | Descripción |
|------|-------------|
| 1. Autenticación | El usuario envía DNI + contraseña |
| 2. Token | Sanctum genera token, se almacena en localStorage |
| 3. Petición | Cada petición HTTP incluye `Authorization: Bearer {token}` |
| 4. Autorización | Middleware `rol` verifica roles permitidos |
| 5. Respuesta | JSON estandarizado con datos y/o errores |

---

## 3. Stack Tecnológico

### 3.1 Backend

| Componente | Versión | Propósito |
|------------|---------|-----------|
| PHP | 8.2+ | Lenguaje del servidor |
| Laravel | 12.x | Framework PHP |
| Sanctum | 4.x | Autenticación por tokens |
| MySQL | 8.x | Base de datos relacional |
| Eloquent ORM | - | Mapeo objeto-relacional |

### 3.2 Frontend

| Componente | Versión | Propósito |
|------------|---------|-----------|
| React | 19.x | Biblioteca de UI |
| Vite | 8.x | Bundler y dev server |
| React Router | 7.x | Enrutamiento SPA con React.lazy |
| Axios | 1.x | Cliente HTTP con AbortController |
| SheetJS (xlsx) | - | Exportación Excel |
| Chart.js | 4.x | Gráficos de barras y doughnut (Dashboard) |
| jsPDF | 2.x | Generación de PDFs |
| jspdf-autotable | 3.x | Tablas en PDFs |

### 3.3 Performance y Optimización

| Feature | Descripción |
|---------|-------------|
| React.lazy | Carga bajo demanda de cada página (code splitting) |
| VirtualTable | Tabla CSS con scroll virtual (max-height: 70vh) |
| Column toggle | Ocultar/mostrar columnas configurables |
| Compresión | Middleware PrecompressResponse (Brotli/Gzip) |
| Lazy loading imágenes | Componente Image con loading="lazy" |
| CSS code splitting | Vite genera CSS separado por página |

### 3.3 Herramientas de Desarrollo

| Herramienta | Propósito |
|-------------|-----------|
| Git | Control de versiones (GitHub: lolanga/sagi) |
| Node.js | Runtime de JavaScript |
| Composer | Gestor de dependencias PHP |
| XAMPP | Servidor local (Apache + MySQL) |

---

## 4. Modelo de Datos

### 4.1 Diagrama de Relaciones entre Entidades

| Entidad Origen | Relación | Entidad Destino | Cardinalidad |
|----------------|----------|-----------------|--------------|
| roles | tiene muchos | users | 1:N |
| users | pertenece a | sedes | N:1 |
| sedes | tiene muchas | unidades | 1:N |
| unidades | tiene muchos | items | 1:N |
| users | es responsable de | items | 1:N |
| categorías | tiene muchos | items | 1:N |
| tipos_items | tiene muchos | items | 1:N |
| categorías | tiene muchos | campos_dinamicos | 1:N |
| tipos_items | tiene muchos | campos_dinamicos | 1:N |
| items | tiene muchos | movimientos | 1:N |
| movimientos | tiene origen | unidades | N:1 |
| movimientos | tiene destino | unidades | N:1 |
| movimientos | solicitado por | users | N:1 |
| movimientos | validado por | users | N:1 |
| alertas | puede referir | items | N:1 |
| alertas | puede referir | movimientos | N:1 |
| alertas | afecta a | unidades | N:1 |
| users | genera | auditoria | 1:N |

### 4.2 Entidades Principales

#### Tabla: roles

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PK, auto_increment | Identificador único |
| nombre | VARCHAR(50) | NOT NULL | Nombre descriptivo |
| slug | VARCHAR(50) | UNIQUE, NOT NULL | Identificador técnico |

**Valores posibles:** admin, jefe, carga, consulta

#### Tabla: users

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PK, auto_increment | Identificador único |
| name | VARCHAR(255) | NOT NULL | Nombre completo |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Correo electrónico |
| dni | VARCHAR(8) | UNIQUE, NOT NULL | Documento Nacional de Identidad |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Nombre de usuario |
| rol_id | INT | FK → roles | Rol asignado |
| sede_id | INT | FK → sedes | Sede de trabajo |
| password | VARCHAR(255) | NOT NULL | Contraseña hasheada (bcrypt) |

#### Tabla: sedes

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PK, auto_increment | Identificador único |
| nombre | VARCHAR(255) | UNIQUE, NOT NULL | Nombre de la sede |
| activa | BOOLEAN | DEFAULT true | Estado (activa/inactiva) |

#### Tabla: unidades

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PK, auto_increment | Identificador único |
| sede_id | INT | FK → sedes | Sede a la que pertenece |
| nombre | VARCHAR(255) | NOT NULL | Nombre de la unidad |
| activa | BOOLEAN | DEFAULT true | Estado (activa/inactiva) |

#### Tabla: categorias

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PK, auto_increment | Identificador único |
| codigo | VARCHAR(4) | UNIQUE, NOT NULL | Código abreviado (A1, A2, etc.) |
| nombre | VARCHAR(255) | NOT NULL | Nombre descriptivo |
| es_transitoria | BOOLEAN | DEFAULT false | Categoría temporal (A7=alta, A8=baja) |

**Categorías predefinidas:**

| Código | Nombre | Uso |
|--------|--------|-----|
| A1 | Equipamiento Tecnológico | Computadoras, impresoras, etc. |
| A2 | Mobiliario de Oficina | Escritorios, sillas, estanterías |
| A3 | Elementos de Seguridad | Extintores, botiquines, etc. |
| A4 | Vehículos | Automóviles, motocicletas |
| A5 | Herramientas | Equipos de trabajo |
| A6 | Material Bibliográfico | Libros, revistas |
| A7 | Categoría Temporal de Alta | Transitoria durante registro |
| A8 | Categoría de Baja | Para ítems dados de baja |

#### Tabla: tipos_items

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PK, auto_increment | Identificador único |
| categoria_id | INT | FK → categorias (CASCADE) | Categoría padre |
| nombre | VARCHAR(255) | NOT NULL | Nombre del tipo |
| orden | INT | DEFAULT 0 | Posición en la lista |

#### Tabla: campos_dinamicos

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PK, auto_increment | Identificador único |
| categoria_id | INT | FK → categorias (CASCADE) | Categoría padre |
| tipo_item_id | INT | FK → tipos_items (NULLABLE) | Tipo específico (null=general) |
| nombre | VARCHAR(255) | NOT NULL | Nombre del campo |
| tipo | ENUM | NOT NULL | tipo, numero, fecha, select, textarea |
| opciones | JSON | NULLABLE | Opciones para tipo "select" |
| placeholder | VARCHAR(255) | NULLABLE | Texto de ayuda |
| requerido | BOOLEAN | DEFAULT false | Si es obligatorio |
| activo | BOOLEAN | DEFAULT true | Si está habilitado |
| orden | INT | DEFAULT 0 | Posición en la lista |

**Tipos de campo disponibles:**

| Tipo | Elemento HTML | Uso |
|------|---------------|-----|
| texto | `<input type="text">` | Campo de texto corto |
| numero | `<input type="number">` | Campo numérico |
| fecha | `<input type="date">` | Campo de fecha |
| select | `<select>` | Lista desplegable |
| textarea | `<textarea>` | Texto largo |

#### Tabla: items

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PK, auto_increment | Identificador único |
| codigo_unico | VARCHAR(20) | UNIQUE, NOT NULL | Código del ítem |
| categoria_id | INT | FK → categorias | Categoría actual (A8 si está en baja) |
| tipo_item_id | INT | FK → tipos_items (NULLABLE) | Tipo específico |
| responsable_id | INT | FK → users | Persona responsable |
| unidad_id | INT | FK → unidades | Unidad de destino |
| estado_conservacion | VARCHAR(50) | DEFAULT 'Muy bueno' | Estado físico |
| cantidad | INT | DEFAULT 1 | Cantidad |
| fecha_alta | DATE | NULLABLE | Fecha de incorporación |
| valores_dinamicos | JSON | NULLABLE | Valores de campos dinámicos |
| estado | ENUM | DEFAULT 'activo' | activo, pendiente, baja |
| motivo_baja | TEXT | NULLABLE | Razón de la baja (solo visible admin/jefe) |
| fecha_baja | TIMESTAMP | NULLABLE | Fecha y hora de la baja |
| categoria_original_id | INT | FK → categorias (NULLABLE) | Categoría antes de la baja (para reactivación) |

**Formato del código único:**

`{Categoría}-{IdSede 2dígitos}-{IdUnidad 2dígitos}-{Secuencial 6dígitos}`

**Ejemplo:** `A1-03-47-000001`

| Parte | Valor | Significado |
|-------|-------|-------------|
| A1 | Categoría | Equipamiento Tecnológico |
| 03 | IdSede | Sede con ID 3 |
| 47 | IdUnidad | Unidad con ID 47 |
| 000001 | Secuencial | Primer ítem de esa combinación |

**Estados de conservación:** Muy bueno, Bueno, Regular, Malo

**Estados del ítem:** activo, pendiente, baja

#### Tabla: movimientos

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PK, auto_increment | Identificador único |
| item_id | INT | FK → items (CASCADE) | Ítem afectado |
| tipo | ENUM | NOT NULL | alta, traslado, baja |
| unidad_origen_id | INT | FK → unidades | Unidad de origen |
| unidad_destino_id | INT | FK → unidades (NULLABLE) | Unidad de destino |
| motivo | TEXT | NOT NULL | Razón del movimiento |
| estado | ENUM | DEFAULT 'pendiente' | pendiente, aprobado, rechazado |
| solicitante_id | INT | FK → users | Quien solicita |
| validador_id | INT | FK → users (NULLABLE) | Quien aprueba/rechaza |
| fecha_validacion | DATETIME | NULLABLE | Fecha de validación |
| motivo_rechazo | TEXT | NULLABLE | Razón del rechazo |

#### Tabla: alertas

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PK, auto_increment | Identificador único |
| tipo | ENUM | NOT NULL | pendiente_aprobacion, pendiente_movimiento, manual |
| prioridad | ENUM | NOT NULL | critica, importante, informativa |
| estado | ENUM | DEFAULT 'abierta' | abierta, cerrada |
| item_id | INT | FK → items (NULLABLE) | Ítem relacionado |
| movimiento_id | INT | FK → movimientos (NULLABLE) | Movimiento relacionado |
| unidad_id | INT | FK → unidades | Unidad afectada |
| mensaje | TEXT | NOT NULL | Descripción de la alerta |
| fecha_cierre | DATETIME | NULLABLE | Fecha de cierre |

#### Tabla: auditoria

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PK, auto_increment | Identificador único |
| user_id | INT | FK → users | Usuario que realizó la acción |
| accion | VARCHAR(50) | NOT NULL | Tipo de acción |
| entidad | VARCHAR(50) | NOT NULL | Entidad afectada |
| entidad_id | INT | NULLABLE | ID de la entidad |
| detalle | JSON | NULLABLE | Detalle adicional |

**Acciones registradas:** crear, editar, eliminar, aprobar, rechazar, login, solicitar, mover, cerrar, activar, desactivar

---

## 5. Estructura de Base de Datos

### 5.1 Nombre y Conexión

| Parámetro | Valor |
|-----------|-------|
| Motor | MySQL 8.x |
| Base de datos | sagi |
| Host | 127.0.0.1 |
| Puerto | 3306 |
| Usuario | root |
| Contraseña | (vacío en desarrollo) |

### 5.2 Migraciones

| # | Migración | Tabla | Acción |
|---|-----------|-------|--------|
| 1 | 000000 | roles | Crear tabla |
| 2 | 000000 | sedes | Crear tabla |
| 3 | 000000 | unidades | Crear tabla |
| 4 | 000000 | users | Crear tabla |
| 5 | 000001 | cache | Crear tablas |
| 6 | 000002 | jobs | Crear tablas |
| 7 | 000003 | categorias | Crear tabla |
| 8 | 000004 | campos_dinamicos | Crear tabla |
| 9 | 000005 | items | Crear tabla |
| 10 | 000006 | movimientos | Crear tabla |
| 11 | 000007 | alertas | Crear tabla |
| 12 | 000008 | auditoria | Crear tabla |
| 13 | 000009 | tipos_items | Crear tabla |
| 14 | 000010 | items | Agregar tipo_item_id |
| 15 | 000011 | campos_dinamicos | Agregar tipo_item_id y placeholder |
| 16 | 20260818 | personal_access_tokens | Crear tabla (Sanctum) |
| 17 | 20260818 | sedes, unidades | Agregar campo activa |
| 18 | 20260823 | items | Hacer fecha_alta nullable |
| 19 | 20260823 | items | Recodificar códigos existentes |
| 20 | 20260827 | items | Agregar motivo_baja, fecha_baja, categoria_original_id |

---

## 6. API REST - Endpoints

### 6.1 Autenticación

| Método | Endpoint | Descripción | Autenticación | Roles |
|--------|----------|-------------|---------------|-------|
| POST | /api/login | Iniciar sesión | No | Público |
| GET | /api/me | Obtener usuario actual | Sí | Todos |
| POST | /api/logout | Cerrar sesión | Sí | Todos |
| POST | /api/change-password | Cambiar contraseña | Sí | Todos |

### 6.2 Dashboard

| Método | Endpoint | Descripción | Autenticación | Roles |
|--------|----------|-------------|---------------|-------|
| GET | /api/dashboard/stats | Estadísticas generales | Sí | Todos |
| POST | /api/dashboard/backup | Crear backup de base de datos | Sí | admin |

### 6.3 Items (Inventario)

| Método | Endpoint | Descripción | Autenticación | Roles |
|--------|----------|-------------|---------------|-------|
| GET | /api/items | Listar ítems (25/pág) | Sí | Todos |
| POST | /api/items | Crear ítem | Sí | admin, jefe, carga |
| GET | /api/items/{id} | Ver detalle | Sí | Todos |
| PUT | /api/items/{id} | Actualizar ítem | Sí | admin, jefe, carga |
| POST | /api/items/{id}/reactivar | Reactivar ítem dado de baja | Sí | admin, jefe |
| DELETE | /api/items/{id} | Eliminar ítem | Sí | admin |

**Parámetros de filtro para GET /api/items:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| search | string | Búsqueda por código, valores dinámicos, unidad de destino o responsable |
| per_page | int | Registros por página (default: 25, max: 100) |
| categoria_id | int | Filtrar por categoría |
| estado_conservacion | string | Filtrar por estado de conservación |
| estado | string | Filtrar por estado (activo/pendiente/baja) |
| unidad_id | int | Filtrar por unidad |
| page | int | Número de página (default: 1) |

### 6.4 Categorías

| Método | Endpoint | Descripción | Autenticación | Roles |
|--------|----------|-------------|---------------|-------|
| GET | /api/categorias | Listar categorías | Sí | Todos |
| POST | /api/categorias | Crear categoría | Sí | admin |
| PUT | /api/categorias/{id} | Actualizar categoría | Sí | admin |
| DELETE | /api/categorias/{id} | Eliminar categoría | Sí | admin |
| GET | /api/categorias/{id}/campos | Obtener campos dinámicos | Sí | Todos |
| POST | /api/categorias/{id}/campos | Crear campo dinámico | Sí | admin |
| GET | /api/categorias/{id}/tipos | Obtener tipos de ítem | Sí | Todos |
| POST | /api/categorias/{id}/tipos | Crear tipo de ítem | Sí | admin |

### 6.5 Campos Dinámicos

| Método | Endpoint | Descripción | Autenticación | Roles |
|--------|----------|-------------|---------------|-------|
| PUT | /api/campos-dinamicos/{id} | Actualizar campo | Sí | admin |
| DELETE | /api/campos-dinamicos/{id} | Eliminar campo | Sí | admin |
| POST | /api/campos-dinamicos/{id}/mover | Reordenar campo | Sí | admin |

### 6.6 Tipos de Item

| Método | Endpoint | Descripción | Autenticación | Roles |
|--------|----------|-------------|---------------|-------|
| PUT | /api/tipos-item/{id} | Actualizar tipo | Sí | admin |
| DELETE | /api/tipos-item/{id} | Eliminar tipo | Sí | admin |
| POST | /api/tipos-item/{id}/mover | Reordenar tipo | Sí | admin |

### 6.7 Sedes

| Método | Endpoint | Descripción | Autenticación | Roles |
|--------|----------|-------------|---------------|-------|
| GET | /api/sedes | Listar sedes | Sí | Todos |
| POST | /api/sedes | Crear sede | Sí | admin |
| PUT | /api/sedes/{id} | Actualizar sede | Sí | admin |
| DELETE | /api/sedes/{id} | Eliminar sede | Sí | admin |

### 6.8 Unidades

| Método | Endpoint | Descripción | Autenticación | Roles |
|--------|----------|-------------|---------------|-------|
| GET | /api/unidades | Listar unidades | Sí | Todos |
| POST | /api/unidades | Crear unidad | Sí | admin |
| PUT | /api/unidades/{id} | Actualizar unidad | Sí | admin |
| DELETE | /api/unidades/{id} | Eliminar unidad | Sí | admin |

### 6.9 Movimientos

| Método | Endpoint | Descripción | Autenticación | Roles |
|--------|----------|-------------|---------------|-------|
| GET | /api/movimientos | Listar movimientos (25/pág) | Sí | Todos |
| POST | /api/movimientos/traslados | Solicitar traslado | Sí | admin, jefe, carga |
| POST | /api/movimientos/bajas | Solicitar baja | Sí | admin, jefe, carga |
| POST | /api/movimientos/{id}/aprobar | Aprobar movimiento | Sí | admin, jefe |
| POST | /api/movimientos/{id}/rechazar | Rechazar movimiento | Sí | admin, jefe |

**Parámetros de filtro para GET /api/movimientos:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| tipo | string | Filtrar por tipo (alta/traslado/baja) |
| estado | string | Filtrar por estado (pendiente/aprobado/rechazado) |
| item_id | int | Filtrar por ítem |

### 6.10 Alertas

| Método | Endpoint | Descripción | Autenticación | Roles |
|--------|----------|-------------|---------------|-------|
| GET | /api/alertas | Listar alertas (50/pág) | Sí | Todos |
| POST | /api/alertas | Crear alerta manual | Sí | admin, jefe |
| POST | /api/alertas/{id}/cerrar | Cerrar alerta | Sí | admin, jefe |

### 6.11 Auditoría

| Método | Endpoint | Descripción | Autenticación | Roles |
|--------|----------|-------------|---------------|-------|
| GET | /api/auditoria | Listar registros (50/pág, configurable) | Sí | admin, jefe |

**Parámetros de filtro para GET /api/auditoria:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| entidad | string | Filtrar por entidad |
| entidad_id | int | Filtrar por ID de entidad específica |
| accion | string | Filtrar por acción |
| user_id | int | Filtrar por usuario |
| per_page | int | Registros por página (default: 50, max: 100) |
| desde | date | Fecha inicio (YYYY-MM-DD) |
| hasta | date | Fecha fin (YYYY-MM-DD) |

### 6.12 Reportes

| Método | Endpoint | Descripción | Autenticación | Roles |
|--------|----------|-------------|---------------|-------|
| GET | /api/reportes/resumen | Datos agregados | Sí | admin, jefe |
| GET | /api/reportes/items | Lista completa de ítems | Sí | admin, jefe |

**Total: 42 endpoints (1 público, 41 autenticados)**

---

## 7. Autenticación y Autorización

### 7.1 Autenticación (Laravel Sanctum)

**Flujo de login:**

| Paso | Acción |
|------|--------|
| 1 | Cliente envía POST /api/login con { dni, password } |
| 2 | Servidor valida credenciales contra tabla users |
| 3 | Se genera token de acceso (Personal Access Token) |
| 4 | Se retorna { token, user: { id, name, dni, username, rol, sede } } |
| 5 | Cliente almacena token en localStorage (clave: sagi_token) |
| 6 | Cada petición subsiguiente incluye Authorization: Bearer {token} |

**Cierre de sesión:**

| Paso | Acción |
|------|--------|
| 1 | Cliente envía POST /api/logout |
| 2 | Servidor revoca el token actual |
| 3 | Cliente limpia localStorage |

### 7.2 Roles y Permisos

#### Roles Definidos

| Rol | Slug | Descripción |
|-----|------|-------------|
| Administrador | admin | Acceso total al sistema |
| Jefe de Área | jefe | Gestión intermedia |
| Personal de Carga | carga | Registro de datos |
| Personal de Consulta | consulta | Solo lectura |

#### Matriz de Permisos

| Funcionalidad | admin | jefe | carga | consulta |
|---------------|:-----:|:----:|:-----:|:--------:|
| Dashboard | Si | Si | Si | Si |
| Dashboard Backup | Si | No | No | No |
| Ver Inventario | Si | Si | Si | Si |
| Crear Ítem | Si | Si | Si | No |
| Editar Ítem | Si | Si | Si | No |
| Eliminar Ítem | Si | No | No | No |
| Ver Detalle Ítem | Si | Si | Si | Si |
| Ver Motivo Baja | Si | Si | No | No |
| Reactivar Ítem | Si | Si | No | No |
| Ver Movimientos | Si | Si | Si | No |
| Solicitar Traslado | Si | Si | Si | No |
| Solicitar Baja | Si | Si | Si | No |
| Aprobar/Rechazar | Si | Si | No | No |
| Ver Reportes | Si | Si | No | No |
| Exportar Reportes | Si | Si | No | No |
| Exportar Reportes PDF | Si | Si | No | No |
| Ver Alertas | Si | Si | Si | No |
| Crear Alerta | Si | Si | No | No |
| Cerrar Alerta | Si | Si | No | No |
| Gestionar Categorías | Si | No | No | No |
| Gestionar Sedes | Si | No | No | No |
| Gestionar Unidades | Si | No | No | No |
| Ver Auditoría | Si | Si | No | No |
| Exportar Auditoría | Si | Si | No | No |
| Cambiar Contraseña | Si | Si | Si | Si |

### 7.3 Usuarios de Prueba

| DNI | Contraseña | Rol | Usuario |
|-----|------------|-----|---------|
| 10000001 | Admin1234 | admin | admin |
| 10000002 | Jefe1234 | jefe | jefe |
| 10000003 | Carga1234 | carga | carga |
| 10000004 | Consulta1234 | consulta | consulta |

---

## 8. Lógica de Negocio

### 8.1 Flujo de Alta de Ítem

| Paso | Descripción |
|------|-------------|
| 1 | Usuario crea ítem (POST /api/items) con categoría A7 (temporal) |
| 2 | Se genera código único: {Cat}-{SedeId}-{UnidadId}-{Secuencial} |
| 3 | Se crea movimiento "alta" con estado "aprobado" |
| 4 | Se transfiere ítem de A7 a categoría real |
| 5 | Se registra en auditoría |

### 8.2 Flujo de Traslado

| Paso | Descripción |
|------|-------------|
| 1 | Usuario solicita traslado (POST /api/movimientos/traslados) |
| 2 | Se valida: ítem activo, destino diferente a origen |
| 3 | Se crea movimiento con estado "pendiente" |
| 4 | Se crea alerta "importante" |
| 5 | Admin/Jefe aprueba: se actualiza unidad_id del ítem |
| 6 | Admin/Jefe rechaza: se registra motivo_rechazo |
| 7 | Se cierra la alerta asociada |
| 8 | Se registra en auditoría |

### 8.3 Flujo de Baja

| Paso | Descripción |
|------|-------------|
| 1 | Usuario solicita baja (POST /api/movimientos/bajas) |
| 2 | Se crea movimiento con estado "pendiente" |
| 3 | Se crea alerta "crítica" |
| 4 | Admin/Jefe aprueba: estado del ítem = "baja" |
| 5 | Se guarda `categoria_original_id` = categoría actual |
| 6 | Se guarda `motivo_baja` = motivo del movimiento |
| 7 | Se guarda `fecha_baja` = fecha y hora actual |
| 8 | Se mueve ítem a categoría A8 (baja) |
| 9 | Se cierra la alerta asociada |
| 10 | Se registra en auditoría |

### 8.4 Flujo de Reactivación

| Paso | Descripción |
|------|-------------|
| 1 | Admin/Jefe accede al detalle del ítem (GET /api/items/{id}) |
| 2 | Si el ítem tiene estado "baja", se muestra botón "Reactivar ítem" |
| 3 | Se ingresa motivo de reactivación (requerido) |
| 4 | Se envía POST /api/items/{id}/reactivar con motivo |
| 5 | Se restaura `categoria_id` = `categoria_original_id` |
| 6 | Se limpian `motivo_baja`, `fecha_baja`, `categoria_original_id` |
| 7 | Se crea movimiento "alta" con estado "aprobado" |
| 8 | Se registra en auditoría con acción "reactivar" |

### 8.4 Generación de Código Único

**Formato:** `{Categoría}-{IdSede}-{IdUnidad}-{Secuencial}`

**Ejemplo:** `A1-03-47-000001`

| Parte | Descripción |
|-------|-------------|
| A1 | Código de categoría (2 caracteres) |
| 03 | ID de sede (2 dígitos) |
| 47 | ID de unidad (2 dígitos) |
| 000001 | Secuencial único (6 dígitos) |

**Algoritmo:**
1. Obtener código de categoría
2. Obtener ID de sede (formateado a 2 dígitos)
3. Obtener ID de unidad (formateado a 2 dígitos)
4. Buscar el último secuencial para esa combinación
5. Incrementar en 1 y formatear a 6 dígitos

### 8.5 Sistema de Campos Dinámicos

| Característica | Descripción |
|----------------|-------------|
| Campos generales | Aplican a todos los ítems de la categoría (tipo_item_id = null) |
| Campos por tipo | Aplican solo a un tipo específico de ítem |
| Tipos disponibles | texto, numero, fecha, select, textarea |
| Almacenamiento | Columna valores_dinamicos (JSON) en tabla items |

---

## 9. Frontend - Componentes y Rutas

### 9.1 Estructura de Directorios

| Directorio | Contenido |
|------------|-----------|
| src/components/ | Layout, Modal, Aviso, ItemForm, ItemDetalle, VirtualTable, Pagination, EmptyState, Skeleton, Image |
| src/pages/ | Login, Dashboard, Inventario, Movimientos, Categorias, Unidades, Alertas, Auditoria, Reportes |
| src/services/ | api.js (instancia Axios con AbortController) |
| src/context/ | AuthContext, ToastContext |
| src/hooks/ | useMediaQuery (responsive table/cards) |
| src/utils/ | helpers.js (extractApiError) |
| src/styles/ | auth, dashboard, inventario, categorias, form, modal, aviso, detalle, virtual-table, skeleton, empty-state, toast, image |
| src/index.css | Estilos globales |

### 9.2 Rutas

| Ruta | Componente | Protección | Roles |
|------|-----------|------------|-------|
| /login | Login | Pública | Todos |
| / | Dashboard | ProtectedRoute | Todos autenticados |
| /inventario | Inventario | ProtectedRoute | Todos autenticados |
| /categorias | Categorias | RoleRoute | admin |
| /unidades | Unidades | RoleRoute | admin |
| /movimientos | Movimientos | ProtectedRoute | admin, jefe, carga |
| /reportes | Reportes | ProtectedRoute | admin, jefe |
| /alertas | Alertas | ProtectedRoute | admin, jefe, carga |
| /auditoria | Auditoria | ProtectedRoute | admin, jefe |

### 9.3 Componentes Principales

| Componente | Función |
|------------|---------|
| Layout | Shell de la aplicación (sidebar + topbar + contenido), incluye toggle de tema (oscuro/claro) y botón de cambio de contraseña |
| Modal | Diálogo modal genérico (close on Escape, overlay click, body scroll lock) |
| Aviso | Banner de notificación auto-cerrable (5s) |
| ItemForm | Formulario para crear/editar ítems con validación inline, AbortController, confirmación al cambiar tipo |
| ItemDetalle | Vista de solo lectura del ítem con timeline unificado de movimientos y auditoría (scroll 300px) |
| VirtualTable | Tabla CSS con flex columns, scroll virtual (max-height: 70vh), columnas configurables |
| Pagination | Paginador con aria-live="polite", nav semántico |
| EmptyState | Estado vacío con iconos SVG (search, inventory, alert, box) |
| Skeleton | Placeholder de carga animado (pulse 1.4s) para tabla y cards |
| Image | Imagen con lazy loading, fallback, transición opacidad |

### 9.4 Servicios y Utilidades

| Archivo | Función |
|---------|---------|
| api.js | Instancia Axios con interceptores (token, 401), soporte AbortController |
| AuthContext | Proveedor de autenticación (login, logout, user) |
| ToastContext | Notificaciones toast (success, error, info) con auto-dismiss |
| helpers.js | extractApiError() - extrae mensajes de error de API |
| useMediaQuery.js | Hook para detectar breakpoint responsive (table vs cards) |

---

## 10. Sistema de Auditoría

### 10.1 Acciones Registradas

| Acción | Descripción |
|--------|-------------|
| login | Inicio de sesión |
| crear | Creación de entidad |
| editar | Edición de entidad |
| eliminar | Eliminación de entidad |
| aprobar | Aprobación de movimiento |
| rechazar | Rechazo de movimiento |
| solicitar | Solicitud de movimiento |
| mover | Reordenamiento de elementos |
| cerrar | Cierre de alerta |
| activar | Activación de sede/unidad |
| desactivar | Desactivación de sede/unidad |

### 10.2 Entidades Auditadas

| Entidad | Acciones auditadas |
|---------|-------------------|
| Usuarios | login |
| Items | crear, editar, eliminar |
| Categorías | crear, editar, eliminar |
| Campos Dinámicos | crear, editar, eliminar, mover |
| Tipos de Item | crear, editar, eliminar, mover |
| Sedes | crear, editar, eliminar, activar, desactivar |
| Unidades | crear, editar, eliminar, activar, desactivar |
| Movimientos | solicitar, aprobar, rechazar |
| Alertas | crear, cerrar |

### 10.3 Estructura del Registro

| Campo | Tipo | Descripción |
|-------|------|-------------|
| user_id | INT | Usuario que realizó la acción |
| accion | VARCHAR | Tipo de acción |
| entidad | VARCHAR | Nombre de la entidad |
| entidad_id | INT | ID de la entidad (nullable) |
| detalle | JSON | Información adicional |

---

## 11. Exportación de Datos

### 11.1 Tipos de Reporte

| Reporte | Descripción |
|---------|-------------|
| Por categoría | Código, nombre, cantidad de ítems |
| Por estado | Estado de conservación, cantidad |
| Por sede | Sede, cantidad |
| Por unidad | Unidad, cantidad |
| Top 20 | Elementos más frecuentes |
| Movimientos por mes | Últimos 6 meses |

### 11.2 Formatos de Exportación

| Formato | Uso | Contenido |
|---------|-----|-----------|
| Excel (.xlsx) | Reportes | Una hoja por categoría con campos dinámicos |
| CSV | Reportes | Separado por comas |
| JSON | Auditoría | Registros completos |
| PDF | Reportes | Generado con jsPDF + jspdf-autotable, incluye tablas de reportes |

---

## 12. Seguridad

| Área | Medida |
|------|--------|
| Autenticación | Contraseñas hasheadas con bcrypt |
| Tokens | Sanctum Personal Access Tokens |
| Almacenamiento | localStorage (no cookies) |
| Autorización | Middleware `rol` por endpoint |
| Validación | Reglas en todos los endpoints de escritura |
| Unicidad | Case-insensitive (sedes, unidades, categorías) |
| SQL Injection | Protegido por Eloquent ORM |
| Auditoría | Registro completo de acciones |
| Eliminación | Limpieza de dependencias antes de borrar |
| Cambio de contraseña | Endpoint protegido, requiere contraseña actual |
| Backup | Creación de respaldo SQL, acceso restringido a admin |

---

## 13. Requisitos de Instalación

### 13.1 Requisitos del Servidor

| Componente | Versión Mínima |
|------------|----------------|
| PHP | 8.2 |
| MySQL | 8.0 |
| Composer | 2.x |
| Node.js | 18.x |
| npm | 9.x |
| XAMPP | 8.x (recomendado) |

### 13.2 Instalación del Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve --port=8000
```

### 13.3 Instalación del Frontend

```bash
cd frontend
npm install
npm run dev
```

### 13.4 Comandos Artisan Útiles

| Comando | Descripción |
|---------|-------------|
| php artisan db:backup | Crear respaldo de la base de datos |
| php artisan migrate | Ejecutar migraciones |
| php artisan db:seed | Sembrar datos de prueba |
| php artisan serve | Iniciar servidor de desarrollo |

### 13.4 Variables de Entorno

| Variable | Valor |
|----------|-------|
| APP_NAME | SAGI |
| APP_ENV | local |
| APP_URL | http://localhost:5173 |
| DB_CONNECTION | mysql |
| DB_HOST | 127.0.0.1 |
| DB_PORT | 3306 |
| DB_DATABASE | sagi |
| DB_USERNAME | root |
| DB_PASSWORD | |
| SANCTUM_STATEFUL_DOMAINS | localhost:5173 |

---

## Apéndice: Estados del Sistema

### Estados de Ítem

| Estado | Descripción |
|--------|-------------|
| activo | Ítem en uso normal |
| pendiente | Ítem esperando aprobación |
| baja | Ítem dado de baja |

### Estados de Movimiento

| Estado | Descripción |
|--------|-------------|
| pendiente | Esperando aprobación |
| aprobado | Movimiento ejecutado |
| rechazado | Movimiento denegado |

### Estados de Alerta

| Estado | Descripción |
|--------|-------------|
| abierta | Alerta activa |
| cerrada | Alerta resuelta |

### Estados de Conservación

| Estado | Descripción |
|--------|-------------|
| Muy bueno | Como nuevo |
| Bueno | Uso normal, sin daños |
| Regular | Desgaste moderado |
| Malo | Requiere reparación/reemplazo |

---

## 14. Changelog

### v3.2 (27 agosto 2026)

#### Inventario - Filtros y Permisos
- **Filtro por estado**: Nuevo parámetro `estado` en `GET /api/items` para filtrar por activo/pendiente/baja
- **Eliminar restringido**: `DELETE /api/items/{id}` solo permite rol admin (antes admin/jefe/carga)
- **Movimientos preservados**: Al eliminar ítem, movimientos se conservan con `item_id=null` (antes se eliminaban)
- **Auditoría completa**: Al eliminar se guarda código, categoría, estado, unidad y responsable

#### Auditoría - Mejoras de visualización
- **Detalle de auditoría**: `formatearDetalle()` ahora detecta estructura `antes/despues` y solo muestra campos que cambiaron (diff)
- **Filtro entidad_id**: Endpoint `GET /api/auditoria` acepta parámetro `entidad_id` para filtrar por registro específico
- **Per_page configurable**: Endpoint acepta `per_page` (1-100, default 50)
- **Paginación unificada**: Auditoría usa componente `Pagination` con selector de cantidad de registros

#### Timeline del ítem unificado
- **Historial combinado**: `ItemDetalle` carga movimientos + registros de auditoría del ítem
- **Fusión cronológica**: Ambos tipos de eventos se ordenan por fecha descendente
- **Ediciones en timeline**: Las ediciones del ítem se muestran con badge azul y diff de cambios (campo: antes → después)
- **Estilos timeline**: Cards compactas (padding reducido, dots más pequeños, scroll 300px)

#### Responsive - Fixes
- **Zona muerta 769-900px**: `padding-bottom: 80px` aplicado correctamente para bottom-nav
- **Overflow imágenes**: Regla global `img, video, embed, iframe { max-width: 100% }`
- **Modal viewport**: `.modal-wide` usa `max-height: calc(100dvh - 32px)` con flex y body scrollable
- **Modal responsive**: Breakpoints unificados (768px, 480px) con `dvh` consistente
- **VirtualTable overflow**: `.virtual-cell:last-child { overflow: visible }` para iconos de acciones
- **Form selects**: `min-width: 0` previene overflow de selects en grids
- **Inventario iconos**: Botones de acción compactos (26x26, gap 2px)
- **Categorías wrap**: `campo-row` con flex-wrap en tablets, touch targets 32x32
- **Dashboard cards**: Grid `1fr` en 480px (antes forzaba 2 columnas)

### v3.1 (27 agosto 2026)

#### Baja con Trazabilidad
- **Migration**: Agregados campos `motivo_baja`, `fecha_baja`, `categoria_original_id` a tabla items
- **Modelo Item**: Campos fillable, casting datetime, relación `categoriaOriginal()`
- **Lógica de baja**: Al aprobar baja se guarda categoría original, motivo y fecha
- **Sin eliminación**: Los ítems dados de baja conservan todos sus registros

#### Reactivación de Ítems
- **Endpoint**: `POST /api/items/{id}/reactivar` (admin, jefe)
- **Validación**: Solo ítems con estado "baja" pueden ser reactivados
- **Motivo requerido**: Se debe ingresar motivo de reactivación
- **Historial**: Se crea movimiento "alta" aprobado para trazabilidad
- **Auditoría**: Se registra acción "reactivar" con detalle completo

#### Frontend - ItemDetalle
- **Botón reactivar**: Visible solo para admin/jefe en ítems de baja
- **Modal reactivación**: Formulario con motivo requerido
- **Información baja**: Muestra motivo_baja y fecha_baja para admin/jefe

#### Frontend - Inventario
- **Columna "Motivo Baja"**: Visible solo para admin/jefe
- **Indicador en cards**: Muestra motivo de baja en vista móvil
- **Estilos**: CSS para motivo_baja_text y item_card_motivo_baja

### v3.0 (26 agosto 2026)

#### Performance y Optimización
- **React.lazy** para carga bajo demanda de todas las páginas (code splitting)
- **VirtualTable** con scroll CSS virtual (max-height: 70vh) reemplazando tabla tradicional
- **Column toggle** para mostrar/ocultar columnas configurables en inventario
- **Anchos proporcionales** por columna (flex values: 0.4 a 2.0)
- **Compresión Brotli/Gzip** via middleware PrecompressResponse en Laravel
- **Image component** con lazy loading="lazy" y fallback
- **CSS code splitting** por página (Vite genera bundles separados)
- **useMediaQuery hook** para toggle table/cards sin doble DOM

#### ItemForm - Correcciones Críticas
- **AbortController** para cancelar requests obsoletos al cambiar categoría/tipo
- **Confirmación** antes de borrar campos dinámicos al cambiar tipo de elemento
- **Validación inline** con fieldErrors por campo, aria-invalid, mensajes en español
- **Motivo** cambiado de input a textarea
- **useMemo** para categorías filtradas

#### Inventario - Correcciones
- **Null safety** en estado_conservacion.replace() con optional chaining
- **.catch()** agregado a fetch de /categorias
- **useMemo** para sortedItems (evita re-orden en cada render)
- **Page reset** al cambiar búsqueda o filtro de categoría
- **Clear search** botón "×" para limpiar búsqueda
- **aria-labels** en inputs, botones y headers ordenables
- **Pagination** mejorado con nav semántico y aria-live

#### Sidebar
- **Fix hover** color cambiado de var(--color-white) (#232937) a #ffffff

#### Build
- **Vite 8.x** con target es2020
- **Build size** reducido a ~330KB gzipped total

### v2.0 (26 agosto 2026)

#### Mejoras de UI/UX
- Sidebar jerárquico con 4 bloques temáticos (Operaciones, Inventario, Configuración, Control)
- Iconos SVG en cada item del menú
- Sidebar colapsable en desktop (botón ‹)
- Grupos colapsables (acordeón)
- Bottom nav en móvil para accesos rápidos
- Active route con NavLink (resalta página actual)
- Badge de alertas dinámico con contador
- Cards en móvil + tabla en desktop
- Filtros colapsables en móvil
- Skeleton loading (reemplaza "Cargando...")
- Sticky header en tablas
- Empty states ilustrados (SVG)
- Toast notifications para acciones
- Ordenar columnas por click

#### Depuración de Código
- Eliminado `hasRole` muerto de AuthContext
- Eliminado import duplicado de `index.css` en Layout.jsx
- Extraído `extractApiError()` como utilidad compartida
- Extraído componente `Pagination` reutilizable
- Extraído componente `EmptyState` reutilizable
- Eliminados CSS classes duplicadas (`.badge-pendiente`, `.badge-baja`, `.editable-row`, `.scope-label`)
- Eliminado `.topbar-actions` duplicado de inventario.css
- Renombrado `.cards-grid` → `.stats-grid` en dashboard.css (evita colisión)
- Agregadas CSS variables faltantes (`--color-info`, `--color-text-secondary`, `--color-card`)

#### Backend
- Eliminados métodos muertos `esAdmin()` y `esJefe()` de User model
- Eliminado import `UserFactory` no utilizado de User model
- Eliminado trait `Notifiable` no utilizado de User model
- Eliminado import `DB` no utilizado de CategoriaController
- Eliminadas variables `$user` no utilizadas en DashboardController y ReporteController

---

*Documento generado el 26 de agosto de 2026*
*SAGI v3.0 - Instituto de Seguridad Pública*

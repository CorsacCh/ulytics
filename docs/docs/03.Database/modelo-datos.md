---
id: modelo-datos
title: Modelo de Datos
sidebar_position: 1
---

# Modelo de Datos

El modelo relacional de **ULYTICS** se implementa sobre **PostgreSQL** y se gestiona a través del ORM **Sequelize**. El esquema se organiza en tres dominios funcionales: **Catálogos y Accesos**, **Datos Académicos** y **Configuraciones y Guardado**.

A continuación se describen las entidades de cada dominio, sus campos clave y sus relaciones principales.

## Resumen de dominios

| Dominio | Entidades | Propósito |
| --- | --- | --- |
| Catálogos y Accesos | `Usuario`, `Carrera`, `Asignatura` | Personas con acceso al sistema y catálogos base de la oferta académica. |
| Datos Académicos | `Cohorte`, `Estudiante`, `Rendimiento` | Registro de la trayectoria estudiantil y del desempeño por asignatura. |
| Configuraciones y Guardado | `Filtro_Guardado`, `Reporte_Programado` | Preferencias de consulta y automatización de reportes por usuario. |

---

## 1. Dominio: Catálogos y Accesos

### `Usuario`

Personas con acceso al sistema (**Directores**, **Decanos** y **Administradores**).

| Campo | Descripción | Clave |
| --- | --- | --- |
| `id_usuario` | Identificador único del usuario. | **PK** |
| `nombre` | Nombre completo del usuario. | |
| `rol` | Rol asignado en el sistema (Director, Decano, Administrador). | |
| `email` | Correo electrónico de acceso. | |
| `password` | Contraseña de acceso (almacenada de forma segura). | |

**Relaciones:** 1 a N con `Carrera` (un usuario puede estar asociado a una o más carreras en calidad de director).

### `Carrera`

Programas de pregrado de la institución.

| Campo | Descripción | Clave |
| --- | --- | --- |
| `id_carrera` | Identificador único de la carrera. | **PK** |
| `codigo_carrera` | Código institucional de la carrera. | |
| `nombre` | Nombre del programa de pregrado. | |
| `id_director` | Director responsable de la carrera. | **FK** → `Usuario` |

**Relaciones:** 1 a N con `Cohorte` y con `Asignatura`.

### `Asignatura`

Catálogo de materias que componen una carrera.

| Campo | Descripción | Clave |
| --- | --- | --- |
| `id_asignatura` | Identificador único de la asignatura. | **PK** |
| `codigo_materia` | Código de la materia. | |
| `nombre` | Nombre de la asignatura. | |
| `semestre_malla` | Semestre en que se ubica dentro de la malla curricular. | |
| `id_carrera` | Carrera a la que pertenece la asignatura. | **FK** → `Carrera` |

**Relaciones:** 1 a N con `Rendimiento`.

---

## 2. Dominio: Datos Académicos

### `Cohorte`

Agrupación de alumnos según su año de ingreso.

| Campo | Descripción | Clave |
| --- | --- | --- |
| `id_cohorte` | Identificador único de la cohorte. | **PK** |
| `anio_ingreso` | Año de ingreso de la generación. | |
| `id_carrera` | Carrera a la que pertenece la cohorte. | **FK** → `Carrera` |

**Relaciones:** 1 a N con `Estudiante`.

### `Estudiante`

Datos del alumno y su estado académico.

| Campo | Descripción | Clave |
| --- | --- | --- |
| `id_estudiante` | Identificador único del estudiante. | **PK** |
| `rut_matricula` | RUT o número de matrícula del estudiante. | |
| `nombre_completo` | Nombre completo del estudiante. | |
| `id_cohorte` | Cohorte de ingreso del estudiante. | **FK** → `Cohorte` |
| `estado_general` | Estado general: `Activo`, `Desertor`, `Eliminado` o `Titulado`. | |
| `nivel_riesgo` | Nivel de riesgo: `Bajo`, `Medio`, `Crítico` o `NA`. | |

**Relaciones:** 1 a N con `Rendimiento`.

### `Rendimiento`

Tabla transaccional central que registra las notas y el histórico por asignatura cursada. A partir de esta entidad se calculan los **cuellos de botella** curriculares.

| Campo | Descripción | Clave |
| --- | --- | --- |
| `id_rendimiento` | Identificador único del registro de rendimiento. | **PK** |
| `id_estudiante` | Estudiante al que corresponde el registro. | **FK** → `Estudiante` |
| `id_asignatura` | Asignatura cursada. | **FK** → `Asignatura` |
| `periodo_academico` | Período académico en que se cursó la asignatura. | |
| `nota_final` | Calificación final obtenida. | |
| `estado` | Resultado de la asignatura: `Aprobado` o `Reprobado`. | |

**Relaciones:** Entidad asociativa que conecta `Estudiante` y `Asignatura`, materializando la relación N a N entre ambas.

---

## 3. Dominio: Configuraciones y Guardado

### `Filtro_Guardado`

Almacena las vistas o consultas frecuentes configuradas por cada usuario.

| Campo | Descripción | Clave |
| --- | --- | --- |
| `id_filtro` | Identificador único del filtro guardado. | **PK** |
| `id_usuario` | Usuario propietario de la vista. | **FK** → `Usuario` |
| `nombre_vista` | Nombre descriptivo de la vista guardada. | |
| `parametros_json` | Parámetros de la consulta serializados en JSON. | |

**Relaciones:** N a 1 con `Usuario`.

### `Reporte_Programado`

Configuración para el envío automatizado de reportes.

| Campo | Descripción | Clave |
| --- | --- | --- |
| `id_programacion` | Identificador único de la programación. | **PK** |
| `id_usuario` | Usuario que configura el envío. | **FK** → `Usuario` |
| `frecuencia` | Periodicidad del envío automatizado. | |
| `formato` | Formato del reporte: `PDF` o `Excel`. | |
| `email_destino` | Correo electrónico de destino. | |

**Relaciones:** N a 1 con `Usuario`.

---

## Resumen de relaciones

| Entidad origen | Cardinalidad | Entidad destino | Campo de enlace |
| --- | --- | --- | --- |
| `Usuario` | 1 : N | `Carrera` | `id_director` |
| `Carrera` | 1 : N | `Cohorte` | `id_carrera` |
| `Carrera` | 1 : N | `Asignatura` | `id_carrera` |
| `Cohorte` | 1 : N | `Estudiante` | `id_cohorte` |
| `Estudiante` | 1 : N | `Rendimiento` | `id_estudiante` |
| `Asignatura` | 1 : N | `Rendimiento` | `id_asignatura` |
| `Usuario` | 1 : N | `Filtro_Guardado` | `id_usuario` |
| `Usuario` | 1 : N | `Reporte_Programado` | `id_usuario` |

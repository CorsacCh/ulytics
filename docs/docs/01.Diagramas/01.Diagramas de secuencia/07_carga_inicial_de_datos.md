# Carga de Datos Académicos

```mermaid
sequenceDiagram
    %% Diagrama de Secuencia - Carga de Datos Académicos (US-ADM-03)

    actor admin as Administrador
    participant spa as Aplicación Cliente (SPA)
    participant carga_c as Controlador de Carga
    participant carga_s as Servicio de Procesamiento
    participant persist as Capa de Persistencia
    participant db as BD (esquema_carga)

    admin->>spa: 1. Selecciona archivo compatible y período académico
    activate spa

    spa->>carga_c: 2. cargaController.uploadDatos(token, id_periodo, archivo_csv)
    activate carga_c

    %% Validación de Autorización Interna
    carga_c->>carga_c: 3. Valida autorización<br>(Verifica Rol == Administrador)

    carga_c->>carga_s: 4. cargaService.procesarArchivo(id_periodo, archivo_csv)
    activate carga_s

    %% Verificación de Estructura (Criterio de Aceptación)
    carga_s->>carga_s: 5. Valida estructura del archivo<br>(cabeceras esperadas, tipos de datos)

    alt Estructura Inválida (No cumple el formato)
        carga_s-->>carga_c: 6a. Lanza Error(Estructura no válida)
        carga_c-->>spa: 7a. 400 Bad Request
        spa-->>admin: 8a. Muestra error: "El archivo no tiene el formato esperado"
    else Estructura Válida
        %% Asociar la carga al período y almacenar
        carga_s->>persist: 6b. cargaRepository.insertBatch(id_periodo, datos_procesados)
        activate persist
        
        persist->>db: 7b. INSERT INTO esquema_carga.datos_academicos<br>(id_periodo, ...) VALUES (...)
        activate db
        
        db-->>persist: 8b. Confirmación de inserción múltiple
        deactivate db
        
        persist-->>carga_s: 9b. Devuelve número de registros insertados
        deactivate persist
        
        carga_s-->>carga_c: 10b. Retorna éxito de procesamiento
        carga_c-->>spa: 11b. 201 Created (JSON confirmación)
        spa-->>admin: 12b. Muestra confirmación:<br>"Datos procesados e incorporados al período."
    end

    deactivate carga_s
    deactivate carga_c
    deactivate spa
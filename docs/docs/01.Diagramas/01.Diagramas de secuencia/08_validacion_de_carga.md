# Validación de Carga de Datos

```mermaid
sequenceDiagram
    %% Diagrama de Secuencia - Validar información cargada (US-ADM-08)

    actor admin as Administrador
    participant spa as Aplicación Cliente (SPA)
    participant carga_c as Controlador de Carga
    participant carga_s as Servicio de Procesamiento
    participant persist as Capa de Persistencia
    participant db as BD (esquema_carga)

    admin->>spa: 1. Solicita validar lote de datos<br>(id_carga)
    activate spa

    spa->>carga_c: 2. cargaController.validarDatos(token, id_carga)
    activate carga_c

    %% Validación de Autorización Interna
    carga_c->>carga_c: 3. Valida autorización<br>(Verifica Rol == Administrador)

    carga_c->>carga_s: 4. cargaService.procesarValidacion(id_carga)
    activate carga_s

    carga_s->>persist: 5. cargaRepository.obtenerRegistros(id_carga)
    activate persist

    persist->>db: 6. SELECT * FROM esquema_carga.datos_temporales<br>WHERE id_carga = ?
    activate db

    db-->>persist: 7. Retorna lote de datos sin procesar
    deactivate db

    persist-->>carga_s: 8. Devuelve registros para evaluación
    deactivate persist

    %% Proceso de validación (Criterios de Aceptación)
    carga_s->>carga_s: 9. Ejecuta reglas de validación<br>(tipos de dato, campos vacíos, coherencia)

    alt Contiene Errores (Carga Inválida)
        carga_s->>persist: 10a. cargaRepository.actualizarEstado(id_carga, "Con Errores", reporteErrores)
        activate persist
        
        persist->>db: 11a. UPDATE esquema_carga.historial_cargas<br>SET estado = 'Error', detalle = ? WHERE id_carga = ?
        activate db
        
        db-->>persist: 12a. Confirmación
        deactivate db
        
        persist-->>carga_s: 13a. Devuelve confirmación
        deactivate persist
        
        carga_s-->>carga_c: 14a. Retorna estado y detalle de errores
        carga_c-->>spa: 15a. 200 OK (JSON con listado detallado de errores)
        spa-->>admin: 16a. Muestra filas/columnas con error<br>y habilita opción "Reemplazar carga"
        
    else Sin Errores (Carga Exitosa)
        carga_s->>persist: 10b. cargaRepository.actualizarEstado(id_carga, "Validado")
        activate persist
        
        persist->>db: 11b. UPDATE esquema_carga.historial_cargas<br>SET estado = 'Validado' WHERE id_carga = ?
        activate db
        
        db-->>persist: 12b. Confirmación
        deactivate db
        
        persist-->>carga_s: 13b. Devuelve confirmación
        deactivate persist
        
        carga_s-->>carga_c: 14b. Retorna éxito
        carga_c-->>spa: 15b. 200 OK (JSON confirmación)
        spa-->>admin: 16b. Muestra confirmación:<br>"Datos validados correctamente"
    end

    deactivate carga_s
    deactivate carga_c
    deactivate spa
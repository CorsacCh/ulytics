# Gestión de Períodos Académicos

```mermaid
sequenceDiagram
    %% Diagrama de Secuencia - Gestionar Períodos Académicos (US-ADM-03)

    actor admin as Administrador
    participant spa as Aplicación Cliente (SPA)
    participant carga_c as Controlador de Carga
    participant carga_s as Servicio de Procesamiento
    participant persist as Capa de Persistencia
    participant db as BD (esquema_carga)

    %% Visualización de Períodos Existentes
    note right of admin: Visualización de Períodos Existentes
    
    admin->>spa: 1. Accede a la vista de gestión de períodos
    activate spa

    spa->>carga_c: 2. cargaController.getPeriodos(token)
    activate carga_c

    carga_c->>carga_c: 3. Valida autorización<br>(Rol == Administrador)

    carga_c->>carga_s: 4. cargaService.obtenerPeriodos()
    activate carga_s

    carga_s->>persist: 5. periodoRepository.findAll()
    activate persist

    persist->>db: 6. SELECT * FROM esquema_carga.periodos
    activate db
    
    db-->>persist: 7. Retorna lista de períodos y sus estados
    deactivate db

    persist-->>carga_s: 8. Devuelve entidades de período
    deactivate persist

    carga_s-->>carga_c: 9. Retorna datos
    carga_c-->>spa: 10. 200 OK (JSON con períodos)
    spa-->>admin: 11. Muestra listado de períodos y sus estados

    %% Creación de Nuevo Período
    note right of admin: Creación de Nuevo Período

    admin->>spa: 12. Ingresa datos del nuevo período<br>(ej. año, semestre)

    spa->>carga_c: 13. cargaController.createPeriodo(token, periodoData)

    carga_c->>carga_s: 14. cargaService.createPeriodo(periodoData)

    %% Verificación de Duplicidad
    carga_s->>persist: 15. periodoRepository.findByNombre(periodoData.nombre)
    activate persist

    persist->>db: 16. SELECT id_periodo FROM esquema_carga.periodos<br>WHERE nombre = ?
    activate db
    
    db-->>persist: 17. Retorna resultado
    deactivate db

    persist-->>carga_s: 18. Devuelve verificación
    deactivate persist

    alt Período ya registrado (Duplicidad detectada)
        carga_s-->>carga_c: 19a. Lanza Error(Período ya existe)
        carga_c-->>spa: 20a. 409 Conflict
        spa-->>admin: 21a. Muestra error:<br>"El período ya está registrado"
    else Período disponible (Éxito)
        carga_s->>persist: 19b. periodoRepository.create(periodoData)
        activate persist
        
        persist->>db: 20b. INSERT INTO esquema_carga.periodos<br>(nombre, estado) VALUES (?, ?)
        activate db
        
        db-->>persist: 21b. Confirmación de inserción
        deactivate db
        
        persist-->>carga_s: 22b. Devuelve entidad creada
        deactivate persist
        
        carga_s-->>carga_c: 23b. Retorna éxito
        carga_c-->>spa: 24b. 201 Created (JSON del período)
        spa-->>admin: 25b. Muestra confirmación:<br>"Período creado correctamente"
    end

    deactivate carga_s
    deactivate carga_c
    deactivate spa
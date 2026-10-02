# Asignar Unidad Académica

```mermaid
sequenceDiagram
    %% Diagrama de Secuencia - Asociar Usuario a Unidad Académica (US-ADM-12)

    actor admin as Administrador
    participant spa as Aplicación Cliente (SPA)
    participant admin_c as Controlador de Administración
    participant user_s as Servicio de Usuarios
    participant persist as Capa de Persistencia
    participant db as BD (esquema_usuario)

    admin->>spa: 1. Selecciona usuario, rol y unidad<br>(id_usuario, rol, id_ambito)
    activate spa

    spa->>admin_c: 2. adminController.updateUserScope(token, id_usuario, rol, id_ambito)
    activate admin_c

    %% Validación de Autorización Interna
    admin_c->>admin_c: 3. Valida autorización<br>(Verifica Rol == Administrador)

    alt Usuario NO es Administrador
        admin_c-->>spa: 4a. 403 Forbidden
        spa-->>admin: 5a. Muestra error: "No autorizado"
    else Usuario SÍ es Administrador
        admin_c->>user_s: 4b. userService.assignScope(id_usuario, rol, id_ambito)
        activate user_s
        
        %% Verificación de coherencia Rol-Ámbito
        user_s->>user_s: 5b. Valida correspondencia<br>Rol <-> Ámbito
        
        alt Correspondencia Inválida
            user_s-->>admin_c: 6c. Lanza Error(Conflicto Rol-Ámbito)
            admin_c-->>spa: 7c. 400 Bad Request
            spa-->>admin: 8c. Muestra error: "Ámbito inválido para el rol"
        else Correspondencia Válida
            user_s->>persist: 6d. userRepository.findById(id_usuario)
            activate persist
            
            persist->>db: 7d. SELECT id_usuario FROM esquema_usuario.usuarios<br>WHERE id_usuario = ?
            activate db
            
            db-->>persist: 8d. Retorna registro
            deactivate db
            
            persist-->>user_s: 9d. Devuelve entidad
            deactivate persist
            
            alt Usuario NO existe
                user_s-->>admin_c: 10e. Lanza Error(No encontrado)
                admin_c-->>spa: 11e. 404 Not Found
                spa-->>admin: 12e. Muestra error: "Usuario no existe"
            else Usuario existe
                %% Actualización del Ámbito
                user_s->>persist: 10f. userRepository.updateScope(id_usuario, id_ambito)
                activate persist
                
                persist->>db: 11f. UPDATE esquema_usuario.usuarios<br>SET id_ambito = ? WHERE id_usuario = ?
                activate db
                
                db-->>persist: 12f. Confirmación de actualización
                deactivate db
                
                persist-->>user_s: 13f. Devuelve entidad actualizada
                deactivate persist
                
                user_s-->>admin_c: 14f. Retorna datos
                admin_c-->>spa: 15f. 200 OK
                spa-->>admin: 16f. Muestra confirmación:<br>"Ámbito asignado"
            end
        end
        deactivate user_s
    end

    deactivate admin_c
    deactivate spa
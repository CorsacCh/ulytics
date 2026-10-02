# Asignar Roles de Usuario

```mermaid
sequenceDiagram
    %% Diagrama de Secuencia - Asignar Rol de Usuario (US-ADM-12)

    actor admin as Administrador
    participant spa as Aplicación Cliente (SPA)
    participant admin_c as Controlador de Administración
    participant user_s as Servicio de Usuarios
    participant persist as Capa de Persistencia
    participant db as BD (esquema_usuario)

    admin->>spa: 1. Selecciona usuario y asigna nuevo rol<br>(id_usuario, nuevo_rol)
    activate spa

    spa->>admin_c: 2. adminController.updateUserRole(token, id_usuario, nuevo_rol)
    activate admin_c

    %% Validación de Autorización Interna
    admin_c->>admin_c: 3. Valida autorización<br>(Verifica Rol == Administrador)

    alt Usuario que solicita NO es Administrador
        admin_c-->>spa: 4a. 403 Forbidden
        spa-->>admin: 5a. Muestra error: "No autorizado para modificar roles"
    else Usuario SÍ es Administrador
        admin_c->>user_s: 4b. userService.assignRole(id_usuario, nuevo_rol)
        activate user_s
        
        %% Verificación de existencia del usuario objetivo
        user_s->>persist: 5b. userRepository.findById(id_usuario)
        activate persist
        
        persist->>db: 6b. SELECT * FROM esquema_usuario.usuarios<br>WHERE id_usuario = ?
        activate db
        
        db-->>persist: 7b. Retorna registro del usuario
        deactivate db
        
        persist-->>user_s: 8b. Devuelve entidad de usuario
        deactivate persist
        
        alt Usuario a modificar NO existe
            user_s-->>admin_c: 9c. Lanza Error(Usuario no encontrado)
            admin_c-->>spa: 10c. 404 Not Found
            spa-->>admin: 11c. Muestra error: "El usuario no existe"
        else Usuario existe (Flujo Ideal)
            %% Actualización del Rol
            user_s->>persist: 9d. userRepository.updateRole(id_usuario, nuevo_rol)
            activate persist
            
            persist->>db: 10d. UPDATE esquema_usuario.usuarios<br>SET rol = ? WHERE id_usuario = ?
            activate db
            
            db-->>persist: 11d. Confirmación de actualización
            deactivate db
            
            persist-->>user_s: 12d. Devuelve entidad actualizada
            deactivate persist
            
            user_s-->>admin_c: 13d. Retorna éxito y datos actualizados
            admin_c-->>spa: 14d. 200 OK (JSON usuario actualizado)
            spa-->>admin: 15d. Muestra confirmación:<br>"Rol asignado correctamente"
        end
        deactivate user_s
    end

    deactivate admin_c
    deactivate spa
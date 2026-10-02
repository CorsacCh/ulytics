# Gestion de Usuarios

```mermaid
sequenceDiagram
    %% Diagrama de Secuencia - Registro de Usuarios (US-ADM-12)
    
    actor admin as Administrador
    participant spa as Aplicación Cliente (SPA)
    participant admin_c as Controlador de Administración
    participant user_s as Servicio de Usuarios
    participant persist as Capa de Persistencia
    participant db as BD (esquema_usuario)

    %% Flujo Principal
    admin->>spa: 1. Ingresa datos obligatorios<br>(nombre, email, rol, id_ambito)
    activate spa

    spa->>admin_c: 2. adminController.createUser(token, userData)
    activate admin_c

    %% Validación de Autorización Interna
    admin_c->>admin_c: 3. Valida autorización<br>(Verifica Rol == Administrador)

    admin_c->>user_s: 4. userService.createUser(userData)
    activate user_s

    %% Validación de Duplicidad
    user_s->>persist: 5. userRepository.findByEmail(userData.email)
    activate persist

    persist->>db: 6. SELECT id_usuario FROM esquema_usuario.usuarios<br>WHERE email = ?
    activate db

    db-->>persist: 7. Retorna resultado (nulo o registro)
    deactivate db

    persist-->>user_s: 8. Devuelve verificación de existencia
    deactivate persist

    %% Flujos Alternativos (Fragmento Combinado)
    alt Identificador ya registrado (Duplicado)
        user_s-->>admin_c: 9a. Lanza Error(Usuario ya existe)
        admin_c-->>spa: 10a. 409 Conflict
        spa-->>admin: 11a. Muestra error: "El usuario ya está registrado"
        
    else Identificador disponible (Éxito)
        user_s->>persist: 9b. userRepository.create(userData)
        activate persist
        
        persist->>db: 10b. INSERT INTO esquema_usuario.usuarios<br>(nombre, email, rol, id_ambito, password)<br>VALUES (?, ?, ?, ?, ?)
        activate db
        
        db-->>persist: 11b. Confirmación de inserción
        deactivate db
        
        persist-->>user_s: 12b. Devuelve nueva entidad creada
        deactivate persist
        
        user_s-->>admin_c: 13b. Retorna datos del nuevo usuario
        admin_c-->>spa: 14b. 201 Created (JSON del usuario)
        spa-->>admin: 15b. Muestra confirmación y actualiza tabla
    end

    %% Fin de Líneas de Vida
    deactivate user_s
    deactivate admin_c
    deactivate spa
# Inicio de Sesión (Login)

```mermaid
sequenceDiagram
    %% Diagrama de Secuencia - Inicio de Sesión ULYTICS
    actor user as Usuario
    participant spa as Aplicación Cliente (SPA)
    participant auth_c as Controlador de Autenticación
    participant auth_s as Servicio de Autenticación
    participant persist as Capa de Persistencia
    participant db as BD (esquema_usuario)

    %% Inicio de la línea de vida
    user->>spa: Ingresa credenciales (email y contraseña)
    activate spa

    spa->>auth_c: authController.login(email, password)
    activate auth_c

    auth_c->>auth_s: authService.authenticateUser(email, password)
    activate auth_s

    auth_s->>persist: userRepository.findByEmail(email)
    activate persist

    %% Interacción con Base de Datos
    persist->>db: SELECT * FROM esquema_usuario.usuarios<br>WHERE email = ?
    activate db

    db-->>persist: Retorna registro (hash_password, rol, estado, id_ambito)
    deactivate db

    persist-->>auth_s: Devuelve entidad de usuario
    deactivate persist

    %% Fragmentos combinados para flujos alternativos (alt/else)
    alt Si el usuario existe y está activo
        auth_s->>auth_s: bcrypt.compare(password, hash_password)
        
        alt Si la contraseña es correcta
            auth_s->>auth_s: jwt.sign(payload: {id, rol, id_ambito})
            auth_s-->>auth_c: Retorna { token, user_data }
            auth_c-->>spa: 200 OK (JSON con token)
            spa-->>user: Guarda token y redirige al dashboard según rol
            
        else Contraseña incorrecta
            auth_s-->>auth_c: Lanza Error(Credenciales inválidas)
            auth_c-->>spa: 401 Unauthorized
            spa-->>user: Muestra mensaje de error
        end
        
    else Usuario no existe o inactivo
        auth_s-->>auth_c: Lanza Error(Usuario no encontrado/inactivo)
        auth_c-->>spa: 401/403 Error
        spa-->>user: Muestra mensaje de error
    end

    %% Fin de las líneas de vida
    deactivate auth_s
    deactivate auth_c
    deactivate spa
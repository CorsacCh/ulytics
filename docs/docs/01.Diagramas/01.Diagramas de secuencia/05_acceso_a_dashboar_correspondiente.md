# Acceso a Dashboard

```mermaid
sequenceDiagram
    %% Diagrama de Secuencia - Acceso a Interfaz por Rol y Vistas Autorizadas

    actor user as Usuario Autorizado
    participant spa as Aplicación Cliente (SPA)
    participant rep_c as Controlador de Reportería
    participant met_s as Servicio de Analítica
    participant persist as Capa de Persistencia
    participant db as BD (esquema_academico)

    %% Renderizado Inicial del Menú
    user->>spa: 1. Inicia sesión y accede a la plataforma (/dashboard)
    activate spa

    spa->>spa: 2. Lee token de sesión JWT<br>y determina Rol (Admin, Decano, etc.)
    spa-->>user: 3. Renderiza Menú/Sidebar<br>correspondiente al perfil

    %% Petición de Vistas
    user->>spa: 4. Navega a sección específica<br>(ej. Progresión Académica)

    spa->>rep_c: 5. reporteriaController.getDashboardData(token, id_ambito)
    activate rep_c

    %% Seguridad: Backend valida contra el Token para evitar navegación no autorizada
    rep_c->>rep_c: 6. Valida permisos del token<br>para la ruta solicitada

    %% Flujos Alternativos (Fragmentos Combinados)
    alt Acceso NO Autorizado (Violación de URL)
        rep_c-->>spa: 7a. 403 Forbidden
        spa-->>user: 8a. Bloquea navegación y muestra error:<br>"Acceso denegado a esta sección"
        
    else Acceso Autorizado
        rep_c->>met_s: 7b. analiticaService.getMetrics(rol, id_ambito)
        activate met_s
        
        alt Uso de contenido de prueba (Fase Inicial de desarrollo)
            met_s-->>rep_c: 8c. Retorna JSON estático con datos simulados (Mock)
        else Datos reales (Fase Definitiva)
            met_s->>persist: 8d. metricRepository.fetchAcademica(id_ambito)
            activate persist
            
            persist->>db: 9d. SELECT * FROM esquema_academico.datos_progresion<br>WHERE ambito = ?
            activate db
            
            db-->>persist: 10d. Retorna registros académicos
            deactivate db
            
            persist-->>met_s: 11d. Devuelve entidades procesadas
            deactivate persist
            
            met_s-->>rep_c: 12d. Retorna métricas definitivas procesadas
        end
        
        deactivate met_s
        
        rep_c-->>spa: 13. 200 OK (JSON con datos de la vista)
        spa-->>user: 14. Renderiza vista y gráficos<br>autorizados
    end

    deactivate rep_c
    deactivate spa
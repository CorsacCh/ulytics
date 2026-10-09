# Uso de Filtros 

```mermaid
sequenceDiagram
    %% Diagrama de Secuencia - Filtrar, comparar y profundizar (HU-S2-05)

    actor user as Usuario (Autoridad/Decano/Director)
    participant spa as Aplicación Cliente (SPA)
    participant rep_c as Controlador de Reportería
    participant met_s as Servicio de Analítica
    participant db as BD (PostgreSQL)

    %% Uso de Filtros Específicos de la Interfaz
    user->>spa: 1. Ajusta rangos de "Cohorte" (Desde / Hasta)
    user->>spa: 2. Ajusta rangos de "Año de medición" (Desde / Hasta)
    activate spa

    spa->>rep_c: 3. reporteriaController.getDashboardData(token, id_ambito, filtros)
    activate rep_c

    rep_c->>met_s: 4. analiticaService.getMetrics(id_ambito, {cohorte_min, cohorte_max, anio_min, anio_max})
    activate met_s

    met_s->>db: 5. SELECT * FROM esquema_academico WHERE filtros...
    activate db
    db-->>met_s: 6. Retorna dataset acotado a los rangos
    deactivate db

    met_s-->>rep_c: 7. Devuelve métricas procesadas
    deactivate met_s

    rep_c-->>spa: 8. 200 OK (JSON con datos filtrados)
    deactivate rep_c

    spa-->>user: 9. Actualiza el Gráfico interactivo (ej. Líneas de Retención o Barras de Eficiencia)

    %% Alternancia de Vista de Datos
    user->>spa: 10. Hace clic en el toggle "Tabla" (en lugar de "Gráfico")
    spa-->>user: 11. Renderiza los mismos datos en formato tabular sin recargar
    deactivate spa
# Exportación de Reporterías

```mermaid
sequenceDiagram
    %% Diagrama de Secuencia - Generar y exportar reporterías (HU-S2-06)

    actor user as Usuario (Visor)
    participant spa as Aplicación Cliente (SPA)
    participant pdf as jsPDF (Librería PDF)
    participant xlsx as SheetJS (Librería Excel)

    user->>spa: 1. Navega a la vista "Reportería"
    activate spa
    spa-->>user: 2. Renderiza panel de "Selección de contenido" (Analítica y Curricular)

    %% Selección interactiva
    user->>spa: 3. Marca los checkboxes de los indicadores deseados<br/>(o hace clic en "Seleccionar todo")
    spa->>spa: 4. Actualiza estado local con los indicadores a exportar

    %% Bifurcación según formato de salida
    alt Exportar a PDF (Reporte Consolidado)
        user->>spa: 5a. Hace clic en "Exportar a PDF"
        spa->>pdf: 6a. Envía datos y contexto de los indicadores marcados
        activate pdf
        pdf->>pdf: 7a. Maqueta documento iterando solo sobre la selección
        pdf-->>spa: 8a. Genera blob del documento .pdf
        deactivate pdf
        spa-->>user: 9a. Descarga archivo "Reporteria_ULYTICS.pdf"
        
    else Exportar a Excel (Datos Crudos Tabulares)
        user->>spa: 5b. Hace clic en "Exportar a Excel"
        spa->>xlsx: 6b. Envía arrays de datos de los indicadores marcados
        activate xlsx
        xlsx->>xlsx: 7b. Crea hojas (sheets) independientes por cada indicador
        xlsx-->>spa: 8b. Genera blob de la planilla .xlsx
        deactivate xlsx
        spa-->>user: 9b. Descarga archivo "Reporteria_ULYTICS.xlsx"
    end

    deactivate spa
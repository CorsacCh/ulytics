

La implementación de carga masiva reside en el backend (Express) utilizando Multer para recibir el archivo Excel y xlsx para extraer su contenido en memoria. El controlador (carga.controller.js) procesa las hojas y emplea transacciones de Sequelize con operaciones upsert sobre PostgreSQL. Esto asegura la inserción eficiente de dimensiones y métricas, evita registros duplicados por año, y garantiza la integridad de los datos mediante rollbacks automáticos ante cualquier error.

Detalles Importantes de esta Implementación:

Regla de negocio upsert: Usé el método .upsert() de Sequelize para las Fact_Tables. Gracias a la restricción UNIQUE (car_codigo, anio) que tú definiste en el diagrama DDL, si se sube un archivo corregido del mismo año, el sistema no duplicará registros, sino que sobrescribirá/actualizará la métrica de ese año para esa carrera, asegurando la consistencia del Dashboard.

Reglas de Validación Inicial (Checklist Tarea 2): Se verifica si las hojas obligatorias existen y si vienen las llaves de integridad (como CarCodigo y Macrounidad). Si falta uno, la transacción falla, se hace rollback y no se sube basura.

Métrica Asignatura Crítica: Implementé la regla lógica de tu documento que dicta que es_critica = true si la tasa de reprobación >= 0.30 (30%), almacenándolo pre-calculado en la base de datos para consultas rápidas.
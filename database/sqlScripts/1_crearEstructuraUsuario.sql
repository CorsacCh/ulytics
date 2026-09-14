-- ==========================================
-- 1. Creación de Tabla: Rol
-- ==========================================
CREATE TABLE Rol (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(200)
);

-- ==========================================
-- 2. Creación de Tabla: Usuario
-- ==========================================
CREATE TABLE Usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL,
    activo BOOLEAN DEFAULT true,
    
    -- Clave foránea que conecta con la tabla Rol
    CONSTRAINT fk_usuario_rol 
        FOREIGN KEY (rol_id) 
        REFERENCES Rol (id_rol)
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

-- ==========================================
-- 3. (Opcional) Índices adicionales
-- ==========================================
-- PostgreSQL crea automáticamente un índice B-tree para las restricciones UNIQUE y PRIMARY KEY.
-- Sin embargo, si buscas usuarios frecuentemente por su estado activo, un índice puede mejorar el rendimiento:
CREATE INDEX idx_usuario_activo ON Usuario(activo);
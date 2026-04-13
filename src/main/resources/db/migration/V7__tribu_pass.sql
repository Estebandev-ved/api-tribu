-- =============================================
-- V7: MÓDULO TRIBU PASS (Suscripción mensual)
-- =============================================

-- Tabla principal de suscripciones Tribu Pass
CREATE TABLE IF NOT EXISTS tribu_pass (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL UNIQUE,
    estado VARCHAR(15) DEFAULT 'ACTIVA',
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_renovacion TIMESTAMP NOT NULL,
    precio DOUBLE DEFAULT 9900.0,
    metodo_pago VARCHAR(20),
    renovacion_automatica BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Historial de renovaciones
CREATE TABLE IF NOT EXISTS tribu_pass_renovaciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pass_id BIGINT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    monto DOUBLE NOT NULL,
    estado VARCHAR(10) NOT NULL,
    movimiento_id BIGINT,
    FOREIGN KEY (pass_id) REFERENCES tribu_pass(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Agregar columna tribu_pass_activa a usuarios
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'tribu_pass_activa'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE usuarios ADD COLUMN tribu_pass_activa BOOLEAN DEFAULT false',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar tipo de movimiento para pago de Tribu Pass
SET @tipo_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'movimientos_saldo'
    AND COLUMN_NAME = 'tipo'
);

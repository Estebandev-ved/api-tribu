-- =============================================
-- V7: MÓDULO TRIBU PASS (Suscripción mensual)
-- NOTA: Se reemplaza SET @sql/PREPARE suelto por procedimientos almacenados
-- para compatibilidad con MySQL 8.x en Aiven/DigitalOcean.
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

-- Agregar columnas de forma segura usando procedimiento
DROP PROCEDURE IF EXISTS add_col_v7;
CREATE PROCEDURE add_col_v7(IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_definition TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_column
    ) THEN
        SET @s = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
        PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
    END IF;
END;

CALL add_col_v7('usuarios',          'tribu_pass_activa', 'BOOLEAN DEFAULT false');
CALL add_col_v7('movimientos_saldo', 'tipo',              'VARCHAR(30)');

DROP PROCEDURE IF EXISTS add_col_v7;

-- V3__infraestructura.sql
-- Módulo 5: Infraestructura (Telegram, Inventario, Push Notifications)
-- NOTA DE SEGURIDAD: Usa IF NOT EXISTS para idempotencia sin sentencias PREPARE dinámicas
-- que pueden fallar en MySQL cloud (PlanetScale, DigitalOcean Managed MySQL, etc.)

-- Campos de inventario inteligente en productos
-- Se usa ALTER TABLE IGNORE / procedimiento para compatibilidad cross-version

-- Procedimiento temporal para agregar columnas solo si no existen
DROP PROCEDURE IF EXISTS add_column_if_not_exists_v3;

CREATE PROCEDURE add_column_if_not_exists_v3(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
          AND COLUMN_NAME = p_column
    ) THEN
        SET @alter_sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
        PREPARE alter_stmt FROM @alter_sql;
        EXECUTE alter_stmt;
        DEALLOCATE PREPARE alter_stmt;
    END IF;
END;

CALL add_column_if_not_exists_v3('productos', 'stock_minimo', 'INT DEFAULT 5');
CALL add_column_if_not_exists_v3('productos', 'stock_critico', 'INT DEFAULT 3');
CALL add_column_if_not_exists_v3('productos', 'alerta_enviada_en', 'TIMESTAMP NULL');

DROP PROCEDURE IF EXISTS add_column_if_not_exists_v3;

-- Tabla de suscripciones push para PWA
CREATE TABLE IF NOT EXISTS push_suscripciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    activa BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent VARCHAR(200),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    INDEX idx_push_usuario (usuario_id)
);

-- Tabla de alertas del sistema (para comando /alertas del bot)
CREATE TABLE IF NOT EXISTS alertas_sistema (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    mensaje TEXT NOT NULL,
    resuelta BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMP NULL,
    INDEX idx_alertas_tipo (tipo),
    INDEX idx_alertas_resuelta (resuelta)
);

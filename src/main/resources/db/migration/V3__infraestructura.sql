-- V3__infraestructura.sql
-- Módulo 5: Infraestructura (Telegram, Inventario, Push Notifications)

-- Campos de inventario inteligente en productos
-- MySQL no soporta ADD COLUMN IF NOT EXISTS en todas las versiones,
-- se agrega cada columna de forma condicional.

-- stock_minimo
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'productos'
      AND COLUMN_NAME = 'stock_minimo'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE productos ADD COLUMN stock_minimo INT DEFAULT 5',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- stock_critico
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'productos'
      AND COLUMN_NAME = 'stock_critico'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE productos ADD COLUMN stock_critico INT DEFAULT 3',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- alerta_enviada_en
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'productos'
      AND COLUMN_NAME = 'alerta_enviada_en'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE productos ADD COLUMN alerta_enviada_en TIMESTAMP NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

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

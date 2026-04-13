-- =============================================
-- V2: SISTEMA DE TIERS VIP
-- Idempotente: safe to run multiple times
-- =============================================

-- 1. Crear tabla de tiers
CREATE TABLE IF NOT EXISTS tiers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE,
    orden INT NOT NULL,
    umbral_compras_mes DOUBLE NOT NULL DEFAULT 0,
    regla_promocion VARCHAR(200),
    descripcion VARCHAR(300)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Crear tabla de beneficios por tier
CREATE TABLE IF NOT EXISTS tier_benefits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tier_id BIGINT NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    valor VARCHAR(50) NOT NULL,
    descripcion VARCHAR(200),
    CONSTRAINT fk_tier_benefit_tier FOREIGN KEY (tier_id) REFERENCES tiers(id) ON DELETE CASCADE,
    INDEX idx_tier_benefit_tier_tipo (tier_id, tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Agregar columna tier_actual_id a usuarios (si no existe)
-- Nota: MySQL no soporta IF NOT EXISTS para ADD COLUMN, se usa procedimiento
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'tier_actual_id'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE usuarios ADD COLUMN tier_actual_id BIGINT, ADD CONSTRAINT fk_usuario_tier FOREIGN KEY (tier_actual_id) REFERENCES tiers(id)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Insertar tiers iniciales (idempotente con INSERT IGNORE)
INSERT IGNORE INTO tiers (nombre, orden, umbral_compras_mes, regla_promocion, descripcion) VALUES
('BRONCE', 1, 0,      '#comprasMes >= 0',      'Nivel inicial. Cashback del 1% y acceso a la ruleta diaria.'),
('PLATA',  2, 200000, '#comprasMes >= 200000', 'Compras >= $200.000/mes. Cashback del 3% y mayor límite de ruleta.'),
('ORO',    3, 500000, '#comprasMes >= 500000', 'Compras >= $500.000/mes. Cashback del 5%, envío gratis y ruleta premium.');

-- 5. Insertar beneficios BRONCE
INSERT IGNORE INTO tier_benefits (tier_id, tipo, valor, descripcion)
SELECT t.id, b.tipo, b.valor, b.descripcion
FROM tiers t
CROSS JOIN (
    SELECT 'CASHBACK_PCT' AS tipo,         '0.01' AS valor, 'Cashback del 1% en cada compra' AS descripcion
    UNION ALL SELECT 'RULETA_HABILITADA',  'true',          'Ruleta diaria activa'
    UNION ALL SELECT 'RULETA_LIMITE_DIARIO','5000',         'Hasta $5.000 en la ruleta diaria'
    UNION ALL SELECT 'ENVIO_GRATIS',       'false',         'Envío con costo estándar'
) b
WHERE t.nombre = 'BRONCE'
AND NOT EXISTS (
    SELECT 1 FROM tier_benefits tb WHERE tb.tier_id = t.id AND tb.tipo = b.tipo
);

-- 6. Insertar beneficios PLATA
INSERT IGNORE INTO tier_benefits (tier_id, tipo, valor, descripcion)
SELECT t.id, b.tipo, b.valor, b.descripcion
FROM tiers t
CROSS JOIN (
    SELECT 'CASHBACK_PCT' AS tipo,         '0.03' AS valor, 'Cashback del 3% en cada compra' AS descripcion
    UNION ALL SELECT 'RULETA_HABILITADA',  'true',          'Ruleta diaria activa'
    UNION ALL SELECT 'RULETA_LIMITE_DIARIO','10000',        'Hasta $10.000 en la ruleta diaria'
    UNION ALL SELECT 'ENVIO_GRATIS',       'false',         'Envío con costo estándar'
) b
WHERE t.nombre = 'PLATA'
AND NOT EXISTS (
    SELECT 1 FROM tier_benefits tb WHERE tb.tier_id = t.id AND tb.tipo = b.tipo
);

-- 7. Insertar beneficios ORO
INSERT IGNORE INTO tier_benefits (tier_id, tipo, valor, descripcion)
SELECT t.id, b.tipo, b.valor, b.descripcion
FROM tiers t
CROSS JOIN (
    SELECT 'CASHBACK_PCT' AS tipo,         '0.05' AS valor, 'Cashback del 5% en cada compra' AS descripcion
    UNION ALL SELECT 'RULETA_HABILITADA',  'true',          'Ruleta diaria activa'
    UNION ALL SELECT 'RULETA_LIMITE_DIARIO','20000',        'Hasta $20.000 en la ruleta diaria'
    UNION ALL SELECT 'ENVIO_GRATIS',       'true',          'Envío gratis en todos los pedidos'
) b
WHERE t.nombre = 'ORO'
AND NOT EXISTS (
    SELECT 1 FROM tier_benefits tb WHERE tb.tier_id = t.id AND tb.tipo = b.tipo
);

-- 8. Migrar usuarios existentes: asignar BRONCE si no tienen tier
UPDATE usuarios
SET tier_actual_id = (SELECT id FROM tiers WHERE nombre = 'BRONCE')
WHERE tier_actual_id IS NULL;

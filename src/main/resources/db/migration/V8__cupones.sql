-- =============================================
-- V8: MÓDULO CUPONES Y CÓDIGOS DESCUENTO
-- =============================================

-- Tabla de cupones
CREATE TABLE IF NOT EXISTS cupones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL,
    valor DOUBLE NOT NULL,
    monto_minimo DOUBLE,
    monto_maximo_descuento DOUBLE,
    usos_por_usuario INT DEFAULT 1,
    usos_maximos INT,
    usos_actuales INT DEFAULT 0,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_expiracion TIMESTAMP NOT NULL,
    activo BOOLEAN DEFAULT true,
    creado_por VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cupon_codigo (codigo),
    INDEX idx_cupon_activo (activo),
    INDEX idx_cupon_expiracion (fecha_expiracion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de relación cupones-tiers (nullable = todos los tiers)
CREATE TABLE IF NOT EXISTS cupon_tiers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cupon_id BIGINT NOT NULL,
    tier_id BIGINT NOT NULL,
    FOREIGN KEY (cupon_id) REFERENCES cupones(id) ON DELETE CASCADE,
    FOREIGN KEY (tier_id) REFERENCES tiers(id) ON DELETE CASCADE,
    UNIQUE KEY uk_cupon_tier (cupon_id, tier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de usos de cupones por usuario
CREATE TABLE IF NOT EXISTS cupon_usos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cupon_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    pedido_id BIGINT,
    descuento_aplicado DOUBLE NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cupon_id) REFERENCES cupones(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL,
    INDEX idx_cupon_uso_usuario (usuario_id),
    INDEX idx_cupon_uso_cupon (cupon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

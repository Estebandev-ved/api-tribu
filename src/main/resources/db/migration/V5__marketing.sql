-- =============================================
-- V5: MÓDULO MARKETING
-- Campañas de Cashback, Marketing, Carrito Abandonado y Recomendaciones
-- =============================================

-- Campañas de Cashback
CREATE TABLE IF NOT EXISTS campanas_cashback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(300),
    multiplicador DOUBLE NOT NULL DEFAULT 2.0,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    activa BOOLEAN DEFAULT false,
    limite_uso_total INT,
    limite_uso_por_usuario INT DEFAULT 1,
    usos_actuales INT DEFAULT 0,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS campana_uso (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    campana_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    pedido_id BIGINT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_campana_usuario (campana_id, usuario_id),
    FOREIGN KEY (campana_id) REFERENCES campanas_cashback(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL,
    INDEX idx_campana_uso_campana (campana_id),
    INDEX idx_campana_uso_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Relación many-to-many para tiers aplicables
CREATE TABLE IF NOT EXISTS campana_tiers (
    campana_id BIGINT NOT NULL,
    tier_id BIGINT NOT NULL,
    PRIMARY KEY (campana_id, tier_id),
    FOREIGN KEY (campana_id) REFERENCES campanas_cashback(id) ON DELETE CASCADE,
    FOREIGN KEY (tier_id) REFERENCES tiers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Campañas de Marketing
CREATE TABLE IF NOT EXISTS campanas_marketing (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    cuerpo TEXT,
    tipo VARCHAR(10) NOT NULL,
    segmento VARCHAR(30) NOT NULL,
    estado VARCHAR(20) DEFAULT 'BORRADOR',
    fecha_programada TIMESTAMP,
    total_enviados INT DEFAULT 0,
    total_abiertos INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Carritos Abandonados
CREATE TABLE IF NOT EXISTS carritos_abandonados (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL UNIQUE,
    estado VARCHAR(20) DEFAULT 'ACTIVO',
    total_estimado DOUBLE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_modificacion TIMESTAMP,
    email_enviado_en TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS carrito_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    carrito_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad INT NOT NULL,
    precio_snapshot DOUBLE,
    FOREIGN KEY (carrito_id) REFERENCES carritos_abandonados(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    INDEX idx_carrito_items_carrito (carrito_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
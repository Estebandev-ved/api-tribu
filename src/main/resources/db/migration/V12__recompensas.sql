-- =============================================
-- V12: Recompensas y Canjes
-- =============================================

CREATE TABLE IF NOT EXISTS recompensas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(120) NOT NULL,
    descripcion VARCHAR(400),
    costo_puntos DOUBLE NOT NULL,
    imagen_url VARCHAR(500),
    activo BOOLEAN NOT NULL DEFAULT true,
    stock INT,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_recompensa_activa (activo),
    INDEX idx_recompensa_costo (costo_puntos)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS canjes_recompensa (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    recompensa_id BIGINT NOT NULL,
    costo_puntos DOUBLE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'CANJEADO',
    codigo_canje VARCHAR(32) NOT NULL UNIQUE,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_canje_usuario_fecha (usuario_id, fecha),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (recompensa_id) REFERENCES recompensas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- V6: MÓDULO GAMIFICACIÓN
-- Streak (Racha), Leaderboard, Árbol de Referidos
-- =============================================

-- Campos de streak en usuarios
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS racha_actual INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS racha_maxima INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ultima_actividad_fecha DATE,
    ADD COLUMN IF NOT EXISTS codigo_referido_usado VARCHAR(20);

-- Tabla de snapshots del leaderboard mensual
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    posicion INT NOT NULL,
    total_compras DOUBLE NOT NULL,
    mes VARCHAR(7) NOT NULL,
    tier VARCHAR(20),
    racha_maxima INT,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_leaderboard_mes (mes),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Badges de usuario
CREATE TABLE IF NOT EXISTS usuario_badges (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    badge VARCHAR(50) NOT NULL,
    fecha_obtencion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario_badges_usuario (usuario_id),
    UNIQUE KEY uk_usuario_badge (usuario_id, badge),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

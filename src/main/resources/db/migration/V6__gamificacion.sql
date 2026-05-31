-- =============================================
-- V6: MÓDULO GAMIFICACIÓN
-- Streak (Racha), Leaderboard, Árbol de Referidos
-- NOTA: ADD COLUMN IF NOT EXISTS es sintaxis MariaDB, NO MySQL 8.
-- Se usa procedimiento almacenado para compatibilidad con MySQL 8.x en Aiven.
-- =============================================

DROP PROCEDURE IF EXISTS add_col_v6;
CREATE PROCEDURE add_col_v6(IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_definition TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_column
    ) THEN
        SET @s = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
        PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
    END IF;
END;

CALL add_col_v6('usuarios', 'racha_actual',           'INT DEFAULT 0');
CALL add_col_v6('usuarios', 'racha_maxima',           'INT DEFAULT 0');
CALL add_col_v6('usuarios', 'ultima_actividad_fecha', 'DATE');
CALL add_col_v6('usuarios', 'codigo_referido_usado',  'VARCHAR(20)');

DROP PROCEDURE IF EXISTS add_col_v6;

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

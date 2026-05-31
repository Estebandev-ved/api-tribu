-- =============================================
-- V15: Agregar columna costo_envio a pedidos
-- NOTA: Usa procedimiento para evitar error si columna ya existe
-- =============================================

DROP PROCEDURE IF EXISTS add_col_v15;
CREATE PROCEDURE add_col_v15(IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_definition TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_column
    ) THEN
        SET @s = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
        PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
    END IF;
END;

CALL add_col_v15('pedidos', 'costo_envio', 'DECIMAL(10,2) DEFAULT 0.00');

DROP PROCEDURE IF EXISTS add_col_v15;

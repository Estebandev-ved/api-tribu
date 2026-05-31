DROP PROCEDURE IF EXISTS AddImagenesAdicionalesToProductos;
DELIMITER //
CREATE PROCEDURE AddImagenesAdicionalesToProductos()
BEGIN
    DECLARE col_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO col_exists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'productos'
      AND COLUMN_NAME = 'imagenes_adicionales';
    
    IF col_exists = 0 THEN
        ALTER TABLE productos ADD COLUMN imagenes_adicionales TEXT;
    END IF;
END //
DELIMITER ;
CALL AddImagenesAdicionalesToProductos();
DROP PROCEDURE IF EXISTS AddImagenesAdicionalesToProductos;

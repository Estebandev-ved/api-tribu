-- =============================================
-- V15: Agregar columna costo_envio a pedidos
-- =============================================

ALTER TABLE pedidos
ADD COLUMN costo_envio DECIMAL(10,2) DEFAULT 0.00 AFTER metodo_pago;

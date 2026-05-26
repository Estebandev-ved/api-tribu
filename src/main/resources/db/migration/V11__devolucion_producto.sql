-- =============================================
-- V11: DEVOLUCION - PRODUCTO Y PEDIDO
-- =============================================

ALTER TABLE devoluciones
    ADD COLUMN pedido_id BIGINT,
    ADD COLUMN producto_id BIGINT,
    ADD COLUMN producto_nombre VARCHAR(200);

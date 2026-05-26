-- =============================================
-- V10: DATOS FISCALES DE USUARIO
-- =============================================

ALTER TABLE usuarios
    ADD COLUMN nit_fiscal VARCHAR(20),
    ADD COLUMN razon_social_fiscal VARCHAR(200);

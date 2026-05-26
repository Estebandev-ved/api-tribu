-- =============================================
-- V13: PIN de seguridad para transferencias
-- =============================================

ALTER TABLE usuarios
ADD COLUMN pin_seguridad_hash VARCHAR(128) DEFAULT NULL AFTER reset_password_expires;

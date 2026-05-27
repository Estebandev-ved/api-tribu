-- =============================================
-- V14: Agregar campo tarjeta_creada a usuarios
-- Persiste el estado de la tarjeta virtual
-- =============================================

ALTER TABLE usuarios
    ADD COLUMN tarjeta_creada BOOLEAN NOT NULL DEFAULT FALSE AFTER bloqueado;

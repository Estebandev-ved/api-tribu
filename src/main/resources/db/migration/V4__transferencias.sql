-- =============================================
-- V3: TRANSFERENCIAS P2P
-- Sistema de transferencias entre usuarios
-- =============================================

CREATE TABLE IF NOT EXISTS transferencias_p2p (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    emisor_id BIGINT NOT NULL,
    receptor_id BIGINT NOT NULL,
    monto DOUBLE NOT NULL,
    mensaje VARCHAR(200),
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    referencia_unica VARCHAR(50) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_completada TIMESTAMP,
    movimiento_emisor_id BIGINT,
    movimiento_receptor_id BIGINT,
    FOREIGN KEY (emisor_id) REFERENCES usuarios(id),
    FOREIGN KEY (receptor_id) REFERENCES usuarios(id),
    FOREIGN KEY (movimiento_emisor_id) REFERENCES movimientos_saldo(id),
    FOREIGN KEY (movimiento_receptor_id) REFERENCES movimientos_saldo(id),
    INDEX idx_transferencia_emisor (emisor_id),
    INDEX idx_transferencia_receptor (receptor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- V9: MÓDULO FACTURA ELECTRÓNICA
-- =============================================

-- Tabla de facturas electrónicas
CREATE TABLE IF NOT EXISTS facturas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT NOT NULL UNIQUE,
    usuario_id BIGINT NOT NULL,
    numero_factura VARCHAR(20) NOT NULL UNIQUE,
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nit VARCHAR(20),
    razon_social VARCHAR(200),
    subtotal DOUBLE NOT NULL,
    iva DOUBLE NOT NULL,
    total DOUBLE NOT NULL,
    estado VARCHAR(15) DEFAULT 'GENERADA',
    pdf_url VARCHAR(500),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    INDEX idx_factura_usuario (usuario_id),
    INDEX idx_factura_numero (numero_factura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

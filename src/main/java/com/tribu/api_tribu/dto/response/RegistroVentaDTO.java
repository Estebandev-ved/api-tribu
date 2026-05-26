package com.tribu.api_tribu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para el Libro Diario de Ventas Automático.
 * Cada registro representa un ítem vendido (DetallePedido) de un pedido válido.
 * Seguridad: Solo expuesto en endpoints /api/admin, protegidos por JWT + ROLE_ADMIN.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistroVentaDTO {
    // Identificador único del registro (detalle de pedido)
    private Long id;

    // Identificador del pedido al que pertenece
    private Long pedidoId;

    // Fecha y hora de la venta (fecha del pedido)
    private LocalDateTime fecha;

    // Nombre del producto vendido
    private String producto;

    // Imagen del producto vendido
    private String imagenUrl;

    // Cantidad vendida
    private Integer cantidad;

    // Precio unitario al momento de la venta
    private BigDecimal precioUnitario;

    // Ingreso Total = precioUnitario * cantidad
    private BigDecimal ingresoTotal;

    // Costo unitario del producto (COGS: costo proveedor + empaque + comisión)
    private BigDecimal costoUnitario;

    // Costo Total = costoUnitario * cantidad
    private BigDecimal costoTotal;

    // Utilidad Neta = ingresoTotal - costoTotal
    private BigDecimal utilidadNeta;

    // Estado del pedido al que pertenece
    private String estadoPedido;

    // Nombre del cliente
    private String cliente;
}

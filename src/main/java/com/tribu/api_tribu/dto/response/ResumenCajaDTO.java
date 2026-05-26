package com.tribu.api_tribu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

/**
 * DTO de Resumen Financiero de Caja (Libro Mayor Simplificado).
 * Agrupa métricas de flujo de caja desde la base de datos de pedidos.
 * Seguridad: Solo expuesto en endpoints /api/admin, protegidos por JWT + ROLE_ADMIN.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumenCajaDTO {
    // Total de ingresos de pedidos en estado PAGADO, ENVIADO o ENTREGADO
    private BigDecimal ingresosTotales;

    // Egresos totales (COGS): suma de costoUnitario * cantidad de todos los detalles de ventas
    private BigDecimal egresosTotalesCogs;

    // Utilidad Neta = Ingresos - Egresos
    private BigDecimal utilidadNeta;

    // Dinero realizado en la web (efectivo en caja): pedidos PAGADO, ENVIADO, ENTREGADO
    private BigDecimal efectivoCaja;

    // Dinero pendiente de cobrar: pedidos en estado PENDIENTE
    private BigDecimal dineroPendiente;

    // Total de ventas (transacciones)
    private Long totalVentas;

    // Total de ítems vendidos
    private Long totalItemsVendidos;
}

package com.tribu.api_tribu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

/**
 * DTO de Rentabilidad por Producto.
 * Combina datos del catálogo con métricas acumuladas de ventas para análisis por SKU.
 * Seguridad: Solo expuesto en endpoints /api/admin, protegidos por JWT + ROLE_ADMIN.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductoRentabilidadDTO {
    private Long id;
    private String nombre;
    private String imagenUrl;
    private String categoriaNombre;
    private Integer stock;

    // Precio de venta al público
    private BigDecimal precioVenta;

    // Costo unitario total integrado (proveedor + empaque + comisión pasarela)
    private BigDecimal costoUnitarioTotal;

    // Margen de Contribución Unitario (MCU = precio - costo)
    private BigDecimal margenUnitario;

    // Margen de Contribución % (MCU / precio * 100)
    private BigDecimal margenPorcentaje;

    // Unidades vendidas en toda la historia del negocio (pedidos válidos)
    private Long unidadesVendidas;

    // Ingresos totales generados por este producto
    private BigDecimal ingresosGenerados;

    // Costo total de todos los ítems vendidos de este producto
    private BigDecimal costoTotalVendido;

    // Utilidad total generada por este producto (ingresosGenerados - costoTotalVendido)
    private BigDecimal utilidadTotalGenerada;

    // Semáforo: "EXCELENTE", "MODERADO", "CRITICO"
    private String semaforoRendimiento;
}

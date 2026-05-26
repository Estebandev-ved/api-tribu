package com.tribu.api_tribu.dto.response;

import com.tribu.api_tribu.model.Producto;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Data
@NoArgsConstructor
public class ProductoFinancieroDTO {
    private Long id;
    private String nombre;
    private BigDecimal precio;
    private Integer stock;
    private String imagenUrl;
    private Long categoriaId;
    private String categoriaNombre;

    // Costs
    private BigDecimal costoProveedor;
    private BigDecimal costoEmpaqueEnvio;
    private BigDecimal comisionPasarelaFija;

    // Computed Financial Metrics
    private BigDecimal cogsTotal;
    private BigDecimal mcu; // Margen de Contribución Unitario
    private BigDecimal mcPorcentaje; // MC %

    public ProductoFinancieroDTO(Producto p) {
        this.id = p.getId();
        this.nombre = p.getNombre();
        this.precio = p.getPrecio() != null ? p.getPrecio() : BigDecimal.ZERO;
        this.stock = p.getStock() != null ? p.getStock() : 0;
        this.imagenUrl = p.getImagenUrl();
        this.categoriaId = p.getCategoria() != null ? p.getCategoria().getId() : null;
        this.categoriaNombre = p.getCategoria() != null ? p.getCategoria().getNombre() : null;

        this.costoProveedor = p.getCostoProveedor() != null ? p.getCostoProveedor() : BigDecimal.ZERO;
        this.costoEmpaqueEnvio = p.getCostoEmpaqueEnvio() != null ? p.getCostoEmpaqueEnvio() : BigDecimal.ZERO;
        this.comisionPasarelaFija = p.getComisionPasarelaFija() != null ? p.getComisionPasarelaFija() : BigDecimal.ZERO;

        // 1. COGS Total = costoProveedor + costoEmpaqueEnvio + comisionPasarelaFija
        this.cogsTotal = this.costoProveedor.add(this.costoEmpaqueEnvio).add(this.comisionPasarelaFija);

        // 2. MCU = precio - cogsTotal
        this.mcu = this.precio.subtract(this.cogsTotal);

        // 3. MC % = (MCU / precio) * 100
        if (this.precio.compareTo(BigDecimal.ZERO) > 0) {
            this.mcPorcentaje = this.mcu.multiply(BigDecimal.valueOf(100))
                    .divide(this.precio, 2, RoundingMode.HALF_UP);
        } else {
            this.mcPorcentaje = BigDecimal.ZERO;
        }
    }
}

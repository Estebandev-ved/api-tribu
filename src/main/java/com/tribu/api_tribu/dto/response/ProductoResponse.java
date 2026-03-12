package com.tribu.api_tribu.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class ProductoResponse {
    private Long id;
    private String nombre;
    private String descripcion;
    private BigDecimal precio;
    private Integer stock;
    private String imagenUrl;
    private Boolean esViral;
    private Boolean activo;
    private Long categoriaId;
    private String categoriaNombre;
}

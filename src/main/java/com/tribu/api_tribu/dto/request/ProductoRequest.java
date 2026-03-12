package com.tribu.api_tribu.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductoRequest {
    @NotBlank(message = "El nombre es requerido")
    private String nombre;

    @Size(max = 5000, message = "La descripción no puede superar 5000 caracteres")
    private String descripcion;

    @NotNull(message = "El precio es requerido")
    @DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor a 0")
    private BigDecimal precio;

    @NotNull(message = "El stock es requerido")
    @Min(value = 0, message = "El stock no puede ser negativo")
    private Integer stock;

    private String imagenUrl;
    private Boolean esViral = false;
    private Boolean activo = true;

    @NotNull(message = "La categoría es requerida")
    private Long categoriaId;
}

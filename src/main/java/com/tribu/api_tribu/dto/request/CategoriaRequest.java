package com.tribu.api_tribu.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CategoriaRequest {
    @NotBlank(message = "El nombre de la categoría es requerido")
    private String nombre;

    private String descripcion;
    private String imagenUrl;
    private Boolean activa = true;
}

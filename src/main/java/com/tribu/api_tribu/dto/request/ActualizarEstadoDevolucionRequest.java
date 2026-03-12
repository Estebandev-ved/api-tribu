package com.tribu.api_tribu.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActualizarEstadoDevolucionRequest {
    @NotBlank(message = "El estado no puede estar vacío")
    private String estado;
}

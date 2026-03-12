package com.tribu.api_tribu.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CrmNotaRequest {
    @NotNull(message = "El cliente es requerido")
    private Long clienteId;

    @NotBlank(message = "El contenido de la nota es requerido")
    private String contenido;
}

package com.tribu.api_tribu.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ActualizarEstadoPedidoRequest {
    @NotBlank(message = "El estado es requerido")
    private String estado; // PENDIENTE, PAGADO, ENVIADO, ENTREGADO

    private String guiaRastreo;
}

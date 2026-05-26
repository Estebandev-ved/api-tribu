package com.tribu.api_tribu.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DevolucionRequest {

    @NotBlank(message = "El número de pedido es obligatorio")
    private String orderNumber;

    private Long pedidoId;

    private Long productoId;

    private String productoNombre;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email debe ser válido")
    private String email;

    @NotBlank(message = "El motivo es obligatorio")
    private String reason;
}

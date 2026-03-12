package com.tribu.api_tribu.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class CrearPedidoRequest {
    @NotBlank(message = "La dirección de envío es requerida")
    private String direccionEnvio;

    @NotEmpty(message = "El pedido debe tener al menos un producto")
    @Valid
    private List<ItemPedidoRequest> items;

    @Data
    public static class ItemPedidoRequest {
        @NotNull(message = "El producto es requerido")
        private Long productoId;

        @NotNull(message = "La cantidad es requerida")
        @Min(value = 1, message = "La cantidad mínima es 1")
        private Integer cantidad;
    }
}

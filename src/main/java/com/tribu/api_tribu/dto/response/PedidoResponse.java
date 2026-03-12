package com.tribu.api_tribu.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PedidoResponse {
    private Long id;
    private String clienteNombre;
    private String clienteEmail;
    private LocalDateTime fechaPedido;
    private String estado;
    private BigDecimal total;
    private String direccionEnvio;
    private String guiaRastreo;
    private List<DetallePedidoResponse> detalles;

    @Data
    @Builder
    public static class DetallePedidoResponse {
        private Long id;
        private Long productoId;
        private String productoNombre;
        private String productoImagenUrl;
        private Integer cantidad;
        private BigDecimal precioUnitario;
        private BigDecimal subtotal;
    }
}

package com.tribu.api_tribu.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TransferenciaResponse {
    private String referencia;
    private String tipoParticipante;
    private Double monto;
    private String contraparte;
    private String mensaje;
    private String estado;
    private LocalDateTime fecha;
    private Double nuevoSaldo;
}

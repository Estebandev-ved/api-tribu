package com.tribu.api_tribu.dto.request;

import lombok.Data;

@Data
public class TransferenciaRequest {
    private String destinatario;
    private Double monto;
    private String mensaje;
}

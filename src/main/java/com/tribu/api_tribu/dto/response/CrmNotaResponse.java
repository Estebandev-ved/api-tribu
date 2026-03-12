package com.tribu.api_tribu.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class CrmNotaResponse {
    private Long id;
    private String contenido;
    private LocalDateTime fechaCreacion;
    private String adminNombre;
    private String adminEmail;
    private Long clienteId;
    private String clienteNombre;
    private String clienteEmail;
}

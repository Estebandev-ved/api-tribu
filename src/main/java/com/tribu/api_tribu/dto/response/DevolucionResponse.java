package com.tribu.api_tribu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DevolucionResponse {
    private Long id;
    private String orderNumber;
    private String email;
    private String reason;
    private String estado;
    private String evidenciaUrl;
    private LocalDateTime fechaSolicitud;
}

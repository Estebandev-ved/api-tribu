package com.tribu.api_tribu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CuponValidacionDTO {
    private Boolean valido;
    private String codigo;
    private Double descuento;
    private String descripcion;
    private String error;
}

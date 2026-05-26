package com.tribu.api_tribu.dto.request;

import lombok.Data;

@Data
public class SolicitarFacturaRequest {
    private Long pedidoId;
    private String nit;
    private String razonSocial;
    private Boolean guardarDatos;
}

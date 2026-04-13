package com.tribu.api_tribu.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ValidarDestinatarioResponse {
    private boolean encontrado;
    private String nombre;
    private String avatar;
}

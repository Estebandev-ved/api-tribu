package com.tribu.api_tribu.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LimiteDiarioResponse {
    private double limiteTotal;
    private double utilizado;
    private double disponible;
}

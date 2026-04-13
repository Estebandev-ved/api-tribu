package com.tribu.api_tribu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TribuPassBeneficiosDTO {
    private Double multiplicadorCashback;
    private Boolean envioGratis;
    private Boolean accesoFlashSalesAnticipado;
    private Double limiteRuletaExtra;
    private Double descuentoCupones;
}

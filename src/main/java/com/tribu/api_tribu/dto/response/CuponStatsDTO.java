package com.tribu.api_tribu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CuponStatsDTO {
    private Long cuponId;
    private String codigo;
    private Integer usosTotales;
    private Double descuentoTotalOtorgado;
}

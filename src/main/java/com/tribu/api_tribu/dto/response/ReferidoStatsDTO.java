package com.tribu.api_tribu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReferidoStatsDTO {
    private Long totalReferidos;
    private Long nivel1Count;
    private Long nivel2Count;
    private Long nivel3Count;
    private Long activosEsteMes;
    private Double gananciasNivel1;
    private Double gananciasNivel2;
    private Double gananciasNivel3;
    private Double totalGanancias;
}

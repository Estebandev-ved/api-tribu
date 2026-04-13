package com.tribu.api_tribu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampanaStatsDTO {
    private Long id;
    private String nombre;
    private Double multiplicador;
    private Integer usosActuales;
    private Integer limiteUsoTotal;
    private Double impactoFinancieroPorcentaje;
}
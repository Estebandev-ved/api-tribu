package com.tribu.api_tribu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryDTO {
    private Integer posicion;
    private Long usuarioId;
    private String nombre;
    private Double totalCompras;
    private String tier;
    private Integer rachaActual;
}

package com.tribu.api_tribu.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampanaRequest {
    private String nombre;
    private String descripcion;
    private Double multiplicador;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private Integer limiteUsoTotal;
    private Integer limiteUsoPorUsuario;
    private List<Long> tiersAplicablesIds;
}
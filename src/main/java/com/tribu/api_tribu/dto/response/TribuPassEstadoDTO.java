package com.tribu.api_tribu.dto.response;

import com.tribu.api_tribu.model.TribuPass.EstadoPass;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TribuPassEstadoDTO {
    private Boolean activa;
    private EstadoPass estado;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaRenovacion;
    private Double precio;
    private Boolean renovacionAutomatica;
    private TribuPassBeneficiosDTO beneficios;
}

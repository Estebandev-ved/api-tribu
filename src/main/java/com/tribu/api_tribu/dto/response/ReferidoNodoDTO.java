package com.tribu.api_tribu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReferidoNodoDTO {
    private Long id;
    private String nombre;
    private String tier;
    private Integer rachaActual;
    private Double totalComprasMes;
    private Boolean activoEsteMes;
    @Builder.Default
    private List<ReferidoNodoDTO> hijos = new ArrayList<>();
}

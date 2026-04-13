package com.tribu.api_tribu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductoRecomendadoDTO {
    private Long productoId;
    private String nombre;
    private Double precio;
    private String imagen;
    private String razonRecomendacion;
    private Double cashbackEsperado;
}
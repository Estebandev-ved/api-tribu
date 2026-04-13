package com.tribu.api_tribu.dto.request;

import com.tribu.api_tribu.model.Cupon.TipoCupon;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
public class CuponRequest {
    private String codigo;
    private TipoCupon tipo;
    private Double valor;
    private Double montoMinimo;
    private Double montoMaximoDescuento;
    private Integer usosPorUsuario;
    private Integer usosMaximos;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaExpiracion;
    private Boolean activo;
    private Set<Long> tierIds;
}

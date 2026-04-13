package com.tribu.api_tribu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long id;
    private String nombreCompleto;
    private String email;
    private String rol;

    /** Información del tier VIP actual del usuario (Fase 2) */
    private TierInfoDto tierActual;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TierInfoDto {
        private String nombre;
        private Integer orden;
        private String descripcion;
        private List<BeneficioDto> beneficios;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BeneficioDto {
        private String tipo;
        private String valor;
        private String descripcion;
    }
}

package com.tribu.api_tribu.dto.request;

import jakarta.validation.constraints.NotBlank;
public class ActualizarEstadoDevolucionRequest {
    @NotBlank(message = "El estado no puede estar vacío")
    private String estado;

    public ActualizarEstadoDevolucionRequest() {
    }

    public ActualizarEstadoDevolucionRequest(String estado) {
        this.estado = estado;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}

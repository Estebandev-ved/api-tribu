package com.tribu.api_tribu.dto.request;

import jakarta.validation.constraints.NotBlank;
public class ActualizarEstadoPedidoRequest {
    @NotBlank(message = "El estado es requerido")
    private String estado; // PENDIENTE, PAGADO, ENVIADO, ENTREGADO

    private String guiaRastreo;

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getGuiaRastreo() {
        return guiaRastreo;
    }

    public void setGuiaRastreo(String guiaRastreo) {
        this.guiaRastreo = guiaRastreo;
    }
}

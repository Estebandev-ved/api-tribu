package com.tribu.api_tribu.dto.response;

import java.time.LocalDateTime;

public class CanjeRecompensaResponse {
    private Long id;
    private String codigoCanje;
    private String estado;
    private Double costoPuntos;
    private LocalDateTime fecha;
    private Long recompensaId;
    private String recompensaTitulo;
    private String recompensaImagen;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodigoCanje() {
        return codigoCanje;
    }

    public void setCodigoCanje(String codigoCanje) {
        this.codigoCanje = codigoCanje;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Double getCostoPuntos() {
        return costoPuntos;
    }

    public void setCostoPuntos(Double costoPuntos) {
        this.costoPuntos = costoPuntos;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public Long getRecompensaId() {
        return recompensaId;
    }

    public void setRecompensaId(Long recompensaId) {
        this.recompensaId = recompensaId;
    }

    public String getRecompensaTitulo() {
        return recompensaTitulo;
    }

    public void setRecompensaTitulo(String recompensaTitulo) {
        this.recompensaTitulo = recompensaTitulo;
    }

    public String getRecompensaImagen() {
        return recompensaImagen;
    }

    public void setRecompensaImagen(String recompensaImagen) {
        this.recompensaImagen = recompensaImagen;
    }
}

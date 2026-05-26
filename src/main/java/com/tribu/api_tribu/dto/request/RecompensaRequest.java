package com.tribu.api_tribu.dto.request;

public class RecompensaRequest {
    private String titulo;
    private String descripcion;
    private Double costoPuntos;
    private String imagenUrl;
    private Boolean activo;
    private Integer stock;

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Double getCostoPuntos() {
        return costoPuntos;
    }

    public void setCostoPuntos(Double costoPuntos) {
        this.costoPuntos = costoPuntos;
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }
}

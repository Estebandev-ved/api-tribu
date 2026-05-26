package com.tribu.api_tribu.dto.response;

public class ValidarDestinatarioResponse {
    private boolean encontrado;
    private String nombre;
    private String avatar;
    private String email;
    private String codigoReferido;
    private Integer nivelVip;
    private String ciudad;

    public boolean isEncontrado() {
        return encontrado;
    }

    public void setEncontrado(boolean encontrado) {
        this.encontrado = encontrado;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCodigoReferido() {
        return codigoReferido;
    }

    public void setCodigoReferido(String codigoReferido) {
        this.codigoReferido = codigoReferido;
    }

    public Integer getNivelVip() {
        return nivelVip;
    }

    public void setNivelVip(Integer nivelVip) {
        this.nivelVip = nivelVip;
    }

    public String getCiudad() {
        return ciudad;
    }

    public void setCiudad(String ciudad) {
        this.ciudad = ciudad;
    }
}

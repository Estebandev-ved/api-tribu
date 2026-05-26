package com.tribu.api_tribu.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PuntosConfig {

    @Value("${tribu.puntos.expiran:false}")
    private boolean expiran;

    @Value("${tribu.puntos.expiracion.dias:365}")
    private int diasExpiracion;

    public boolean isExpiran() {
        return expiran;
    }

    public int getDiasExpiracion() {
        return diasExpiracion;
    }
}

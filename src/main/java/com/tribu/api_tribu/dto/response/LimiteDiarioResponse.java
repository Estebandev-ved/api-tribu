package com.tribu.api_tribu.dto.response;

public class LimiteDiarioResponse {
    private double limiteTotal;
    private double utilizado;
    private double disponible;
    private double minimoPorTransferencia;
    private double maximoPorTransferencia;
    private int limiteTransaccionesDiarias;
    private int transaccionesHoy;

    public double getLimiteTotal() {
        return limiteTotal;
    }

    public void setLimiteTotal(double limiteTotal) {
        this.limiteTotal = limiteTotal;
    }

    public double getUtilizado() {
        return utilizado;
    }

    public void setUtilizado(double utilizado) {
        this.utilizado = utilizado;
    }

    public double getDisponible() {
        return disponible;
    }

    public void setDisponible(double disponible) {
        this.disponible = disponible;
    }

    public double getMinimoPorTransferencia() {
        return minimoPorTransferencia;
    }

    public void setMinimoPorTransferencia(double minimoPorTransferencia) {
        this.minimoPorTransferencia = minimoPorTransferencia;
    }

    public double getMaximoPorTransferencia() {
        return maximoPorTransferencia;
    }

    public void setMaximoPorTransferencia(double maximoPorTransferencia) {
        this.maximoPorTransferencia = maximoPorTransferencia;
    }

    public int getLimiteTransaccionesDiarias() {
        return limiteTransaccionesDiarias;
    }

    public void setLimiteTransaccionesDiarias(int limiteTransaccionesDiarias) {
        this.limiteTransaccionesDiarias = limiteTransaccionesDiarias;
    }

    public int getTransaccionesHoy() {
        return transaccionesHoy;
    }

    public void setTransaccionesHoy(int transaccionesHoy) {
        this.transaccionesHoy = transaccionesHoy;
    }
}

package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transferencias_p2p")
public class TransferenciaP2P {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emisor_id", nullable = false)
    private Usuario emisor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receptor_id", nullable = false)
    private Usuario receptor;

    @Column(nullable = false)
    private Double monto;

    @Column(length = 200)
    private String mensaje;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoTransferencia estado = EstadoTransferencia.PENDIENTE;

    @Column(name = "referencia_unica", unique = true, nullable = false, length = 50)
    private String referenciaUnica;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_completada")
    private LocalDateTime fechaCompletada;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movimiento_emisor_id", unique = true)
    private MovimientoSaldo movimientoEmisor;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movimiento_receptor_id", unique = true)
    private MovimientoSaldo movimientoReceptor;

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
    }

    public enum EstadoTransferencia {
        PENDIENTE,
        COMPLETADA,
        CANCELADA,
        FALLIDA
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Usuario getEmisor() {
        return emisor;
    }

    public void setEmisor(Usuario emisor) {
        this.emisor = emisor;
    }

    public Usuario getReceptor() {
        return receptor;
    }

    public void setReceptor(Usuario receptor) {
        this.receptor = receptor;
    }

    public Double getMonto() {
        return monto;
    }

    public void setMonto(Double monto) {
        this.monto = monto;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public EstadoTransferencia getEstado() {
        return estado;
    }

    public void setEstado(EstadoTransferencia estado) {
        this.estado = estado;
    }

    public String getReferenciaUnica() {
        return referenciaUnica;
    }

    public void setReferenciaUnica(String referenciaUnica) {
        this.referenciaUnica = referenciaUnica;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDateTime getFechaCompletada() {
        return fechaCompletada;
    }

    public void setFechaCompletada(LocalDateTime fechaCompletada) {
        this.fechaCompletada = fechaCompletada;
    }

    public MovimientoSaldo getMovimientoEmisor() {
        return movimientoEmisor;
    }

    public void setMovimientoEmisor(MovimientoSaldo movimientoEmisor) {
        this.movimientoEmisor = movimientoEmisor;
    }

    public MovimientoSaldo getMovimientoReceptor() {
        return movimientoReceptor;
    }

    public void setMovimientoReceptor(MovimientoSaldo movimientoReceptor) {
        this.movimientoReceptor = movimientoReceptor;
    }
}

package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@Entity
@Table(name = "canjes_recompensa", indexes = {
        @Index(name = "idx_canje_usuario_fecha", columnList = "usuario_id, fecha")
})
public class CanjeRecompensa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recompensa_id", nullable = false)
    private Recompensa recompensa;

    @Column(name = "costo_puntos", nullable = false)
    private Double costoPuntos;

    @Column(nullable = false, length = 20)
    private String estado = "CANJEADO";

    @Column(name = "codigo_canje", nullable = false, length = 32, unique = true)
    private String codigoCanje;

    @Column(name = "fecha", updatable = false)
    private LocalDateTime fecha;

    @PrePersist
    protected void onCreate() {
        this.fecha = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Recompensa getRecompensa() {
        return recompensa;
    }

    public void setRecompensa(Recompensa recompensa) {
        this.recompensa = recompensa;
    }

    public Double getCostoPuntos() {
        return costoPuntos;
    }

    public void setCostoPuntos(Double costoPuntos) {
        this.costoPuntos = costoPuntos;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getCodigoCanje() {
        return codigoCanje;
    }

    public void setCodigoCanje(String codigoCanje) {
        this.codigoCanje = codigoCanje;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }
}

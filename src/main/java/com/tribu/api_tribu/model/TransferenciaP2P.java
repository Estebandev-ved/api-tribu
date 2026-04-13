package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transferencias_p2p")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
    @Builder.Default
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
}

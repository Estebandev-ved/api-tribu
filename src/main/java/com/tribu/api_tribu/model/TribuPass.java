package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = "historial")
@Entity
@Builder
@Table(name = "tribu_pass")
public class TribuPass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private EstadoPass estado = EstadoPass.ACTIVA;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_renovacion", nullable = false)
    private LocalDateTime fechaRenovacion;

    @Column(nullable = false)
    @Builder.Default
    private Double precio = 9900.0;

    @Column(name = "metodo_pago", length = 20)
    private String metodoPago;

    @Column(name = "renovacion_automatica", nullable = false)
    @Builder.Default
    private Boolean renovacionAutomatica = true;

    @Column(name = "efipay_payment_id")
    private String efipayPaymentId;

    @Column(name = "efipay_checkout_url", length = 500)
    private String efipayCheckoutUrl;

    @Column(name = "efipay_status", length = 20)
    private String efipayStatus;

    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @OneToMany(mappedBy = "pass", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TribuPassRenovacion> historial = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
        this.fechaActualizacion = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }

    public enum EstadoPass {
        ACTIVA,
        PAUSADA,
        CANCELADA,
        EXPIRADA,
        PENDIENTE
    }
}

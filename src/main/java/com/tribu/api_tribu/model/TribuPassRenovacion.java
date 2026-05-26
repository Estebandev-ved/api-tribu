package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@Entity
@Builder
@Table(name = "tribu_pass_renovaciones")
public class TribuPassRenovacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pass_id", nullable = false)
    @JsonIgnore
    private TribuPass pass;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(nullable = false)
    private Double monto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private EstadoRenovacion estado;

    @Column(name = "movimiento_id")
    private Long movimientoId;

    @PrePersist
    protected void onCreate() {
        if (fecha == null) {
            fecha = LocalDateTime.now();
        }
    }

    public enum EstadoRenovacion {
        EXITOSA,
        FALLIDA
    }
}

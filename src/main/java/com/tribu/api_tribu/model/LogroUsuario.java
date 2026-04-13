package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "logros_usuarios", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"usuario_id", "logro_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogroUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "logro_id", nullable = false)
    private String logroId; // e.g. "primera_compra"

    @Column(name = "fecha_desbloqueo", nullable = false)
    private LocalDateTime fechaDesbloqueo;

    @Column(name = "recompensa_entregada")
    @Builder.Default
    private Boolean recompensaEntregada = false;

    @PrePersist
    protected void onCreate() {
        if (fechaDesbloqueo == null) {
            fechaDesbloqueo = LocalDateTime.now();
        }
    }
}

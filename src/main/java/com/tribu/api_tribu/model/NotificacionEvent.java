package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notificaciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificacionEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipo;
    private String titulo;
    private String mensaje;
    private String usuarioId;
    private String ordenId;
    private String productoId;
    private LocalDateTime fecha;

    @Builder.Default
    private boolean leida = false;

    @PrePersist
    protected void onCreate() {
        if (fecha == null) {
            fecha = LocalDateTime.now();
        }
    }

    public NotificacionEvent(String tipo, String titulo, String mensaje, String usuarioId) {
        this.tipo = tipo;
        this.titulo = titulo;
        this.mensaje = mensaje;
        this.usuarioId = usuarioId;
        this.fecha = LocalDateTime.now();
        this.leida = false;
    }
}

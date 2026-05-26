package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "devoluciones")
@Getter
@Setter
@ToString
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Devolucion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String orderNumber;

    @Column(name = "pedido_id")
    private Long pedidoId;

    @Column(name = "producto_id")
    private Long productoId;

    @Column(name = "producto_nombre", length = 200)
    private String productoNombre;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private String estado; // PENDIENTE, APROBADA, RECHAZADA, COMPLETADA

    @Column(name = "evidencia_url", length = 500)
    private String evidenciaUrl;

    @Column(nullable = false)
    private LocalDateTime fechaSolicitud;
}

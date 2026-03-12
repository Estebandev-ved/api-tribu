package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "devoluciones")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Devolucion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String orderNumber;

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

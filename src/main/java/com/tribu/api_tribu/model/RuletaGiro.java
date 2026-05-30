package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = "usuario")
@Entity
@Table(name = "ruleta_giros")
public class RuletaGiro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"password", "rol", "tierActual", "notasCreadas", "preferenciasNotificaciones", "pinSeguridadHash", "secret2fa", "resetPasswordToken", "hibernateLazyInitializer", "handler"})
    private Usuario usuario;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(name = "tipo_giro", nullable = false)
    private String tipoGiro; // "GRATUITO" o "PUNTOS"

    @Column(name = "premio_monto", nullable = false)
    private double premioMonto;

    @Column(name = "tipo_premio", nullable = false)
    private String tipoPremio; // "NADA", "PUNTOS", "DESCUENTO", "ENVIO_GRATIS", "PRODUCTO"

    @Column(name = "label_premio", nullable = false)
    private String labelPremio;

    @Column(name = "codigo_premio", nullable = false)
    private String codigoPremio;
}

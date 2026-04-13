package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Representa un nivel VIP del programa de lealtad.
 *
 * Cada tier define:
 * - Un umbral mínimo de compras mensuales para alcanzarlo
 * - Una regla SpEL evaluable dinámicamente (reglaPromocion)
 * - Una lista de beneficios configurables (TierBenefit)
 *
 * Seguridad: La reglaPromocion se evalúa en un SimpleEvaluationContext
 * sin acceso a beans ni al contexto de Spring, limitando el riesgo de
 * inyección de expresiones maliciosas.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = "beneficios")
@Entity
@Table(name = "tiers")
public class Tier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nombre único del tier: BRONCE, PLATA, ORO */
    @Column(length = 20, nullable = false, unique = true)
    private String nombre;

    /** Orden numérico para comparaciones sin hardcodear nombres (1=BRONCE, 2=PLATA, 3=ORO) */
    @Column(nullable = false)
    private Integer orden;

    /** Monto mínimo de compras mensuales (COP) para alcanzar este tier */
    @Column(name = "umbral_compras_mes", nullable = false)
    private Double umbralComprasMes;

    /**
     * Expresión SpEL para evaluar si un usuario califica para este tier.
     * Ejemplo: "#comprasMes >= 200000"
     * Se evalúa con StandardEvaluationContext sin acceso a beans de Spring.
     */
    @Column(name = "regla_promocion", length = 200)
    private String reglaPromocion;

    /** Descripción legible del tier para mostrar en el frontend */
    @Column(length = 300)
    private String descripcion;

    /** Beneficios asociados a este tier (cashback, ruleta, envío, etc.) */
    @OneToMany(mappedBy = "tier", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<TierBenefit> beneficios = new ArrayList<>();
}

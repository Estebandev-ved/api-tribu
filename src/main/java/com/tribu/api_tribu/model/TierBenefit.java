package com.tribu.api_tribu.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Beneficio configurable asociado a un Tier VIP.
 *
 * El campo `valor` es String genérico que se interpreta según el `tipo`:
 *   - CASHBACK_PCT       → "0.05" (Double)
 *   - RULETA_HABILITADA  → "true" (Boolean)
 *   - RULETA_LIMITE_DIARIO → "20000" (Double)
 *   - ENVIO_GRATIS       → "true" (Boolean)
 *   - DESCUENTO_EXTRA_PCT → "0.10" (Double)
 *
 * Los admins pueden actualizar estos valores directamente en BD
 * sin necesidad de redesplegar la aplicación.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
@Entity
@Table(name = "tier_benefits", indexes = {
    @Index(name = "idx_tier_benefit_tier_tipo", columnList = "tier_id, tipo")
})
public class TierBenefit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Tier al que pertenece este beneficio */
    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tier_id", nullable = false)
    private Tier tier;

    /** Tipo de beneficio — determina cómo se interpreta el campo valor */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoBeneficio tipo;

    /** Valor genérico del beneficio como String */
    @Column(length = 50, nullable = false)
    private String valor;

    /** Descripción legible para mostrar al usuario */
    @Column(length = 200)
    private String descripcion;

    // ── Helpers de conversión ────────────────────────────────────────────

    /**
     * Interpreta el valor como double.
     * Retorna 0.0 si el valor no es numérico o es null.
     */
    public double getValorDouble() {
        try {
            return valor != null ? Double.parseDouble(valor) : 0.0;
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    /**
     * Interpreta el valor como boolean.
     * Retorna false si el valor es null o no es "true".
     */
    public boolean getValorBoolean() {
        return valor != null && Boolean.parseBoolean(valor);
    }
}

package com.tribu.api_tribu.service;

import com.tribu.api_tribu.model.Tier;
import com.tribu.api_tribu.repository.TierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Motor de reglas SpEL para el sistema de tiers VIP.
 *
 * Evalúa las expresiones SpEL almacenadas en cada tier (campo reglaPromocion)
 * contra las compras mensuales del usuario para determinar su tier actual.
 *
 * Seguridad: Se usa StandardEvaluationContext con una única variable (#comprasMes),
 * sin acceso a beans de Spring ni al sistema de archivos, lo que limita el riesgo
 * de inyección de expresiones maliciosas desde la BD.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VipRulesEngine {

    private final TierRepository tierRepository;
    private final ExpressionParser spelParser = new SpelExpressionParser();

    /**
     * Evalúa el tier que le corresponde a un usuario según sus compras del mes.
     *
     * Itera los tiers de mayor a menor (ORO → PLATA → BRONCE) y retorna
     * el primero cuya regla SpEL sea verdadera.
     *
     * @param comprasMes monto total de compras ENTREGADAS en el mes actual (COP)
     * @return el Tier correspondiente; BRONCE como fallback si ninguna regla aplica
     */
    public Tier evaluarTier(double comprasMes) {
        List<Tier> tiers = tierRepository.findAllOrderByOrdenDesc();

        StandardEvaluationContext context = new StandardEvaluationContext();
        context.setVariable("comprasMes", comprasMes);

        for (Tier tier : tiers) {
            try {
                String regla = tier.getReglaPromocion();
                if (regla == null || regla.isBlank()) {
                    log.debug("Tier {} no tiene regla definida, saltando", tier.getNombre());
                    continue;
                }

                Boolean resultado = spelParser.parseExpression(regla)
                        .getValue(context, Boolean.class);

                log.debug("SpEL evaluación → Tier={}, regla='{}', comprasMes={}, resultado={}",
                        tier.getNombre(), regla, comprasMes, resultado);

                if (Boolean.TRUE.equals(resultado)) {
                    return tier;
                }
            } catch (Exception e) {
                log.warn("Error evaluando regla SpEL del tier {}: {}",
                        tier.getNombre(), e.getMessage());
            }
        }

        // Fallback: retornar el tier mínimo (BRONCE)
        log.debug("Ninguna regla coincidió para comprasMes={}. Asignando tier mínimo.", comprasMes);
        return tierRepository.findTierMinimo()
                .orElseThrow(() -> new IllegalStateException(
                        "No se encontró ningún tier en la BD. Ejecute el script de migración V2__tier_system.sql"));
    }

    /**
     * Genera un mensaje descriptivo del cambio de tier para notificaciones.
     *
     * @param anterior Tier anterior del usuario
     * @param nuevo    Tier nuevo asignado
     * @return mensaje legible para WebSocket/notificación
     */
    public String describeCambio(Tier anterior, Tier nuevo) {
        if (anterior == null) {
            return String.format("¡Bienvenido al nivel %s!", nuevo.getNombre());
        }
        if (nuevo.getOrden() > anterior.getOrden()) {
            return String.format("🎉 ¡Subiste de %s a %s! Nuevos beneficios desbloqueados.",
                    anterior.getNombre(), nuevo.getNombre());
        }
        if (nuevo.getOrden() < anterior.getOrden()) {
            return String.format("Tu nivel cambió de %s a %s. ¡Sigue comprando para subir!",
                    anterior.getNombre(), nuevo.getNombre());
        }
        return String.format("Te mantienes en el nivel %s.", nuevo.getNombre());
    }
}

package com.tribu.api_tribu.service;

import com.tribu.api_tribu.model.*;
import com.tribu.api_tribu.repository.TierBenefitRepository;
import com.tribu.api_tribu.repository.TierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

/**
 * Servicio de consulta de beneficios VIP por tier.
 *
 * Reemplaza el switch hardcodeado de PedidoService con consultas dinámicas a BD.
 * Cada método incluye un fallback seguro para evitar NullPointerException.
 *
 * Los admins pueden cambiar porcentajes, límites y flags directamente en la tabla
 * tier_benefits sin necesidad de redesplegar.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CashbackTierService {

    private final TierBenefitRepository tierBenefitRepository;
    private final TierRepository tierRepository;
    private final TribuPassService tribuPassService;

    // ── Consultas de beneficios ─────────────────────────────────────────

    /**
     * Retorna el porcentaje de cashback del tier activo del usuario.
     * Fallback: 1% (0.01) si no se encuentra el beneficio.
     * Se multiplica por 2 si el usuario tiene Tribu Pass activo.
     */
    public double getPorcentajeCashback(Usuario usuario) {
        Tier tier = resolverTier(usuario);
        double porcentaje = tierBenefitRepository.findByTierAndTipo(tier, TipoBeneficio.CASHBACK_PCT)
                .map(TierBenefit::getValorDouble)
                .orElse(0.01);

        if (tribuPassService.tienePassActiva(usuario.getId())) {
            log.info("💎 Aplicando multiplicador x2 Tribu Pass al cashback del usuario {}", usuario.getId());
            porcentaje *= 2.0;
        }

        return porcentaje;
    }

    /**
     * Verifica si el usuario tiene acceso a la ruleta diaria.
     * Fallback: true (todos tienen acceso por defecto).
     */
    public boolean tieneAccesoRuleta(Usuario usuario) {
        Tier tier = resolverTier(usuario);
        return tierBenefitRepository.findByTierAndTipo(tier, TipoBeneficio.RULETA_HABILITADA)
                .map(TierBenefit::getValorBoolean)
                .orElse(true);
    }

    /**
     * Retorna el límite diario de la ruleta para el usuario.
     * Fallback: $10.000 COP. Se incrementa en $5.000 si tiene Tribu Pass.
     */
    public double getLimiteRuletaDiario(Usuario usuario) {
        Tier tier = resolverTier(usuario);
        double limite = tierBenefitRepository.findByTierAndTipo(tier, TipoBeneficio.RULETA_LIMITE_DIARIO)
                .map(TierBenefit::getValorDouble)
                .orElse(10000.0);

        if (tribuPassService.tienePassActiva(usuario.getId())) {
            limite += 5000.0;
        }

        return limite;
    }

    /**
     * Verifica si el usuario tiene envío gratis.
     * Fallback: false. También retorna true si tiene Tribu Pass activo.
     */
    public boolean tieneEnvioGratis(Usuario usuario) {
        Tier tier = resolverTier(usuario);
        boolean envioGratisTier = tierBenefitRepository.findByTierAndTipo(tier, TipoBeneficio.ENVIO_GRATIS)
                .map(TierBenefit::getValorBoolean)
                .orElse(false);

        return envioGratisTier || tribuPassService.tienePassActiva(usuario.getId());
    }

    /**
     * Retorna la lista completa de beneficios del tier del usuario.
     * Útil para construir feature flags en el login/AuthResponse.
     */
    public List<TierBenefit> getBeneficiosDelUsuario(Usuario usuario) {
        Tier tier = resolverTier(usuario);
        return tierBenefitRepository.findByTier(tier);
    }

    // ── Helper interno ──────────────────────────────────────────────────

    /**
     * Resuelve el tier activo del usuario con doble fallback:
     *   1. Si usuario.tierActual != null → se usa directamente
     *   2. Si no, mapea nivelVip (3→ORO, 2→PLATA, default→BRONCE)
     *   3. Si nivelVip también es null → busca BRONCE en BD
     *
     * Nunca retorna null: siempre cae en BRONCE como último recurso.
     */
    Tier resolverTier(Usuario usuario) {
        // 1. Tier directo (Fase 2)
        if (usuario.getTierActual() != null) {
            return usuario.getTierActual();
        }

        // 2. Fallback por nivelVip legacy
        String nombreTier;
        Integer nivelVip = usuario.getNivelVip();
        if (nivelVip != null) {
            nombreTier = switch (nivelVip) {
                case 3 -> "ORO";
                case 2 -> "PLATA";
                default -> "BRONCE";
            };
        } else {
            nombreTier = "BRONCE";
        }

        return tierRepository.findByNombre(nombreTier)
                .orElseGet(() -> {
                    log.warn("Tier '{}' no encontrado en BD para usuario {}. Buscando tier mínimo.",
                            nombreTier, usuario.getId());
                    return tierRepository.findTierMinimo()
                            .orElseThrow(() -> new IllegalStateException(
                                    "No hay tiers en la BD. Ejecute el script de migración."));
                });
    }
}

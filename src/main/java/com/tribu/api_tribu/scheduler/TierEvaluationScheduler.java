package com.tribu.api_tribu.scheduler;

import com.tribu.api_tribu.model.Tier;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.PedidoRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.service.VipRulesEngine;
import com.tribu.api_tribu.service.TierService;
import com.tribu.api_tribu.websocket.SaldoWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

/**
 * Scheduler nocturno que recalcula el tier VIP de cada usuario.
 *
 * Ejecuta diariamente a las 2:00 AM hora Colombia.
 * Para cada usuario:
 *   1. Calcula las compras ENTREGADAS del mes actual
 *   2. Evalúa el tier correspondiente con el motor SpEL
 *   3. Si cambió, actualiza el usuario y notifica vía WebSocket
 *
 * También se puede invocar manualmente desde:
 *   POST /api/admin/scheduler/evaluar-tiers
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TierEvaluationScheduler {

    private final UsuarioRepository usuarioRepository;
    private final TierService tierService;

    /**
     * Recalcula los tiers de todos los usuarios basándose en compras del mes actual.
     * Se ejecuta automáticamente a las 2 AM hora Colombia o manualmente vía endpoint admin.
     */
    @Scheduled(cron = "0 0 2 * * *", zone = "America/Bogota")
    @Transactional
    public void recalcularTiersUsuarios() {
        log.info("⏰ [TierScheduler] Iniciando recálculo masivo de tiers VIP...");

        List<Usuario> usuarios = usuarioRepository.findAll();
        for (Usuario usuario : usuarios) {
            try {
                tierService.reevaluarTierUsuario(usuario);
            } catch (Exception e) {
                log.error("❌ Error evaluando tier del usuario {}: {}",
                        usuario.getId(), e.getMessage(), e);
            }
        }

        log.info("✅ [TierScheduler] Recálculo masivo completado.");
    }
}

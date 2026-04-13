package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.scheduler.CashbackScheduler;
import com.tribu.api_tribu.scheduler.TierEvaluationScheduler;
import com.tribu.api_tribu.repository.MovimientoSaldoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Endpoints de apoyo para el sistema de saldo:
 *
 * 1. Disparar manualmente el scheduler de cashbacks (útil en dev/testing)
 * 2. Estadísticas del ledger para el panel admin
 */
@RestController
@RequestMapping("/api/admin/scheduler")
@RequiredArgsConstructor
public class AdminSchedulerController {

    private final CashbackScheduler cashbackScheduler;
    private final TierEvaluationScheduler tierEvaluationScheduler;
    private final MovimientoSaldoRepository movimientoRepo;

    /**
     * Disparar manualmente la liberación de cashbacks.
     * Solo ADMIN. Útil para QA y demos.
     *
     * POST /api/admin/scheduler/liberar-cashbacks
     */
    @PostMapping("/liberar-cashbacks")
    public ResponseEntity<Map<String, String>> liberarManual() {
        cashbackScheduler.liberarCashbacksDiferidos();
        return ResponseEntity.ok(Map.of(
                "mensaje", "Proceso de liberación de cashbacks ejecutado.",
                "tip", "Revisa los logs para ver cuántos movimientos se liberaron."));
    }

    /**
     * Estadísticas del ledger para el panel admin.
     * GET /api/admin/scheduler/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
                "pendientesDeLiberar", movimientoRepo.countPendientesDeLiberar(),
                "totalCashbackAcreditado",
                    movimientoRepo.sumPorTipo(com.tribu.api_tribu.model.MovimientoSaldo.TipoMovimiento.CASHBACK),
                "totalPremiosRuleta",
                    movimientoRepo.sumPorTipo(com.tribu.api_tribu.model.MovimientoSaldo.TipoMovimiento.ROULETTE_REWARD),
                "totalBonosReferido",
                    movimientoRepo.sumPorTipo(com.tribu.api_tribu.model.MovimientoSaldo.TipoMovimiento.REFERRAL_BONUS)
        ));
    }

    /**
     * Disparar manualmente el recálculo de tiers VIP.
     * Solo ADMIN. Útil para aplicar cambios en tier_benefits sin esperar al cron.
     *
     * POST /api/admin/scheduler/evaluar-tiers
     */
    @PostMapping("/evaluar-tiers")
    public ResponseEntity<Map<String, String>> evaluarTiersManual() {
        tierEvaluationScheduler.recalcularTiersUsuarios();
        return ResponseEntity.ok(Map.of(
                "mensaje", "Recálculo de tiers ejecutado.",
                "tip", "Revisa los logs para ver promovidos, degradados y errores."));
    }
}

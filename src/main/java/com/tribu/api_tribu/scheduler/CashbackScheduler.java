package com.tribu.api_tribu.scheduler;

import com.tribu.api_tribu.model.MovimientoSaldo;
import com.tribu.api_tribu.repository.MovimientoSaldoRepository;
import com.tribu.api_tribu.service.SaldoService;
import com.tribu.api_tribu.websocket.SaldoWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Proceso diario que libera los cashbacks diferidos.
 *
 * Flujo:
 *   1. Busca todos los MovimientoSaldo con estado=ON_HOLD y unlockDate <= ahora
 *   2. Transiciona cada uno a CLEARED via SaldoService
 *   3. Sincroniza saldoFavor en el usuario
 *   4. Emite evento WebSocket para que React anime la entrada del dinero
 *
 * Horario: todos los días a las 08:00 AM hora Colombia (UTC-5).
 * Cron: "0 0 8 * * *" → segundo=0, minuto=0, hora=8, cualquier día/mes/año
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CashbackScheduler {

    private final MovimientoSaldoRepository movimientoRepo;
    private final SaldoService saldoService;
    private final SaldoWebSocketService wsService;

    /**
     * Para desarrollo: también puedes disparar manualmente con
     * POST /api/admin/scheduler/liberar-cashbacks (ver AdminSchedulerController)
     */
    @Scheduled(cron = "0 0 8 * * *", zone = "America/Bogota")
    @Transactional
    public void liberarCashbacksDiferidos() {
        LocalDateTime ahora = LocalDateTime.now();
        List<MovimientoSaldo> pendientes = movimientoRepo.findMovimientosListosParaLiberar(ahora);

        if (pendientes.isEmpty()) {
            log.info("🕐 Scheduler cashback: ningún movimiento por liberar.");
            return;
        }

        log.info("🚀 Scheduler cashback: liberando {} movimientos ON_HOLD...", pendientes.size());

        int liberados = 0;
        int errores = 0;

        for (MovimientoSaldo mov : pendientes) {
            try {
                MovimientoSaldo liberado = saldoService.liberarMovimiento(mov);

                // Notificar al usuario via WebSocket → React anima la entrada
                wsService.notificarSaldoActualizado(
                        liberado.getUsuario().getId(),
                        liberado.getMonto(),
                        "CASHBACK",
                        liberado.getDescripcion()
                );

                liberados++;
            } catch (Exception e) {
                log.error("❌ Error liberando movimiento #{}: {}", mov.getId(), e.getMessage());
                errores++;
            }
        }

        log.info("✅ Scheduler finalizado: {} liberados, {} errores.", liberados, errores);
    }
}

package com.tribu.api_tribu.scheduler;

import com.tribu.api_tribu.config.PuntosConfig;
import com.tribu.api_tribu.model.MovimientoSaldo;
import com.tribu.api_tribu.model.MovimientoSaldo.EstadoMovimiento;
import com.tribu.api_tribu.repository.MovimientoSaldoRepository;
import com.tribu.api_tribu.service.SaldoService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class PuntosExpiracionScheduler {

    private final MovimientoSaldoRepository movimientoSaldoRepository;
    private final SaldoService saldoService;
    private final PuntosConfig puntosConfig;

    public PuntosExpiracionScheduler(
            MovimientoSaldoRepository movimientoSaldoRepository,
            SaldoService saldoService,
            PuntosConfig puntosConfig) {
        this.movimientoSaldoRepository = movimientoSaldoRepository;
        this.saldoService = saldoService;
        this.puntosConfig = puntosConfig;
    }

    @Scheduled(cron = "0 30 3 * * *", zone = "America/Bogota")
    public void expirarPuntosAntiguos() {
        if (!puntosConfig.isExpiran()) {
            return;
        }

        LocalDateTime limite = LocalDateTime.now().minusDays(puntosConfig.getDiasExpiracion());
        List<MovimientoSaldo> movimientos = movimientoSaldoRepository.findMovimientosParaExpirar(limite);
        if (movimientos.isEmpty()) {
            return;
        }

        for (MovimientoSaldo mov : movimientos) {
            try {
                mov.setEstado(EstadoMovimiento.CANCELLED);
                movimientoSaldoRepository.save(mov);
                saldoService.sincronizarSaldoCache(mov.getUsuario().getId());
            } catch (Exception e) {
                // sin logging para mantener consistencia con base actual
            }
        }
    }
}

package com.tribu.api_tribu.scheduler;

import com.tribu.api_tribu.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class LeaderboardScheduler {

    private final LeaderboardService leaderboardService;

    @Scheduled(cron = "0 59 23 28-31 * *", zone = "America/Bogota")
    public void generarSnapshotFinDeMes() {
        log.info("🏆 [LeaderboardScheduler] Iniciando generación de snapshot mensual...");
        try {
            leaderboardService.generarSnapshotYPremiar();
        } catch (Exception e) {
            log.error("❌ [LeaderboardScheduler] Error al generar snapshot: {}", e.getMessage(), e);
        }
    }
}

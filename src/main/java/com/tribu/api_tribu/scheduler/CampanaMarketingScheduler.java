package com.tribu.api_tribu.scheduler;

import com.tribu.api_tribu.model.CampanaMarketing;
import com.tribu.api_tribu.model.EstadoCampana;
import com.tribu.api_tribu.repository.CampanaMarketingRepository;
import com.tribu.api_tribu.service.CampanaMarketingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CampanaMarketingScheduler {

    private final CampanaMarketingRepository campanaRepository;
    private final CampanaMarketingService campanaService;

    @Scheduled(fixedRate = 60000) // Revisar cada minuto
    public void revisarCampanasProgramadas() {
        LocalDateTime ahora = LocalDateTime.now();
        List<CampanaMarketing> programadas = campanaRepository.findByEstado(EstadoCampana.PROGRAMADA);

        for (CampanaMarketing campana : programadas) {
            if (campana.getFechaProgramada() != null && campana.getFechaProgramada().isBefore(ahora)) {
                log.info("⏰ [Scheduler] Iniciando campana programada: {}", campana.getTitulo());
                try {
                    campanaService.ejecutarCampana(campana.getId());
                } catch (Exception e) {
                    log.error("❌ Error ejecutando campana programada {}: {}", campana.getId(), e.getMessage());
                }
            }
        }
    }
}
package com.tribu.api_tribu.scheduler;

import com.tribu.api_tribu.model.TribuPass;
import com.tribu.api_tribu.model.TribuPass.EstadoPass;
import com.tribu.api_tribu.repository.TribuPassRepository;
import com.tribu.api_tribu.service.TribuPassService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class TribuPassScheduler {

    private final TribuPassRepository passRepo;
    private final TribuPassService passService;

    @Scheduled(cron = "0 0 9 * * *", zone = "America/Bogota")
    public void procesarRenovaciones() {
        log.info("🔄 Iniciando procesamiento de renovaciones de Tribu Pass...");
        
        LocalDateTime ahora = LocalDateTime.now();
        List<TribuPass> passesParaRenovar = passRepo.findByEstadoAndFechaRenovacionLessThanEqualAndRenovacionAutomaticaTrue(
                EstadoPass.ACTIVA, ahora);

        if (passesParaRenovar.isEmpty()) {
            log.info("No hay renovaciones de Tribu Pass para procesar hoy.");
            return;
        }

        log.info("{} renovaciones de Tribu Pass a procesar.", passesParaRenovar.size());
        
        for (var pass : passesParaRenovar) {
            try {
                passService.procesarRenovacion(pass);
            } catch (Exception e) {
                log.error("Error procesando renovación para usuario {}: {}", 
                        pass.getUsuario().getId(), e.getMessage());
            }
        }

        log.info("✅ Procesamiento de renovaciones de Tribu Pass completado.");
    }
}

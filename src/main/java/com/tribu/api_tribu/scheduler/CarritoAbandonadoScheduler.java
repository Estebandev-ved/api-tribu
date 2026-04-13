package com.tribu.api_tribu.scheduler;

import com.tribu.api_tribu.service.CarritoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CarritoAbandonadoScheduler {

    private final CarritoService carritoService;

    @Scheduled(cron = "0 0 * * * *")
    public void procesarCarritosAbandonados() {
        log.info("Scheduler carrito abandonado: iniciando...");
        
        try {
            carritoService.procesarRecordatorio1();
        } catch (Exception e) {
            log.error("Error en recordatorio 1: {}", e.getMessage());
        }

        try {
            carritoService.procesarRecordatorio2();
        } catch (Exception e) {
            log.error("Error en recordatorio 2: {}", e.getMessage());
        }

        try {
            carritoService.procesarIgnorados();
        } catch (Exception e) {
            log.error("Error procesando ignorados: {}", e.getMessage());
        }

        log.info("Scheduler carrito abandonado: completado");
    }
}
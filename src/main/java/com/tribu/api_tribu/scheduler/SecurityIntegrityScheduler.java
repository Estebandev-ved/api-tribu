package com.tribu.api_tribu.scheduler;

import com.tribu.api_tribu.service.SecurityAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * ⏰ SecurityIntegrityScheduler - Auditor Automático de Integridad en Segundo Plano.
 *
 * PROPÓSITO:
 *   Ejecutar auditorías periódicas y automáticas sobre la cadena de logs de seguridad para verificar
 *   que ningún registro haya sido alterado o eliminado directamente en la base de datos MySQL (mitigando amenazas internas).
 *
 * MEDIDAS DE SEGURIDAD IMPLEMENTADAS:
 *   1. Ejecución Recurrente Automatizada: Se ejecuta cada 5 minutos (300.000 ms) verificando la firma SHA-256
 *      de todos los eventos.
 *   2. Alertas Críticas Proactivas: En caso de que se detecte una rotura de la cadena de logs, el servicio dispara
 *      una alerta prioritaria por Telegram con detalles forenses.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SecurityIntegrityScheduler {

    private final SecurityAuditService securityAuditService;

    // Se ejecuta cada 5 minutos
    @Scheduled(fixedRate = 300000)
    public void auditarCadenaDeSeguridad() {
        log.info("⏰ Iniciando verificación periódica de inmutabilidad en la cadena de seguridad...");
        boolean esIntegra = securityAuditService.verificarIntegridadCadena();
        
        if (esIntegra) {
            log.info("✅ Verificación de integridad completada con éxito. La cadena de logs no ha sido alterada.");
        } else {
            log.error("🚨 ALERTA CRÍTICA: Se ha detectado una violación de la integridad en los logs de seguridad.");
        }
    }
}

package com.tribu.api_tribu.service;

import com.tribu.api_tribu.model.RegistroAcceso;
import com.tribu.api_tribu.model.SecurityEvent;
import com.tribu.api_tribu.repository.RegistroAccesoRepository;
import com.tribu.api_tribu.repository.SecurityEventRepository;
import com.tribu.api_tribu.telegram.TelegramNotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 🛡️ SecurityAuditService - Servicio de Auditoría y Detección de Amenazas.
 *
 * PROPÓSITO:
 *   Centralizar el registro de accesos, evaluar intentos de fuerza bruta, registrar eventos críticos de seguridad
 *   bajo una estructura inmutable encadenada de hashes (Log Chaining) para asegurar la integridad de la auditoría,
 *   y notificar de forma inmediata a los canales de administración en caso de anomalías detectadas.
 *
 * MEDIDAS DE SEGURIDAD IMPLEMENTADAS:
 *   1. Estructura Inmutable de Log-Chaining: Cada evento registrado contiene el hash SHA-256 calculado a partir de
 *      sus propios campos y el hash del evento anterior. Actúa como un registro continuo e inalterable en base de datos.
 *   2. Verificación de Integridad Críptica: Habilidad de comprobar recursivamente toda la cadena de logs. Si algún log
 *      ha sido editado o borrado directamente en la base de datos (ataques desde dentro / Insider Threats), el sistema
 *      rompe el hilo y reporta un fallo catastrófico de inmediato a Telegram.
 *   3. Bloqueo Antifuerza Bruta por IP: Al detectar 5 accesos fallidos en un lapso de 15 minutos, bloquea la IP cliente.
 *   4. Recuperación Segura de IP: Identificación de IPs reales detrás de proxies Nginx y túneles de Cloudflare.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityAuditService {

    private final RegistroAccesoRepository registroAccesoRepo;
    private final SecurityEventRepository securityEventRepo;
    private final TelegramNotificationService telegramNotificationService;
    
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_TIME_MINUTES = 15;
    private static final String GENESIS_BLOCK_HASH = "GENESIS_BLOCK_HASH_TRIBU_SECURE_CHAIN_V1";

    @Transactional
    public void registrarIntento(String email, HttpServletRequest request, boolean exitoso, String motivo) {
        String ipAddress = obtenerIpReal(request);
        String userAgent = request.getHeader("User-Agent");

        RegistroAcceso registro = RegistroAcceso.builder()
                .email(email != null ? email : "desconocido")
                .ipAddress(ipAddress)
                .exitoso(exitoso)
                .userAgent(userAgent != null && userAgent.length() > 500 ? userAgent.substring(0, 500) : userAgent)
                .motivoFallo(motivo != null && motivo.length() > 250 ? motivo.substring(0, 250) : motivo)
                .build();

        registroAccesoRepo.save(registro);

        // Si es un fallo de inicio de sesión de nivel crítico, registrar en la bitácora inmutable
        if (!exitoso && !"CUENTA_BLOQUEADA".equals(motivo)) {
            registrarEventoSeguridad(
                    "FAILED_LOGIN_ATTEMPT",
                    "MEDIUM",
                    "Intento de acceso fallido para el correo: " + email + ". Motivo: " + motivo,
                    email,
                    ipAddress,
                    userAgent,
                    null
            );
        }
    }

    public void validarFuerzaBruta(HttpServletRequest request) {
        String ipAddress = obtenerIpReal(request);
        LocalDateTime limiteTiempo = LocalDateTime.now().minusMinutes(LOCK_TIME_MINUTES);

        long fallosRecientes = registroAccesoRepo.countFailedAttemptsByIpSince(ipAddress, limiteTiempo);

        if (fallosRecientes >= MAX_FAILED_ATTEMPTS) {
            log.warn("🛡️ IP Bloqueada temporalmente por fuerza bruta: {}", ipAddress);
            
            // Registrar intento de ataque
            registrarEventoSeguridad(
                    "BRUTE_FORCE_BLOCKED",
                    "HIGH",
                    "IP bloqueada temporalmente tras " + fallosRecientes + " intentos fallidos consecutivos.",
                    "system@tribucard.com",
                    ipAddress,
                    request.getHeader("User-Agent"),
                    null
            );

            throw new SecurityException("Demasiados intentos fallidos. Tu IP está bloqueada por " + LOCK_TIME_MINUTES + " minutos.");
        }
    }

    /**
     * Registra un nuevo evento en la bitácora inmutable de seguridad calculando y encadenando el hash.
     */
    @Transactional
    public synchronized SecurityEvent registrarEventoSeguridad(
            String eventType, String severity, String description,
            String userEmail, String ipAddress, String userAgent,
            String encryptedPayload) {

        SecurityEvent lastEvent = securityEventRepo.findTopByOrderByIdDesc();
        String previousHash = (lastEvent != null && lastEvent.getCurrentHash() != null) 
                ? lastEvent.getCurrentHash() 
                : GENESIS_BLOCK_HASH;

        SecurityEvent newEvent = SecurityEvent.builder()
                .eventType(eventType)
                .severity(severity)
                .description(description)
                .userEmail(userEmail != null ? userEmail : "anonimo@tribu.com")
                .ipAddress(ipAddress != null ? ipAddress : "0.0.0.0")
                .userAgent(userAgent != null && userAgent.length() > 500 ? userAgent.substring(0, 500) : userAgent)
                .encryptedPayload(encryptedPayload)
                .previousHash(previousHash)
                .timestamp(LocalDateTime.now())
                .riskScore(calcularRiskScore(severity))
                .build();

        String currentHash = calculateEventHash(newEvent);
        newEvent.setCurrentHash(currentHash);

        log.info("🛡️ Evento de Seguridad encadenado inmutablemente: [{}] Hash: {}", eventType, currentHash);
        return securityEventRepo.save(newEvent);
    }

    /**
     * Valida de principio a fin la integridad referencial de todos los logs de seguridad.
     * Si detecta alteración o borrado de algún registro, se reporta inmediatamente una alerta catastrófica.
     */
    @Transactional(readOnly = true)
    public boolean verificarIntegridadCadena() {
        List<SecurityEvent> events = securityEventRepo.findAll(Sort.by(Sort.Direction.ASC, "id"));
        String expectedPreviousHash = GENESIS_BLOCK_HASH;

        for (SecurityEvent event : events) {
            // 1. Validar el enlace con el bloque anterior
            if (!expectedPreviousHash.equals(event.getPreviousHash())) {
                log.error("🚨 INTEGRIDAD DE LOGS COMPROMETIDA! Evento ID #{} tiene enlace previo inválido.", event.getId());
                telegramNotificationService.alertaErrorSistema(
                        "SECURITY_LOG_INTEGRITY",
                        "🚨 *VIOLACIÓN DE ENCADENAMIENTO DE LOGS DETECTADA*\n\n" +
                        "• *Evento afectado:* ID #" + event.getId() + "\n" +
                        "• *Causa:* El hash previo esperado era `..." + expectedPreviousHash.substring(Math.max(0, expectedPreviousHash.length() - 10)) + "` pero se encontró `..." + event.getPreviousHash().substring(Math.max(0, event.getPreviousHash().length() - 10)) + "`.\n" +
                        "⚠️ *Acción Recomendada:* Cuarentena inmediata de la base de datos y auditoría forense forense."
                );
                return false;
            }

            // 2. Validar que los campos actuales no hayan sido alterados
            String calculatedHash = calculateEventHash(event);
            if (!calculatedHash.equals(event.getCurrentHash())) {
                log.error("🚨 INTEGRIDAD DE LOGS COMPROMETIDA! Los campos del Evento ID #{} fueron manipulados.", event.getId());
                telegramNotificationService.alertaErrorSistema(
                        "SECURITY_LOG_INTEGRITY",
                        "🚨 *ALTERACIÓN DE EVENTO HISTÓRICO DE AUDITORÍA*\n\n" +
                        "• *Evento afectado:* ID #" + event.getId() + " (" + event.getEventType() + ")\n" +
                        "• *Causa:* El hash recalculado no coincide con el hash guardado en base de datos. Los campos fueron alterados directamente.\n" +
                        "⚠️ *Acción Recomendada:* Suspender retiros del sistema temporalmente hasta auditar logs de red."
                );
                return false;
            }

            expectedPreviousHash = event.getCurrentHash();
        }

        log.info("🛡️ Cadena de auditoría validada con éxito. Total bloques comprobados: {}", events.size());
        return true;
    }

    /**
     * Calcula el hash SHA-256 de los datos de un SecurityEvent.
     */
    private String calculateEventHash(SecurityEvent event) {
        try {
            String input = event.getEventType() + "|" +
                    event.getSeverity() + "|" +
                    event.getDescription() + "|" +
                    event.getUserEmail() + "|" +
                    event.getIpAddress() + "|" +
                    event.getPreviousHash();

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception ex) {
            log.error("Error calculando hash para el log inmutable", ex);
            throw new RuntimeException("Error en firma criptográfica de log", ex);
        }
    }

    private Integer calcularRiskScore(String severity) {
        return switch (severity.toUpperCase()) {
            case "LOW" -> 15;
            case "MEDIUM" -> 45;
            case "HIGH" -> 75;
            case "CRITICAL" -> 100;
            default -> 0;
        };
    }

    private String obtenerIpReal(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null ? ip : "Desconocida";
    }
}

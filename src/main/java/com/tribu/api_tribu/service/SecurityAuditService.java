package com.tribu.api_tribu.service;

import com.tribu.api_tribu.model.RegistroAcceso;
import com.tribu.api_tribu.repository.RegistroAccesoRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityAuditService {

    private final RegistroAccesoRepository registroAccesoRepo;
    
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_TIME_MINUTES = 15;

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
    }

    public void validarFuerzaBruta(HttpServletRequest request) {
        String ipAddress = obtenerIpReal(request);
        LocalDateTime limiteTiempo = LocalDateTime.now().minusMinutes(LOCK_TIME_MINUTES);

        long fallosRecientes = registroAccesoRepo.countFailedAttemptsByIpSince(ipAddress, limiteTiempo);

        if (fallosRecientes >= MAX_FAILED_ATTEMPTS) {
            log.warn("🛡️ IP Bloqueada temporalmente por fuerza bruta: {}", ipAddress);
            throw new SecurityException("Demasiados intentos fallidos. Tu IP está bloqueada por " + LOCK_TIME_MINUTES + " minutos.");
        }
    }

    private String obtenerIpReal(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // Si hay múltiples IPs en X-Forwarded-For toma la primera
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null ? ip : "Desconocida";
    }
}

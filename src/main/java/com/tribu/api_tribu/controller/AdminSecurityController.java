package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.model.RegistroAcceso;
import com.tribu.api_tribu.model.SecurityEvent;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.RegistroAccesoRepository;
import com.tribu.api_tribu.repository.SecurityEventRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/seguridad")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSecurityController {

    private final RegistroAccesoRepository registroAccesoRepo;
    private final SecurityEventRepository securityEventRepo;
    private final UsuarioRepository usuarioRepo;

    @GetMapping("/accesos")
    public ResponseEntity<List<RegistroAcceso>> getUltimosAccesos() {
        List<RegistroAcceso> accesos = registroAccesoRepo.findAll(Sort.by(Sort.Direction.DESC, "fecha"))
                .stream().limit(100).collect(Collectors.toList());
        return ResponseEntity.ok(accesos);
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<Map<String, Object>>> getActiveSessions() {
        List<RegistroAcceso> recientes = registroAccesoRepo.findRecentSuccessfulAccesses();
        
        // Agrupar por IP para evitar duplicados en la UI, mostrando la sesión más reciente
        Map<String, RegistroAcceso> uniqueSessions = new LinkedHashMap<>();
        for (RegistroAcceso r : recientes) {
            uniqueSessions.putIfAbsent(r.getIpAddress(), r);
        }

        List<Map<String, Object>> sessions = uniqueSessions.values().stream().map(r -> {
            long failedCount = registroAccesoRepo.countFailedAttemptsByIpSince(r.getIpAddress(), r.getFecha().minusDays(1));
            int riskScore = Math.min(100, (int) (failedCount * 15)); // Basic UBA risk calc
            String severity = riskScore > 75 ? "Critical" : riskScore > 50 ? "High" : riskScore > 25 ? "Medium" : "Low";

            Map<String, Object> map = new HashMap<>();
            map.put("email", r.getEmail());
            map.put("ip", r.getIpAddress());
            map.put("location", "Desconocida"); // Integrar GeoIP real si es necesario
            map.put("device", r.getUserAgent() != null ? (r.getUserAgent().length() > 30 ? r.getUserAgent().substring(0, 30) + "..." : r.getUserAgent()) : "Unknown Device");
            map.put("riskScore", riskScore);
            map.put("severity", severity);
            map.put("active", true);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/threats")
    public ResponseEntity<List<Map<String, Object>>> getThreatIntelligence() {
        List<RegistroAcceso> fallidos = registroAccesoRepo.findRecentFailedAccesses();

        // Agrupar fallidos por IP
        Map<String, Long> fallosPorIp = fallidos.stream()
                .collect(Collectors.groupingBy(RegistroAcceso::getIpAddress, Collectors.counting()));

        List<Map<String, Object>> threats = fallosPorIp.entrySet().stream().map(entry -> {
            String ip = entry.getKey();
            long count = entry.getValue();
            String severity = count > 10 ? "Critical" : count > 5 ? "High" : "Medium";
            String type = count > 10 ? "Posible Bot / Brute Force" : "Intento Fallido";

            // Coordenadas simuladas basadas en IP (Mock temporal para el mapa)
            double lat = 4.7110 + (Math.random() * 20 - 10);
            double lng = -74.0721 + (Math.random() * 20 - 10);

            Map<String, Object> map = new HashMap<>();
            map.put("ip", ip);
            map.put("location", "Análisis Automático");
            map.put("type", type);
            map.put("lat", lat);
            map.put("lng", lng);
            map.put("severity", severity);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(threats);
    }

    @GetMapping("/audit")
    public ResponseEntity<List<SecurityEvent>> getAuditLogs() {
        return ResponseEntity.ok(securityEventRepo.findTop100ByOrderByTimestampDesc());
    }

    @PostMapping("/action/{type}")
    public ResponseEntity<Map<String, String>> executeMitigationAction(@PathVariable String type, @RequestBody Map<String, String> payload) {
        String target = payload.get("target"); // IP or Email
        
        if ("QUARANTINE".equalsIgnoreCase(type) || "FORCE_RESET".equalsIgnoreCase(type)) {
            Optional<Usuario> optUser = usuarioRepo.findByEmail(target);
            if (optUser.isPresent()) {
                Usuario user = optUser.get();
                if ("QUARANTINE".equalsIgnoreCase(type)) {
                    user.setBloqueado(true);
                } else {
                    user.setResetPasswordToken(UUID.randomUUID().toString());
                    user.setResetPasswordExpires(LocalDateTime.now().plusMinutes(15));
                }
                usuarioRepo.save(user);
            }
        } else if ("BAN_IP".equalsIgnoreCase(type)) {
            // En prod real se inyectaría IP a iptables, WAF, o tabla `IpBlacklist`.
        } else if ("GLOBAL_REVOKE".equalsIgnoreCase(type)) {
            // Invalida todos los tokens/sesiones, requiere limpiar la tabla de tokens (si aplica).
        }

        // Log the action to Immutable Audit Log
        SecurityEvent event = SecurityEvent.builder()
            .eventType("MITIGATION_ACTION_" + type.toUpperCase())
            .severity("CRITICAL")
            .description("Executed " + type + " on target: " + target)
            .userEmail("admin@tribucard.com")
            .timestamp(LocalDateTime.now())
            .build();
        securityEventRepo.save(event);

        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Acción " + type + " ejecutada correctamente contra " + target);
        return ResponseEntity.ok(response);
    }
}

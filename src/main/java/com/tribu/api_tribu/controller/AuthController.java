package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.LoginRequest;
import com.tribu.api_tribu.dto.request.RegisterRequest;
import com.tribu.api_tribu.dto.response.AuthResponse;
import com.tribu.api_tribu.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.List;

import com.tribu.api_tribu.dto.request.GoogleLoginRequest;

/**
 * Controlador de autenticación.
 *
 * Seguridad implementada:
 * - Login con protección de fuerza bruta (SecurityAuditService).
 * - Soporte de doble factor (2FA/TOTP).
 * - Reset de contraseña via token temporal de 15 minutos.
 * - Prevención de enumeración de usuarios (forgot-password siempre devuelve 200).
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(request, httpRequest));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginConGoogle(@Valid @RequestBody GoogleLoginRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.loginConGoogle(request.getToken(), httpRequest));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.register(request, httpRequest));
    }

    /**
     * Segundo paso de autenticación cuando el usuario tiene 2FA activo.
     * Recibe el email y el código TOTP de 6 dígitos y devuelve el JWT final.
     */
    @PostMapping("/verify-2fa")
    public ResponseEntity<AuthResponse> verify2fa(@RequestBody Map<String, String> body, HttpServletRequest httpRequest) {
        String email = body.get("email");
        int codigo = Integer.parseInt(body.get("codigo"));
        return ResponseEntity.ok(authService.verify2fa(email, codigo, httpRequest));
    }

    /**
     * Solicita el enlace de recuperación de contraseña.
     * Siempre devuelve 200 para no revelar si el email existe (anti-enumeración).
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        authService.forgotPassword(body.get("email"));
        return ResponseEntity.ok(Map.of("mensaje", "Si el correo está registrado, recibirás un enlace de recuperación."));
    }

    /**
     * Restablece la contraseña usando el token del correo.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        authService.resetPassword(body.get("token"), body.get("nuevaPassword"));
        return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada correctamente. Ya puedes iniciar sesión."));
    }

    /**
     * Helper endpoint para promover el correo oficial de administración a ADMIN.
     * Seguridad: solo promueve el email 'tribuindustrias@gmail.com' de forma controlada.
     */
    @GetMapping("/promote-tribu")
    public ResponseEntity<Map<String, String>> promoteTribu() {
        authService.promoteToAdmin("tribuindustrias@gmail.com");
        return ResponseEntity.ok(Map.of("mensaje", "La cuenta tribuindustrias@gmail.com ha sido promovida a ADMIN con éxito."));
    }

    @GetMapping("/sesiones")
    public ResponseEntity<List<Map<String, Object>>> getSesiones(HttpServletRequest request) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || "anonymousUser".equals(email)) {
            return ResponseEntity.status(401).build();
        }
        
        String ip = obtenerIpReal(request);
        String userAgent = request.getHeader("User-Agent");
        return ResponseEntity.ok(authService.getSesiones(email, ip, userAgent));
    }

    @DeleteMapping("/sesiones/{id}")
    public ResponseEntity<Map<String, String>> cerrarSesion(@PathVariable Long id) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || "anonymousUser".equals(email)) {
            return ResponseEntity.status(401).build();
        }
        
        authService.cerrarSesion(id, email);
        return ResponseEntity.ok(Map.of("mensaje", "Sesión cerrada correctamente."));
    }

    @DeleteMapping("/sesiones/otras")
    public ResponseEntity<Map<String, String>> cerrarOtrasSesiones(HttpServletRequest request) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || "anonymousUser".equals(email)) {
            return ResponseEntity.status(401).build();
        }
        
        String ip = obtenerIpReal(request);
        String userAgent = request.getHeader("User-Agent");
        authService.cerrarOtrasSesiones(email, ip, userAgent);
        return ResponseEntity.ok(Map.of("mensaje", "Otras sesiones cerradas correctamente."));
    }

    private String obtenerIpReal(HttpServletRequest request) {
        if (request == null) return "Desconocida";
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

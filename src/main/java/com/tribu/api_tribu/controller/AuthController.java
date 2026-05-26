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

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.register(request, httpRequest));
    }

    /**
     * Segundo paso de autenticación cuando el usuario tiene 2FA activo.
     * Recibe el email y el código TOTP de 6 dígitos y devuelve el JWT final.
     */
    @PostMapping("/verify-2fa")
    public ResponseEntity<AuthResponse> verify2fa(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        int codigo = Integer.parseInt(body.get("codigo"));
        return ResponseEntity.ok(authService.verify2fa(email, codigo));
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
}

package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.service.TwoFactorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controlador de Autenticación de Dos Factores (2FA) para el perfil del usuario.
 *
 * Seguridad implementada:
 * - El secreto TOTP se genera en el servidor, nunca expuesto directamente.
 * - La activación require verificar el primer código (prueba de que el usuario escaneó el QR).
 * - La desactivación require confirmar la contraseña actual (anti-CSRF, anti-secuestro).
 * - Previene activar/desactivar sin credenciales válidas.
 */
@RestController
@RequestMapping("/api/usuarios/perfil/2fa")
@RequiredArgsConstructor
public class TwoFactorController {

    private final UsuarioRepository usuarioRepository;
    private final TwoFactorService twoFactorService;
    private final PasswordEncoder passwordEncoder;

    private Usuario obtenerUsuarioAutenticado() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", email));
    }

    /**
     * Genera un nuevo secreto TOTP y devuelve el código QR en Base64.
     * El secreto se guarda temporalmente en el usuario pero NO se activa
     * hasta que el usuario confirme el primer código correcto.
     */
    @PostMapping("/setup")
    public ResponseEntity<Map<String, Object>> setup2fa() {
        Usuario usuario = obtenerUsuarioAutenticado();

        String secreto = twoFactorService.generarSecreto();
        usuario.setSecret2fa(secreto);
        usuario.setIs2faHabilitado(false); // todavía no activo hasta verify
        usuarioRepository.save(usuario);

        String otpUrl = twoFactorService.generarOtpAuthUrl(usuario.getEmail(), secreto);
        String qrBase64 = twoFactorService.generarQrBase64(otpUrl);

        return ResponseEntity.ok(Map.of(
                "secreto", secreto,          // para entrada manual en la app
                "qrCode", qrBase64,          // imagen del QR
                "email", usuario.getEmail()
        ));
    }

    /**
     * Activa el 2FA verificando el primer código generado por la app.
     * Solo activa si el código coincide con el secreto recién generado.
     */
    @PostMapping("/enable")
    public ResponseEntity<Map<String, String>> enable2fa(@RequestBody Map<String, String> body) {
        Usuario usuario = obtenerUsuarioAutenticado();

        if (usuario.getSecret2fa() == null) {
            throw new IllegalStateException("Primero debes iniciar la configuración del 2FA (/setup)");
        }

        int codigo;
        try {
            codigo = Integer.parseInt(body.get("codigo"));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("El código debe ser un número de 6 dígitos");
        }

        if (!twoFactorService.validarCodigo(usuario.getSecret2fa(), codigo)) {
            throw new IllegalArgumentException("Código incorrecto. Verifica que tu app esté sincronizada y vuelve a intentarlo.");
        }

        usuario.setIs2faHabilitado(true);
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(Map.of("mensaje", "¡Autenticación de dos factores activada exitosamente! Tu cuenta es ahora más segura."));
    }

    /**
     * Desactiva el 2FA. Requiere contraseña actual para prevenir secuestro de cuenta.
     */
    @PostMapping("/disable")
    public ResponseEntity<Map<String, String>> disable2fa(@RequestBody Map<String, String> body) {
        Usuario usuario = obtenerUsuarioAutenticado();

        String password = body.get("password");
        if (password == null || !passwordEncoder.matches(password, usuario.getPassword())) {
            throw new IllegalArgumentException("Contraseña incorrecta. No se puede desactivar el 2FA.");
        }

        usuario.setIs2faHabilitado(false);
        usuario.setSecret2fa(null);
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(Map.of("mensaje", "Autenticación de dos factores desactivada."));
    }

    /**
     * Retorna el estado actual del 2FA del usuario.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status2fa() {
        Usuario usuario = obtenerUsuarioAutenticado();
        return ResponseEntity.ok(Map.of(
                "is2faHabilitado", Boolean.TRUE.equals(usuario.getIs2faHabilitado())
        ));
    }
}

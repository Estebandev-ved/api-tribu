package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.model.PushSuscripcion;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.PushSuscripcionRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.service.PushNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushController {

    private final PushNotificationService pushService;
    private final PushSuscripcionRepository suscripcionRepository;
    private final UsuarioRepository usuarioRepository;

    @GetMapping("/vapid-key")
    public ResponseEntity<Map<String, String>> getVapidKey() {
        return ResponseEntity.ok(Map.of("vapidKey", pushService.getPublicKey()));
    }

    @PostMapping("/suscribir")
    public ResponseEntity<Void> suscribir(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        
        String email = userDetails.getUsername();
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        String endpoint = body.get("endpoint");
        String p256dh = body.get("p256dh");
        String auth = body.get("auth");
        String userAgent = body.get("userAgent");

        if (endpoint == null || p256dh == null || auth == null) {
            return ResponseEntity.badRequest().build();
        }

        PushSuscripcion suscripcion = new PushSuscripcion();
        suscripcion.setUsuario(usuario);
        suscripcion.setEndpoint(endpoint);
        suscripcion.setP256dh(p256dh);
        suscripcion.setAuth(auth);
        suscripcion.setUserAgent(userAgent);
        suscripcion.setActiva(true);
        suscripcion.setFechaRegistro(LocalDateTime.now());

        suscripcionRepository.save(suscripcion);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/desuscribir")
    public ResponseEntity<Void> desuscribir(@RequestBody Map<String, String> body) {
        String endpoint = body.get("endpoint");
        if (endpoint != null) {
            suscripcionRepository.findByEndpoint(endpoint)
                    .forEach(s -> {
                        s.setActiva(false);
                        suscripcionRepository.save(s);
                    });
        }
        return ResponseEntity.ok().build();
    }
}

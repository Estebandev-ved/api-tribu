package com.tribu.api_tribu.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/usuarios/preferencias-notificaciones")
@RequiredArgsConstructor
public class UsuarioNotificacionesController {

    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    public ResponseEntity<Map<String, Object>> getPreferencias(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", userDetails.getUsername()));

        String jsonPrefs = usuario.getPreferenciasNotificaciones();
        Map<String, Object> prefsMap = new HashMap<>();

        if (jsonPrefs != null && !jsonPrefs.isBlank()) {
            try {
                prefsMap = objectMapper.readValue(jsonPrefs, new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                log.error("Error al deserializar preferencias de notificaciones para el usuario {}: {}", 
                        usuario.getEmail(), e.getMessage());
            }
        }

        return ResponseEntity.ok(prefsMap);
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> guardarPreferencias(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> preferencias) {
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", userDetails.getUsername()));

        try {
            String jsonPrefs = objectMapper.writeValueAsString(preferencias);
            usuario.setPreferenciasNotificaciones(jsonPrefs);
            usuarioRepository.save(usuario);
        } catch (Exception e) {
            log.error("Error al serializar preferencias de notificaciones para el usuario {}: {}", 
                    usuario.getEmail(), e.getMessage());
            return ResponseEntity.internalServerError().build();
        }

        return ResponseEntity.ok(preferencias);
    }
}

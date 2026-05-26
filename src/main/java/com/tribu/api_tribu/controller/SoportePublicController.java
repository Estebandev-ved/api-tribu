package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.model.SoporteConversacion;
import com.tribu.api_tribu.model.SoporteMensaje;
import com.tribu.api_tribu.service.SoporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/soporte")
@RequiredArgsConstructor
public class SoportePublicController {

    private final SoporteService soporteService;

    @GetMapping("/conversaciones")
    public ResponseEntity<List<SoporteConversacion>> getMisConversaciones(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(soporteService.getMisConversaciones(userDetails.getUsername()));
    }

    @PostMapping("/conversaciones")
    public ResponseEntity<SoporteConversacion> iniciarConversacion(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody(required = false) Map<String, Object> payload) {
        Long pedidoId = null;
        if (payload != null && payload.containsKey("pedidoId") && payload.get("pedidoId") != null) {
            Object val = payload.get("pedidoId");
            if (val instanceof Number) {
                pedidoId = ((Number) val).longValue();
            } else {
                try {
                    pedidoId = Long.parseLong(val.toString());
                } catch (NumberFormatException e) {
                    // Ignore
                }
            }
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(soporteService.iniciarConversacion(userDetails.getUsername(), pedidoId));
    }

    @GetMapping("/conversaciones/{id}/mensajes")
    public ResponseEntity<List<SoporteMensaje>> getMensajesConversacion(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(soporteService.getMensajesConversacion(id, userDetails.getUsername()));
    }

    @PostMapping("/conversaciones/{id}/mensajes")
    public ResponseEntity<SoporteMensaje> enviarMensajeUsuario(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String contenido = payload.get("contenido");
        if (contenido == null || contenido.trim().isEmpty()) {
            throw new IllegalArgumentException("El contenido del mensaje no puede estar vacío.");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(soporteService.enviarMensajeUsuario(id, contenido));
    }
}

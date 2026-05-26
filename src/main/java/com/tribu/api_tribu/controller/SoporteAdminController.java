package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.model.EstadoSoporte;
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
@RequestMapping("/api/admin/soporte")
@RequiredArgsConstructor
public class SoporteAdminController {

    private final SoporteService soporteService;

    @GetMapping("/conversaciones")
    public ResponseEntity<List<SoporteConversacion>> getConversacionesAdmin(
            @RequestParam(required = false) EstadoSoporte estado) {
        return ResponseEntity.ok(soporteService.getConversacionesAdmin(estado));
    }

    @GetMapping("/conversaciones/{id}/mensajes")
    public ResponseEntity<List<SoporteMensaje>> getMensajesConversacion(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(soporteService.getMensajesConversacion(id, userDetails.getUsername()));
    }

    @PostMapping("/conversaciones/{id}/mensajes")
    public ResponseEntity<SoporteMensaje> enviarMensajeAdmin(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String contenido = payload.get("contenido");
        if (contenido == null || contenido.trim().isEmpty()) {
            throw new IllegalArgumentException("El contenido del mensaje no puede estar vacío.");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(soporteService.enviarMensajeAdmin(id, contenido, userDetails.getUsername()));
    }

    @PostMapping("/conversaciones/{id}/resolver")
    public ResponseEntity<SoporteConversacion> resolverConversacion(@PathVariable Long id) {
        return ResponseEntity.ok(soporteService.resolverConversacion(id));
    }
}

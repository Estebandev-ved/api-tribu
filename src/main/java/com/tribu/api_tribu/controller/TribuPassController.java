package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.TribuPassActivarRequest;
import com.tribu.api_tribu.dto.response.TribuPassBeneficiosDTO;
import com.tribu.api_tribu.dto.response.TribuPassEstadoDTO;
import com.tribu.api_tribu.model.TribuPass;
import com.tribu.api_tribu.model.TribuPassRenovacion;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.service.TribuPassService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tribu-pass")
@RequiredArgsConstructor
public class TribuPassController {

    private final TribuPassService passService;
    private final UsuarioRepository usuarioRepo;

    @PostMapping("/activar")
    public ResponseEntity<?> activar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody(required = false) TribuPassActivarRequest request) {
        
        Usuario usuario = usuarioRepo.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        try {
            String metodoPago = request != null ? request.getMetodoPago() : "SALDO_TRIBU";
            TribuPass pass = passService.activar(usuario.getId(), metodoPago);

            Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("message", "Tribu Pass activado exitosamente");
            response.put("fechaRenovacion", pass.getFechaRenovacion());

            if (pass.getEfipayCheckoutUrl() != null) {
                response.put("efipayCheckoutUrl", pass.getEfipayCheckoutUrl());
                response.put("message", "Redirigiendo a Efipay para completar el pago...");
            }

            return ResponseEntity.ok(response);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/cancelar")
    public ResponseEntity<?> cancelar(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = usuarioRepo.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        try {
            passService.cancelar(usuario.getId());
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Tribu Pass cancelado exitosamente"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/mi-estado")
    public ResponseEntity<TribuPassEstadoDTO> getMiEstado(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = usuarioRepo.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        return ResponseEntity.ok(passService.getMiEstado(usuario.getId()));
    }

    @GetMapping("/historial")
    public ResponseEntity<List<TribuPassRenovacion>> getHistorial(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = usuarioRepo.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        return ResponseEntity.ok(passService.getHistorial(usuario.getId()));
    }

    @GetMapping("/beneficios")
    public ResponseEntity<TribuPassBeneficiosDTO> getBeneficios() {
        return ResponseEntity.ok(passService.getBeneficios());
    }

    @PutMapping("/renovacion-automatica")
    public ResponseEntity<?> actualizarRenovacionAutomatica(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Boolean> body) {
        
        Usuario usuario = usuarioRepo.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        try {
            passService.actualizarRenovacionAutomatica(usuario.getId(), body.get("enabled"));
            return ResponseEntity.ok(Map.of(
                "success", true,
                "renovacionAutomatica", body.get("enabled")
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/sync-efipay")
    public ResponseEntity<?> syncEfipay(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        Usuario usuario = usuarioRepo.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        String status = body.get("status");
        if ("approved".equalsIgnoreCase(status) || "Aprobada".equalsIgnoreCase(status)) {
            try {
                TribuPass pass = passService.confirmarPagoEfipayLocal(usuario.getId());
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Pago sincronizado localmente con éxito",
                    "estado", pass.getEstado()
                ));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
                ));
            }
        }
        return ResponseEntity.badRequest().body(Map.of(
            "success", false,
            "error", "El estado provisto no es 'approved'"
        ));
    }
}

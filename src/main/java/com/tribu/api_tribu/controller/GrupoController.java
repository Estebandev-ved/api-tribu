package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.service.GrupoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/grupos")
@RequiredArgsConstructor
public class GrupoController {

    private final GrupoService grupoService;

    @PostMapping("/crear")
    public ResponseEntity<?> crear(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        
        String nombre = (String) body.get("nombre");
        String emoji = (String) body.get("emoji");
        BigDecimal montoTotal = new BigDecimal(body.get("montoTotal").toString());

        return ResponseEntity.ok(grupoService.crearGrupo(userDetails.getUsername(), nombre, emoji, montoTotal));
    }

    @PostMapping("/unirse/{codigo}")
    public ResponseEntity<?> unirse(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String codigo) {
        
        grupoService.unirseAGrupo(userDetails.getUsername(), codigo);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/mis-grupos")
    public ResponseEntity<?> misGrupos(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(grupoService.listarMisGruposMapeados(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detalle(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(grupoService.obtenerDetalle(id));
    }

    @PostMapping("/{id}/pagar")
    public ResponseEntity<?> pagar(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {

        String metodoPago = body != null ? body.get("metodoPago") : null;

        if ("EFIPAY".equalsIgnoreCase(metodoPago)) {
            String checkoutUrl = grupoService.pagarParticipacionEfipay(userDetails.getUsername(), id);
            if (checkoutUrl != null) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "efipayCheckoutUrl", checkoutUrl,
                    "message", "Redirigiendo a Efipay para completar el pago..."
                ));
            }
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "No se pudo generar el pago con Efipay"
            ));
        }

        grupoService.pagarParticipacion(userDetails.getUsername(), id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Pago realizado exitosamente"));
    }
}

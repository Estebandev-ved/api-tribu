package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.service.QrCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 🛡️ QrController - Controlador para la gestión y validación de cobros con Códigos QR.
 */
@Slf4j
@RestController
@RequestMapping("/api/qr")
@RequiredArgsConstructor
public class QrController {

    private final QrCodeService qrCodeService;
    private final UsuarioRepository usuarioRepository;

    /**
     * Genera un código QR firmado digitalmente por el servidor.
     */
    @PostMapping("/generar")
    public ResponseEntity<?> generarQr(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        try {
            String email = userDetails.getUsername();
            double monto = Double.parseDouble(body.get("monto").toString());
            String mensaje = (String) body.get("mensaje");

            if (monto <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "El monto debe ser mayor a 0"));
            }

            Map<String, Object> qrResult = qrCodeService.generarQrCobroBase64(email, monto, mensaje);
            return ResponseEntity.ok(qrResult);
        } catch (Exception e) {
            log.error("Error al generar QR de cobro: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("message", "No se pudo generar el cobro por QR"));
        }
    }

    /**
     * Decodifica y valida la firma criptográfica HMAC-SHA256 de un código QR.
     * Retorna los datos del cobro garantizados contra manipulación.
     */
    @PostMapping("/escanear-verificar")
    public ResponseEntity<?> verificarQr(@RequestBody Map<String, Object> body) {
        try {
            String email = (String) body.get("email");
            double monto = Double.parseDouble(body.get("monto").toString());
            String mensaje = (String) body.get("mensaje");
            long timestamp = Long.parseLong(body.get("timestamp").toString());
            String signature = (String) body.get("signature");

            // 1. Validar firma criptográfica
            boolean esValido = qrCodeService.validarQrCobro(email, monto, mensaje, timestamp, signature);

            if (!esValido) {
                return ResponseEntity.badRequest().body(Map.of("message", "Código QR inválido, expirado o adulterado."));
            }

            // 2. Buscar datos del destinatario
            Usuario destinatario = usuarioRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("El destinatario del cobro no existe."));

            Map<String, Object> response = new HashMap<>();
            response.put("valido", true);
            response.put("destinatarioEmail", email);
            response.put("destinatarioNombre", destinatario.getNombreCompleto());
            response.put("destinatarioCodigo", destinatario.getCodigoReferido());
            response.put("monto", monto);
            response.put("mensaje", mensaje);
            response.put("timestamp", timestamp);
            response.put("signature", signature);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al verificar QR de cobro: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", "Error al procesar el código QR."));
        }
    }
}

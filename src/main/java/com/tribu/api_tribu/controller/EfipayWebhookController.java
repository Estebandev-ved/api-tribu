package com.tribu.api_tribu.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tribu.api_tribu.model.GrupoCompra;
import com.tribu.api_tribu.model.GrupoParticipante;
import com.tribu.api_tribu.model.Pedido;
import com.tribu.api_tribu.model.TribuPass;
import com.tribu.api_tribu.model.TribuPassRenovacion;
import com.tribu.api_tribu.repository.GrupoParticipanteRepository;
import com.tribu.api_tribu.repository.GrupoRepository;
import com.tribu.api_tribu.repository.PedidoRepository;
import com.tribu.api_tribu.repository.TribuPassRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.service.TierService;
import com.tribu.api_tribu.service.AchievementService;
import com.tribu.api_tribu.service.FacturaService;
import com.tribu.api_tribu.service.CashbackTierService;
import com.tribu.api_tribu.service.SaldoService;
import com.tribu.api_tribu.websocket.SaldoWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.HexFormat;
import java.util.List;

@RestController
@RequestMapping("/api/webhook/efipay")
@RequiredArgsConstructor
@Slf4j
public class EfipayWebhookController {

    private final PedidoRepository pedidoRepository;
    private final TribuPassRepository tribuPassRepository;
    private final UsuarioRepository usuarioRepository;
    private final GrupoParticipanteRepository grupoParticipanteRepository;
    private final GrupoRepository grupoRepository;
    private final SaldoService saldoService;
    private final SaldoWebSocketService wsService;
    private final TierService tierService;
    private final AchievementService achievementService;
    private final FacturaService facturaService;
    private final CashbackTierService cashbackTierService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${efipay.webhook.token}")
    private String webhookToken;

    @PostMapping("/transaction")
    public ResponseEntity<String> handleTransactionWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "Signature", required = false) String signature) {

        log.info("Received efipay webhook");

        if (!verifySignature(rawBody, signature)) {
            log.warn("Invalid webhook signature");
            return ResponseEntity.status(401).body("Invalid signature");
        }

        try {
            JsonNode payload = objectMapper.readTree(rawBody);
            JsonNode transaction = payload.get("transaction");
            if (transaction == null) {
                log.warn("Webhook missing transaction data");
                return ResponseEntity.badRequest().body("Missing transaction");
            }

            String status = transaction.get("status").asText();
            String paymentIdStr = String.valueOf(transaction.get("transaction_id").asInt());
            double amount = transaction.get("amount").asDouble();

            String reference = extractReference(payload);

            if (reference == null) {
                log.warn("No reference found in webhook payload");
                return ResponseEntity.ok("Received but no reference found");
            }

            // ── GRUPO: reference format "GRUPO-{groupId}-{userId}" ─────────
            if (reference.startsWith("GRUPO-")) {
                return procesarWebhookGrupo(reference, status);
            }

            // ── TRIBU PASS: reference format "PASS-{passId}" ──────────────
            if (reference.startsWith("PASS-")) {
                return procesarWebhookTribuPass(reference, status, paymentIdStr, amount);
            }

            // ── PEDIDO: reference is plain order ID ───────────────────────
            try {
                Long orderId = Long.parseLong(reference);
                return procesarWebhookPedido(orderId, status, paymentIdStr);
            } catch (NumberFormatException e) {
                log.warn("Could not parse reference as order ID: {}", reference);
            }

            return ResponseEntity.ok("Received but no mapping found");
        } catch (Exception e) {
            log.error("Error processing efipay webhook: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Error processing webhook");
        }
    }

    private String extractReference(JsonNode payload) {
        JsonNode checkout = payload.get("checkout");
        if (checkout != null && checkout.has("payment_gateway")) {
            JsonNode gateway = checkout.get("payment_gateway");
            if (gateway.has("advanced_option")) {
                JsonNode advancedOption = gateway.get("advanced_option");
                if (advancedOption.has("references") && advancedOption.get("references").isArray()
                        && advancedOption.get("references").size() > 0) {
                    return advancedOption.get("references").get(0).asText();
                }
            }
        }

        if (checkout != null && checkout.has("payment_referenceable_id")) {
            return checkout.get("payment_referenceable_id").asText();
        }

        return null;
    }

    private ResponseEntity<String> procesarWebhookPedido(Long orderId, String status, String paymentIdStr) {
        Pedido pedido = pedidoRepository.findById(orderId).orElse(null);

        if (pedido == null) {
            log.warn("Order {} not found for efipay webhook", orderId);
            return ResponseEntity.ok("Order not found");
        }

        pedido.setEfipayPaymentId(paymentIdStr);
        pedido.setEfipayStatus(status);

        if ("Aprobada".equalsIgnoreCase(status)) {
            pedido.setEstado("PAGADO");
            pedidoRepository.save(pedido);

            wsService.notificarSaldoActualizado(
                    pedido.getUsuario().getId(),
                    0,
                    "PURCHASE_EXTERNAL",
                    "Pago con Efipay aprobado para Pedido #" + pedido.getId());

            tierService.reevaluarTierUsuario(pedido.getUsuario());
            achievementService.procesarLogros(pedido.getUsuario());
            procesarCashback(pedido);

            try {
                facturaService.generarFacturaAutomatica(pedido.getId(), null, null);
            } catch (Exception e) {
                log.warn("No se pudo generar factura automática para pedido {}: {}", pedido.getId(), e.getMessage());
            }

            log.info("Order {} approved and marked as PAGADO via efipay", orderId);
        } else if ("Rechazada".equalsIgnoreCase(status)) {
            pedido.setEstado("RECHAZADO");
            pedidoRepository.save(pedido);
            log.info("Order {} rejected by efipay", orderId);
        } else {
            pedido.setEstado("PENDIENTE");
            pedidoRepository.save(pedido);
            log.info("Order {} status updated to {} via efipay", orderId, status);
        }

        return ResponseEntity.ok("OK");
    }

    private ResponseEntity<String> procesarWebhookTribuPass(String reference, String status, String paymentId, double amount) {
        Long passId = Long.parseLong(reference.replace("PASS-", ""));
        TribuPass pass = tribuPassRepository.findById(passId).orElse(null);

        if (pass == null) {
            log.warn("TribuPass not found for reference: {}", reference);
            return ResponseEntity.ok("TribuPass not found");
        }

        pass.setEfipayPaymentId(paymentId);
        pass.setEfipayStatus(status);

        if ("Aprobada".equalsIgnoreCase(status)) {
            pass.setEstado(TribuPass.EstadoPass.ACTIVA);
            pass.setRenovacionAutomatica(true);
            pass.setFechaInicio(java.time.LocalDateTime.now());
            pass.setFechaRenovacion(java.time.LocalDateTime.now().plusDays(30));
            tribuPassRepository.save(pass);

            var usuario = pass.getUsuario();
            usuario.setTribuPassActiva(true);
            usuarioRepository.save(usuario);

            // NOTA: No se debita saldo interno — el cobro fue externo vía Efipay
            TribuPassRenovacion renovacion = TribuPassRenovacion.builder()
                    .pass(pass)
                    .fecha(java.time.LocalDateTime.now())
                    .monto(pass.getPrecio())
                    .estado(TribuPassRenovacion.EstadoRenovacion.EXITOSA)
                    .movimientoId(null)
                    .build();
            pass.getHistorial().add(renovacion);
            tribuPassRepository.save(pass);

            wsService.notificarSaldoActualizado(
                    usuario.getId(), 0,
                    "TRIBU_PASS_ACTIVADO",
                    "Tribu Pass activado via Efipay");

            log.info("Tribu Pass activated via efipay for user {}", usuario.getId());
        } else if ("Rechazada".equalsIgnoreCase(status)) {
            pass.setEstado(TribuPass.EstadoPass.CANCELADA);
            tribuPassRepository.save(pass);
            log.info("Tribu Pass payment rejected via efipay for pass {}", pass.getId());
        }

        return ResponseEntity.ok("OK");
    }

    private ResponseEntity<String> procesarWebhookGrupo(String reference, String status) {
        String[] parts = reference.split("-");
        if (parts.length < 3) {
            log.warn("Invalid grupo reference format: {}", reference);
            return ResponseEntity.ok("Invalid reference");
        }

        Long grupoId = Long.parseLong(parts[1]);
        Long usuarioId = Long.parseLong(parts[2]);

        if (!"Aprobada".equalsIgnoreCase(status)) {
            log.info("Grupo payment {} for group {} user {} not approved", status, grupoId, usuarioId);
            return ResponseEntity.ok("OK");
        }

        GrupoParticipante participante = grupoParticipanteRepository
                .findByGrupoIdAndUsuarioId(grupoId, usuarioId).orElse(null);

        if (participante == null) {
            log.warn("Participante not found for grupo {} usuario {}", grupoId, usuarioId);
            return ResponseEntity.ok("Participante not found");
        }

        if (participante.isPagado()) {
            log.info("Participante {} already paid for grupo {}", usuarioId, grupoId);
            return ResponseEntity.ok("Already paid");
        }

        participante.setPagado(true);
        participante.setEstado("PAGADO");
        grupoParticipanteRepository.save(participante);

        List<GrupoParticipante> todos = grupoParticipanteRepository.findByGrupoId(grupoId);
        boolean todosPagados = todos.stream().allMatch(GrupoParticipante::isPagado);
        if (todosPagados) {
            grupoRepository.findById(grupoId).ifPresent(grupo -> {
                grupo.setEstado(GrupoCompra.EstadoGrupo.COMPLETADO);
                grupoRepository.save(grupo);
                log.info("Grupo {} completed — all members paid", grupoId);
            });
        }

        log.info("Grupo payment approved: group={}, user={}", grupoId, usuarioId);
        return ResponseEntity.ok("OK");
    }

    private boolean verifySignature(String body, String signature) {
        if (signature == null || signature.isBlank()) {
            log.warn("No signature provided in webhook");
            return true;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(webhookToken.getBytes(), "HmacSHA256");
            mac.init(keySpec);
            byte[] hmacBytes = mac.doFinal(body.getBytes());
            String expectedSignature = HexFormat.of().formatHex(hmacBytes);
            return expectedSignature.equals(signature);
        } catch (Exception e) {
            log.error("Error verifying webhook signature: {}", e.getMessage());
            return false;
        }
    }

    private void procesarCashback(Pedido pedido) {
        var usuario = pedido.getUsuario();
        double porcentaje = cashbackTierService.getPorcentajeCashback(usuario);
        saldoService.registrarCashbackDiferido(
                usuario,
                pedido.getTotal().doubleValue(),
                porcentaje,
                pedido.getId());
    }
}

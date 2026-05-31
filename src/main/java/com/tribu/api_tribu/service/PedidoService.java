package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.request.ActualizarEstadoPedidoRequest;
import com.tribu.api_tribu.dto.request.CrearPedidoRequest;
import com.tribu.api_tribu.dto.response.PedidoResponse;
import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.*;
import com.tribu.api_tribu.repository.PedidoRepository;
import com.tribu.api_tribu.repository.ProductoRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.websocket.SaldoWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * CAMBIOS RESPECTO A LA VERSIÓN ANTERIOR:
 *
 * ❌ ANTES: usuario.setSaldoFavor(usuario.getSaldoFavor() + montoCashback)
 * + movimientoSaldoRepository.save(mov) → mutación directa
 *
 * ✅ AHORA: saldoService.registrarCashbackDiferido(...) →
 * crea MovimientoSaldo en ON_HOLD
 * el Scheduler lo libera 7 días después
 * WebSocket notifica al frontend cuando se libera
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PedidoService {

    private final ApplicationEventPublisher eventPublisher;
    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;
    private final SaldoService saldoService;
    private final SaldoWebSocketService wsService;
    private final CashbackTierService cashbackTierService;
    private final InventarioService inventarioService;
    private final PushNotificationService pushNotificationService;
    private final com.tribu.api_tribu.telegram.TelegramNotificationService telegramService;
    private final TierService tierService;
    private final AchievementService achievementService;
    private final FacturaService facturaService;
    private final CuponService cuponService;
    private final EfipayService efipayService;

    @Value("${efipay.webhook.url}")
    private String efipayWebhookUrl;

    @Value("${efipay.app.base.url}")
    private String efipayAppBaseUrl;

    @Transactional
    public PedidoResponse crearPedido(String emailUsuario, CrearPedidoRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", emailUsuario));

        Pedido pedido = new Pedido();
        pedido.setUsuario(usuario);
        pedido.setDireccionEnvio(request.getDireccionEnvio());

        List<DetallePedido> detalles = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (CrearPedidoRequest.ItemPedidoRequest item : request.getItems()) {
            Producto producto = productoRepository.findById(item.getProductoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto", "id", item.getProductoId()));

            if (producto.getStock() < item.getCantidad()) {
                throw new IllegalArgumentException(
                        "Stock insuficiente para: " + producto.getNombre()
                                + ". Disponible: " + producto.getStock());
            }

            producto.setStock(producto.getStock() - item.getCantidad());
            productoRepository.save(producto);

            inventarioService.verificarStockPostVenta(producto);

            if (total.doubleValue() >= 500_000) {
                pushNotificationService.enviarAUsuario(
                        usuario.getId(),
                        "💎 Pedido Grande",
                        "Tu pedido #" + pedido.getId() + " ha sido recibido",
                        "/mis-pedidos");
            }

            BigDecimal subtotal = producto.getPrecio().multiply(BigDecimal.valueOf(item.getCantidad()));
            total = total.add(subtotal);

            DetallePedido detalle = new DetallePedido();
            detalle.setPedido(pedido);
            detalle.setProducto(producto);
            detalle.setCantidad(item.getCantidad());
            detalle.setPrecioUnitario(producto.getPrecio());
            detalle.setSubtotal(subtotal);
            detalles.add(detalle);
        }

        double descuento = 0.0;
        if (request.getCuponCodigo() != null && !request.getCuponCodigo().trim().isEmpty()) {
            com.tribu.api_tribu.dto.response.CuponValidacionDTO validacion = cuponService.validar(request.getCuponCodigo(), usuario.getId(), total.doubleValue());
            if (validacion.getValido()) {
                descuento = validacion.getDescuento();
                total = total.subtract(BigDecimal.valueOf(descuento));
                if (total.doubleValue() < 0) {
                    total = BigDecimal.ZERO;
                }
            } else {
                throw new IllegalArgumentException("El cupón no es válido: " + validacion.getError());
            }
        }

        pedido.setTotal(total);
        pedido.setDetalles(detalles);
        pedido.setMetodoPago(request.getMetodoPago() != null ? request.getMetodoPago() : "EFECTIVO");
        pedido.setTransportadora(request.getTransportadora());
        if (cashbackTierService.tieneEnvioGratis(usuario)) {
            log.info("💎 Enforcing $0 COP free shipping for Tribu Pass / VIP user {}", usuario.getId());
            pedido.setCostoEnvio(BigDecimal.ZERO);
        } else if (request.getCostoEnvio() != null) {
            pedido.setCostoEnvio(BigDecimal.valueOf(request.getCostoEnvio()));
        } else {
            pedido.setCostoEnvio(BigDecimal.ZERO);
        }
        pedido.setInstruccionesEntrega(request.getInstruccionesEntrega());

        // ── DETERMINAR ESTADO SEGÚN MÉTODO DE PAGO ────────────────────────
        // TRIBU_CARD   → PAGADO inmediato (saldo descontado al momento)
        // EFIPAY       → PENDIENTE hasta que el webhook confirme el pago
        // CONTRAENTREGA→ PENDIENTE_ENTREGA (el cliente paga al recibir en casa)
        // Seguridad: nunca se asume pago sin confirmación real
        String metodoPago = request.getMetodoPago() != null ? request.getMetodoPago() : "EFECTIVO";
        if ("TRIBU_CARD".equalsIgnoreCase(metodoPago)) {
            pedido.setEstado("PAGADO");
        } else if ("EFIPAY".equalsIgnoreCase(metodoPago)) {
            pedido.setEstado("PENDIENTE");
        } else if ("CONTRAENTREGA".equalsIgnoreCase(metodoPago)) {
            pedido.setEstado("PENDIENTE_ENTREGA");
        } else {
            pedido.setEstado("PENDIENTE");
        }

        Pedido savedPedido = pedidoRepository.save(pedido);

        // Si se aplicó un cupón, lo registramos como usado en la base de datos
        if (descuento > 0.0 && request.getCuponCodigo() != null) {
            cuponService.aplicarCupon(request.getCuponCodigo(), usuario.getId(), savedPedido.getId(), descuento);
        }

        // ── EFIPAY: Generar pago en la pasarela ──────────────────────────
        if ("EFIPAY".equalsIgnoreCase(metodoPago)) {
            String approvedUrl = efipayAppBaseUrl + "/mis-pedidos?efipay=approved";
            String rejectedUrl = efipayAppBaseUrl + "/checkout?efipay=rejected";
            String pendingUrl = efipayAppBaseUrl + "/mis-pedidos?efipay=pending";

            EfipayService.EfipayPaymentResponse efipayResponse = efipayService.generatePayment(
                    String.valueOf(savedPedido.getId()),
                    savedPedido.getTotal().doubleValue(),
                    "Pedido #" + savedPedido.getId() + " - Tribu",
                    efipayWebhookUrl,
                    approvedUrl,
                    rejectedUrl,
                    pendingUrl
            );

            if (efipayResponse != null) {
                savedPedido.setEfipayPaymentId(efipayResponse.paymentId());
                savedPedido.setEfipayCheckoutUrl(efipayResponse.checkoutUrl());
                savedPedido.setEfipayStatus("PENDIENTE");
                pedidoRepository.save(savedPedido);
            } else {
                log.error("Failed to generate efipay payment for order {}", savedPedido.getId());
                throw new RuntimeException("Error al generar el pago con Efipay. Intenta de nuevo.");
            }
        }

        // Si es Tribu Card, procesamos el descuento real del ledger
        if ("PAGADO".equals(savedPedido.getEstado())) {
            saldoService.registrarCompraConSaldo(
                    usuario,
                    savedPedido.getTotal().doubleValue(),
                    savedPedido.getId());

            // Notificar reducción de saldo vía WS
            wsService.notificarSaldoActualizado(
                    usuario.getId(),
                    -savedPedido.getTotal().doubleValue(),
                    "PURCHASE",
                    "Pago de Pedido #" + savedPedido.getId());

            // Recalcular tier en tiempo real para feedback inmediato
            tierService.reevaluarTierUsuario(usuario);

            // Procesar logros y recompensas (Fase Gamificación)
            achievementService.procesarLogros(usuario);

            // 💎 NUEVO: Registrar cashback inmediatamente si ya está PAGADO (Tribu Card)
            procesarCashback(savedPedido);

            try {
                facturaService.generarFacturaAutomatica(savedPedido.getId(), null, null);
            } catch (Exception e) {
                log.warn("No se pudo generar factura automática para pedido {}: {}", savedPedido.getId(), e.getMessage());
            }
        }

        // Evento de notificación interna (siempre se registra al crear el pedido)
        eventPublisher.publishEvent(new NotificacionEvent(
                "PEDIDO",
                "Nuevo pedido recibido",
                "El usuario " + usuario.getNombreCompleto() + " realizó un nuevo pedido.",
                usuario.getId().toString()));

        // ──────────────────────────────────────────────────────────────────────
        // NOTA: El correo de confirmación y la alerta de Telegram para pedidos
        // con Efipay se envían SOLO después de que el pago sea confirmado
        // por el webhook de Efipay (EfipayWebhookController#procesarWebhookPedido).
        // Para pedidos pagados de inmediato con Tribu Card, sí notificamos aquí.
        // ──────────────────────────────────────────────────────────────────────
        if (!"EFIPAY".equalsIgnoreCase(metodoPago)) {
            emailService.enviarConfirmacionPedido(
                    usuario.getEmail(), usuario.getNombreCompleto(),
                    savedPedido.getId(), "$" + total.toPlainString());

            if (savedPedido.getTotal().doubleValue() >= 500_000) {
                telegramService.alertaPedidoGrande(savedPedido.getId(), savedPedido.getTotal().doubleValue());
            }
        }

        return toResponse(savedPedido);
    }

    @Transactional
    public PedidoResponse actualizarEstado(Long id, ActualizarEstadoPedidoRequest request) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", "id", id));

        String estadoAnterior = pedido.getEstado();
        String nuevoEstado = request.getEstado().toUpperCase();

        pedido.setEstado(nuevoEstado);
        if (request.getGuiaRastreo() != null) {
            pedido.setGuiaRastreo(request.getGuiaRastreo());
        }
        Pedido saved = pedidoRepository.save(pedido);

        // ── CASHBACK DIFERIDO ──────────────────────────────────────────────
        // Solo se registra cuando el pedido pasa a ENTREGADO (una sola vez).
        // Se crea en ON_HOLD — el Scheduler lo libera en 7 días.
        if (!"ENTREGADO".equals(estadoAnterior) && "ENTREGADO".equals(nuevoEstado)) {
            procesarCashback(saved);
        }

        if (!"PAGADO".equalsIgnoreCase(estadoAnterior) && "PAGADO".equalsIgnoreCase(nuevoEstado)) {
            try {
                facturaService.generarFacturaAutomatica(saved.getId(), null, null);
            } catch (Exception e) {
                log.warn("No se pudo generar factura automática para pedido {}: {}", saved.getId(), e.getMessage());
            }
        }

        emailService.enviarCambioEstado(
                pedido.getUsuario().getEmail(),
                pedido.getUsuario().getNombreCompleto(),
                pedido.getId(),
                request.getEstado(),
                request.getGuiaRastreo());

        return toResponse(saved);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    public List<PedidoResponse> getMisPedidos(String emailUsuario) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", emailUsuario));
        return pedidoRepository.findByUsuarioOrderByFechaPedidoDesc(usuario).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public List<PedidoResponse> getAllPedidos() {
        return pedidoRepository.findAllByOrderByFechaPedidoDesc().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public List<PedidoResponse> getByEstado(String estado) {
        return pedidoRepository.findByEstadoOrderByFechaPedidoDesc(estado).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    private void procesarCashback(Pedido pedido) {
        Usuario usuario = pedido.getUsuario();
        double porcentaje = cashbackTierService.getPorcentajeCashback(usuario);

        double subtotal = pedido.getTotal().doubleValue() - (pedido.getCostoEnvio() != null ? pedido.getCostoEnvio().doubleValue() : 0.0);
        if (subtotal < 0) subtotal = 0;

        saldoService.registrarCashbackDiferido(
                usuario,
                subtotal,
                porcentaje,
                pedido.getId());
    }

    private PedidoResponse toResponse(Pedido p) {
        List<PedidoResponse.DetallePedidoResponse> detallesResponse = p.getDetalles().stream()
                .map(d -> PedidoResponse.DetallePedidoResponse.builder()
                        .id(d.getId())
                        .productoId(d.getProducto().getId())
                        .productoNombre(d.getProducto().getNombre())
                        .productoImagenUrl(d.getProducto().getImagenUrl())
                        .cantidad(d.getCantidad())
                        .precioUnitario(d.getPrecioUnitario())
                        .subtotal(d.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return PedidoResponse.builder()
                .id(p.getId())
                .clienteNombre(p.getUsuario().getNombreCompleto())
                .clienteEmail(p.getUsuario().getEmail())
                .fechaPedido(p.getFechaPedido())
                .estado(p.getEstado())
                .total(p.getTotal())
                .metodoPago(p.getMetodoPago())
                .transportadora(p.getTransportadora())
                .costoEnvio(p.getCostoEnvio())
                .instruccionesEntrega(p.getInstruccionesEntrega())
                .direccionEnvio(p.getDireccionEnvio())
                .guiaRastreo(p.getGuiaRastreo())
                .efipayCheckoutUrl(p.getEfipayCheckoutUrl())
                .detalles(detallesResponse)
                .build();
    }
}

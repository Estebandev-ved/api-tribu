package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.request.ActualizarEstadoPedidoRequest;
import com.tribu.api_tribu.dto.request.CrearPedidoRequest;
import com.tribu.api_tribu.dto.response.PedidoResponse;
import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.*;
import com.tribu.api_tribu.repository.PedidoRepository;
import com.tribu.api_tribu.repository.ProductoRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.repository.MovimientoSaldoRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PedidoService {

        private final ApplicationEventPublisher eventPublisher;
        private final PedidoRepository pedidoRepository;
        private final ProductoRepository productoRepository;
        private final UsuarioRepository usuarioRepository;
        private final MovimientoSaldoRepository movimientoSaldoRepository;
        private final EmailService emailService;

        @Transactional
        public PedidoResponse crearPedido(String emailUsuario, CrearPedidoRequest request) {
                Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", emailUsuario));

                Pedido pedido = new Pedido();
                pedido.setUsuario(usuario);
                pedido.setDireccionEnvio(request.getDireccionEnvio());
                pedido.setEstado("PENDIENTE");

                List<DetallePedido> detalles = new ArrayList<>();
                BigDecimal total = BigDecimal.ZERO;

                for (CrearPedidoRequest.ItemPedidoRequest item : request.getItems()) {
                        Producto producto = productoRepository.findById(item.getProductoId())
                                        .orElseThrow(() -> new ResourceNotFoundException("Producto", "id",
                                                        item.getProductoId()));

                        if (producto.getStock() < item.getCantidad()) {
                                throw new IllegalArgumentException(
                                                "Stock insuficiente para el producto: " + producto.getNombre()
                                                                + ". Stock disponible: " + producto.getStock());
                        }

                        // Descontar stock
                        producto.setStock(producto.getStock() - item.getCantidad());
                        productoRepository.save(producto);

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

                NotificacionEvent event = new NotificacionEvent(
                                "PEDIDO",
                                "Nuevo pedido recibido",
                                "El usuario " + pedido.getUsuario().getNombreCompleto() + " realizó un nuevo pedido.",
                                pedido.getUsuario().getId().toString());
                eventPublisher.publishEvent(event);

                pedido.setTotal(total);
                pedido.setDetalles(detalles);
                Pedido savedPedido = pedidoRepository.save(pedido);

                // Email de confirmación (async, no bloquea)
                String totalFormateado = "$" + total.toPlainString();
                emailService.enviarConfirmacionPedido(
                                usuario.getEmail(), usuario.getNombreCompleto(),
                                savedPedido.getId(), totalFormateado);

                return toResponse(savedPedido);

        }

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

                // --- LÓGICA DE CASHBACK AUTOMÁTICO PARA BILLETERA ---
                if (!"ENTREGADO".equals(estadoAnterior) && "ENTREGADO".equals(nuevoEstado)) {
                        Usuario usuario = pedido.getUsuario();
                        double porcentajeCashback = 0.01; // Bronce por defecto (1%)

                        if (usuario.getNivelVip() != null) {
                                if (usuario.getNivelVip() == 2)
                                        porcentajeCashback = 0.03; // Plata 3%
                                else if (usuario.getNivelVip() == 3)
                                        porcentajeCashback = 0.05; // Oro 5%
                        }

                        double montoCashback = pedido.getTotal().doubleValue() * porcentajeCashback;

                        if (montoCashback > 0) {
                                usuario.setSaldoFavor(usuario.getSaldoFavor() + montoCashback);
                                usuarioRepository.save(usuario);

                                MovimientoSaldo mov = MovimientoSaldo.builder()
                                                .usuario(usuario)
                                                .monto(montoCashback)
                                                .tipo("CASHBACK_COMPRA")
                                                .descripcion("Cashback (" + (porcentajeCashback * 100)
                                                                + "%) por compra de Pedido #" + pedido.getId())
                                                .build();
                                movimientoSaldoRepository.save(mov);
                        }
                }

                // Notificar al cliente del cambio de estado (async)
                emailService.enviarCambioEstado(
                                pedido.getUsuario().getEmail(),
                                pedido.getUsuario().getNombreCompleto(),
                                pedido.getId(),
                                request.getEstado(),
                                request.getGuiaRastreo());

                return toResponse(saved);
        }

        // ——— Helper ———

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
                                .direccionEnvio(p.getDireccionEnvio())
                                .guiaRastreo(p.getGuiaRastreo())
                                .detalles(detallesResponse)
                                .build();
        }
}

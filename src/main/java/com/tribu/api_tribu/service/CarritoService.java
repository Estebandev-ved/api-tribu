package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.request.CarritoItemRequest;
import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.*;
import com.tribu.api_tribu.repository.CarritoAbandonadoRepository;
import com.tribu.api_tribu.repository.ProductoRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CarritoService {

    private final CarritoAbandonadoRepository carritoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;
    private final EmailService emailService;
    private final CashbackTierService cashbackTierService;

    @Transactional
    public void actualizarCarrito(Long usuarioId, List<CarritoItemRequest> items) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id", usuarioId));

        CarritoAbandonado carrito = carritoRepository.findByUsuarioIdAndEstado(usuarioId, EstadoCarrito.ACTIVO)
                .orElse(CarritoAbandonado.builder()
                        .usuario(usuario)
                        .estado(EstadoCarrito.ACTIVO)
                        .build());

        double total = 0;
        carrito.getItems().clear();

        for (CarritoItemRequest itemReq : items) {
            Producto producto = productoRepository.findById(itemReq.getProductoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto", "id", itemReq.getProductoId()));

            CarritoItem item = CarritoItem.builder()
                    .carrito(carrito)
                    .producto(producto)
                    .cantidad(itemReq.getCantidad())
                    .precioSnapshot(producto.getPrecio().doubleValue())
                    .build();

            carrito.getItems().add(item);
            total += item.getCantidad() * item.getPrecioSnapshot();
        }

        carrito.setTotalEstimado(total);
        carrito.setFechaUltimaModificacion(LocalDateTime.now());
        carritoRepository.save(carrito);

        log.info("Carrito actualizado para usuario {}", usuarioId);
    }

    @Transactional
    public void marcarConvertido(Long usuarioId) {
        CarritoAbandonado carrito = carritoRepository.findByUsuarioIdAndEstado(usuarioId, EstadoCarrito.ACTIVO)
                .orElse(carritoRepository.findByUsuarioIdAndEstado(usuarioId, EstadoCarrito.RECORDATORIO_1)
                        .orElse(carritoRepository.findByUsuarioIdAndEstado(usuarioId, EstadoCarrito.RECORDATORIO_2)
                                .orElse(null)));

        if (carrito != null) {
            carrito.setEstado(EstadoCarrito.CONVERTIDO);
            carrito.setFechaUltimaModificacion(LocalDateTime.now());
            carritoRepository.save(carrito);
            log.info("Carrito del usuario {} marcado como convertido", usuarioId);
        }
    }

    public CarritoAbandonado getCarritoActivo(Long usuarioId) {
        return carritoRepository.findByUsuarioIdAndEstado(usuarioId, EstadoCarrito.ACTIVO).orElse(null);
    }

    @Transactional
    public void procesarRecordatorio1() {
        LocalDateTime limite = LocalDateTime.now().minusHours(1);
        List<CarritoAbandonado> carritos = carritoRepository
                .findByEstadoAndFechaModificacionBefore(EstadoCarrito.ACTIVO, limite);

        log.info("Scheduler carrito: {} carritos activos para recordatorio 1", carritos.size());

        for (CarritoAbandonado carrito : carritos) {
            try {
                enviarRecordatorio1(carrito);
                carrito.setEstado(EstadoCarrito.RECORDATORIO_1);
                carrito.setEmailEnviadoEn(LocalDateTime.now());
                carritoRepository.save(carrito);
            } catch (Exception e) {
                log.error("Error enviando recordatorio 1 al usuario {}: {}", 
                        carrito.getUsuario().getId(), e.getMessage());
            }
        }
    }

    @Transactional
    public void procesarRecordatorio2() {
        LocalDateTime limite = LocalDateTime.now().minusHours(24);
        List<CarritoAbandonado> carritos = carritoRepository
                .findByEstadoAndFechaModificacionBefore(EstadoCarrito.RECORDATORIO_1, limite);

        log.info("Scheduler carrito: {} carritos para recordatorio 2", carritos.size());

        for (CarritoAbandonado carrito : carritos) {
            try {
                enviarRecordatorio2(carrito);
                carrito.setEstado(EstadoCarrito.RECORDATORIO_2);
                carrito.setEmailEnviadoEn(LocalDateTime.now());
                carritoRepository.save(carrito);
            } catch (Exception e) {
                log.error("Error enviando recordatorio 2 al usuario {}: {}", 
                        carrito.getUsuario().getId(), e.getMessage());
            }
        }
    }

    @Transactional
    public void procesarIgnorados() {
        LocalDateTime limite = LocalDateTime.now().minusHours(72);
        List<CarritoAbandonado> carritos = carritoRepository
                .findByEstadoAndFechaModificacionBefore(EstadoCarrito.RECORDATORIO_2, limite);

        for (CarritoAbandonado carrito : carritos) {
            carrito.setEstado(EstadoCarrito.IGNORADO);
            carritoRepository.save(carrito);
        }
        log.info("Scheduler carrito: {} carritos marcados como ignorados", carritos.size());
    }

    private void enviarRecordatorio1(CarritoAbandonado carrito) {
        String productosHtml = generarHtmlItems(carrito.getItems());
        Double saldo = carrito.getUsuario().getSaldoFavor();
        emailService.enviarCarritoAbandonado1(
                carrito.getUsuario().getEmail(),
                carrito.getUsuario().getNombreCompleto(),
                productosHtml,
                saldo != null ? saldo : 0.0);
    }

    private void enviarRecordatorio2(CarritoAbandonado carrito) {
        String productosHtml = generarHtmlItems(carrito.getItems());
        String tierNombre = "BRONCE";
        Tier tier = carrito.getUsuario().getTierActual();
        if (tier != null) {
            tierNombre = tier.getNombre();
        }
        emailService.enviarCarritoAbandonado2(
                carrito.getUsuario().getEmail(),
                carrito.getUsuario().getNombreCompleto(),
                productosHtml,
                tierNombre,
                2000.0);
    }

    private String generarHtmlItems(List<CarritoItem> items) {
        StringBuilder sb = new StringBuilder();
        for (CarritoItem item : items) {
            sb.append("""
                <div style="display:flex;align-items:center;margin-bottom:12px;padding:8px;background:#1a1a28;border-radius:8px;">
                    <img src="%s" alt="%s" style="width:50px;height:50px;object-fit:cover;border-radius:6px;margin-right:12px;">
                    <div>
                        <p style="color:#f1f5f9;font-size:14px;margin:0;font-weight:600;">%s</p>
                        <p style="color:#94a3b8;font-size:12px;margin:0;">Cantidad: %d × $%.0f</p>
                    </div>
                </div>
                """.formatted(
                        item.getProducto().getImagenUrl() != null ? item.getProducto().getImagenUrl() : "",
                        item.getProducto().getNombre(),
                        item.getProducto().getNombre(),
                        item.getCantidad(),
                        item.getPrecioSnapshot()
                ));
        }
        return sb.toString();
    }
}
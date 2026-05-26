package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.request.CuponRequest;
import com.tribu.api_tribu.dto.response.CuponStatsDTO;
import com.tribu.api_tribu.dto.response.CuponValidacionDTO;
import com.tribu.api_tribu.model.*;
import com.tribu.api_tribu.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class CuponService {

    private final CuponRepository cuponRepo;
    private final CuponUsoRepository cuponUsoRepo;
    private final TierRepository tierRepo;
    private final TribuPassService tribuPassService;
    private final CanjeRecompensaRepository canjeRepo;

    public CuponValidacionDTO validar(String codigo, Long usuarioId, Double totalCarrito) {
        Cupon cupon = cuponRepo.findByCodigoIgnoreCase(codigo.toUpperCase())
                .orElse(null);

        if (cupon == null && codigo.toUpperCase().startsWith("RC-")) {
            // Buscamos si existe un canje con este código de forma retroactiva
            CanjeRecompensa canje = canjeRepo.findByCodigoCanje(codigo.toUpperCase())
                    .orElse(null);
            
            if (canje != null) {
                Recompensa recompensa = canje.getRecompensa();
                if (recompensa.getTitulo().toLowerCase().contains("descuento")) {
                    double valorDescuento = 10.0;
                    if (recompensa.getTitulo().contains("25")) {
                        valorDescuento = 25.0;
                    } else if (recompensa.getTitulo().contains("50")) {
                        valorDescuento = 50.0;
                    } else if (recompensa.getTitulo().contains("15")) {
                        valorDescuento = 15.0;
                    } else if (recompensa.getTitulo().contains("10")) {
                        valorDescuento = 10.0;
                    }

                    cupon = Cupon.builder()
                            .codigo(codigo.toUpperCase())
                            .tipo(Cupon.TipoCupon.PORCENTAJE)
                            .valor(valorDescuento)
                            .montoMinimo(0.0)
                            .montoMaximoDescuento(null)
                            .usosPorUsuario(1)
                            .usosMaximos(1)
                            .usosActuales(0)
                            .fechaInicio(LocalDateTime.now())
                            .fechaExpiracion(LocalDateTime.now().plusMonths(3))
                            .activo(true)
                            .creadoPor("SYSTEM_RECOMPENSA_RETROACTIVE")
                            .build();

                    cupon = cuponRepo.save(cupon);
                }
            }
        }

        if (cupon == null) {
            return CuponValidacionDTO.builder()
                    .valido(false)
                    .codigo(codigo)
                    .error("Cupón no encontrado")
                    .build();
        }

        if (!cupon.getActivo()) {
            return CuponValidacionDTO.builder()
                    .valido(false)
                    .codigo(codigo)
                    .error("Cupón inactivo")
                    .build();
        }

        if (LocalDateTime.now().isAfter(cupon.getFechaExpiracion())) {
            return CuponValidacionDTO.builder()
                    .valido(false)
                    .codigo(codigo)
                    .error("Cupón expirado")
                    .build();
        }

        if (LocalDateTime.now().isBefore(cupon.getFechaInicio())) {
            return CuponValidacionDTO.builder()
                    .valido(false)
                    .codigo(codigo)
                    .error("Cupón aún no está vigente")
                    .build();
        }

        if (cupon.getMontoMinimo() != null && totalCarrito < cupon.getMontoMinimo()) {
            return CuponValidacionDTO.builder()
                    .valido(false)
                    .codigo(codigo)
                    .error("Monto mínimo: $" + formatCOP(cupon.getMontoMinimo()))
                    .build();
        }

        if (cupon.getUsosMaximos() != null && cupon.getUsosActuales() >= cupon.getUsosMaximos()) {
            return CuponValidacionDTO.builder()
                    .valido(false)
                    .codigo(codigo)
                    .error("Cupón agotado")
                    .build();
        }

        int usosDelUsuario = cuponUsoRepo.countByCuponAndUsuarioId(cupon, usuarioId);
        if (cupon.getUsosPorUsuario() != null && usosDelUsuario >= cupon.getUsosPorUsuario()) {
            return CuponValidacionDTO.builder()
                    .valido(false)
                    .codigo(codigo)
                    .error("Ya usaste este cupón")
                    .build();
        }

        double descuento = calcularDescuento(cupon, totalCarrito);

        String descripcion = cupon.getTipo() == Cupon.TipoCupon.PORCENTAJE
                ? cupon.getValor() + "% de descuento"
                : "- $" + formatCOP(descuento);

        return CuponValidacionDTO.builder()
                .valido(true)
                .codigo(codigo.toUpperCase())
                .descuento(descuento)
                .descripcion(descripcion)
                .build();
    }

    @Transactional
    public void aplicarCupon(String codigo, Long usuarioId, Long pedidoId, double descuento) {
        Cupon cupon = cuponRepo.findByCodigoIgnoreCase(codigo.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Cupón no encontrado"));

        Usuario usuario = new Usuario();
        usuario.setId(usuarioId);

        Pedido pedido = null;
        if (pedidoId != null) {
            pedido = new Pedido();
            pedido.setId(pedidoId);
        }

        CuponUso cuponUso = new CuponUso();
        cuponUso.setCupon(cupon);
        cuponUso.setUsuario(usuario);
        cuponUso.setPedido(pedido);
        cuponUso.setDescuentoAplicado(descuento);

        cuponUsoRepo.save(cuponUso);

        cupon.setUsosActuales(cupon.getUsosActuales() + 1);
        cuponRepo.save(cupon);

        log.info("Cupón {} aplicado para usuario {}. Descuento: {}", codigo, usuarioId, descuento);
    }

    public double calcularDescuento(Cupon cupon, double totalCarrito) {
        double descuento = 0;

        switch (cupon.getTipo()) {
            case PORCENTAJE:
                descuento = totalCarrito * (cupon.getValor() / 100.0);
                break;
            case MONTO_FIJO:
                descuento = cupon.getValor();
                break;
            case ENVIO_GRATIS:
                return 0;
        }

        if (cupon.getMontoMaximoDescuento() != null && descuento > cupon.getMontoMaximoDescuento()) {
            descuento = cupon.getMontoMaximoDescuento();
        }

        if (descuento > totalCarrito) {
            descuento = totalCarrito;
        }

        return descuento;
    }

    public List<Cupon> listarTodos() {
        return cuponRepo.findAll();
    }

    @Transactional
    public Cupon crear(CuponRequest request, String emailAdmin) {
        if (cuponRepo.existsByCodigoIgnoreCase(request.getCodigo())) {
            throw new IllegalArgumentException("Ya existe un cupón con este código");
        }

        Cupon cupon = Cupon.builder()
                .codigo(request.getCodigo().toUpperCase())
                .tipo(request.getTipo())
                .valor(request.getValor())
                .montoMinimo(request.getMontoMinimo())
                .montoMaximoDescuento(request.getMontoMaximoDescuento())
                .usosPorUsuario(request.getUsosPorUsuario() != null ? request.getUsosPorUsuario() : 1)
                .usosMaximos(request.getUsosMaximos())
                .usosActuales(0)
                .fechaInicio(request.getFechaInicio())
                .fechaExpiracion(request.getFechaExpiracion())
                .activo(true)
                .creadoPor(emailAdmin)
                .build();

        if (request.getTierIds() != null && !request.getTierIds().isEmpty()) {
            Set<Tier> tiers = new HashSet<>(tierRepo.findAllById(request.getTierIds()));
            cupon.setTiersAplicables(tiers);
        }

        return cuponRepo.save(cupon);
    }

    @Transactional
    public Cupon actualizar(Long id, CuponRequest request) {
        Cupon cupon = cuponRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cupón no encontrado"));

        if (request.getTipo() != null) cupon.setTipo(request.getTipo());
        if (request.getValor() != null) cupon.setValor(request.getValor());
        if (request.getMontoMinimo() != null) cupon.setMontoMinimo(request.getMontoMinimo());
        if (request.getMontoMaximoDescuento() != null) cupon.setMontoMaximoDescuento(request.getMontoMaximoDescuento());
        if (request.getUsosPorUsuario() != null) cupon.setUsosPorUsuario(request.getUsosPorUsuario());
        if (request.getUsosMaximos() != null) cupon.setUsosMaximos(request.getUsosMaximos());
        if (request.getFechaInicio() != null) cupon.setFechaInicio(request.getFechaInicio());
        if (request.getFechaExpiracion() != null) cupon.setFechaExpiracion(request.getFechaExpiracion());
        if (request.getActivo() != null) cupon.setActivo(request.getActivo());

        if (request.getTierIds() != null) {
            Set<Tier> tiers = new HashSet<>(tierRepo.findAllById(request.getTierIds()));
            cupon.setTiersAplicables(tiers);
        }

        return cuponRepo.save(cupon);
    }

    @Transactional
    public void eliminar(Long id) {
        Cupon cupon = cuponRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cupón no encontrado"));

        if (cupon.getUsosActuales() > 0) {
            throw new IllegalArgumentException("No se puede eliminar un cupón que ya ha sido usado");
        }

        cuponRepo.delete(cupon);
    }

    public CuponStatsDTO getStats(Long id) {
        Cupon cupon = cuponRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cupón no encontrado"));

        List<CuponUso> usos = cuponUsoRepo.findByCupon(cupon);
        Double descuentoTotal = cuponUsoRepo.sumDescuentoByCupon(cupon);

        return CuponStatsDTO.builder()
                .cuponId(cupon.getId())
                .codigo(cupon.getCodigo())
                .usosTotales(usos.size())
                .descuentoTotalOtorgado(descuentoTotal != null ? descuentoTotal : 0.0)
                .build();
    }

    private String formatCOP(double monto) {
        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("es", "CO"));
        return formatter.format(monto).replace("$", "");
    }
}

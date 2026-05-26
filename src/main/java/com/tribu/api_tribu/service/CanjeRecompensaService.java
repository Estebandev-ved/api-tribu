package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.response.CanjeRecompensaResponse;
import com.tribu.api_tribu.model.CanjeRecompensa;
import com.tribu.api_tribu.model.MovimientoSaldo.TipoMovimiento;
import com.tribu.api_tribu.model.Recompensa;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.model.Cupon;
import com.tribu.api_tribu.repository.CanjeRecompensaRepository;
import com.tribu.api_tribu.repository.RecompensaRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.repository.CuponRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CanjeRecompensaService {

    private final CanjeRecompensaRepository canjeRepository;
    private final RecompensaRepository recompensaRepository;
    private final UsuarioRepository usuarioRepository;
    private final SaldoService saldoService;
    private final CuponRepository cuponRepository;

    public CanjeRecompensaService(
            CanjeRecompensaRepository canjeRepository,
            RecompensaRepository recompensaRepository,
            UsuarioRepository usuarioRepository,
            SaldoService saldoService,
            CuponRepository cuponRepository) {
        this.canjeRepository = canjeRepository;
        this.recompensaRepository = recompensaRepository;
        this.usuarioRepository = usuarioRepository;
        this.saldoService = saldoService;
        this.cuponRepository = cuponRepository;
    }

    @Transactional
    public CanjeRecompensaResponse canjear(Long usuarioId, Long recompensaId) {
        Usuario usuario = usuarioRepository.findByIdForUpdate(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        Recompensa recompensa = recompensaRepository.findById(recompensaId)
                .orElseThrow(() -> new IllegalArgumentException("Recompensa no encontrada"));

        if (!Boolean.TRUE.equals(recompensa.getActivo())) {
            throw new IllegalArgumentException("Esta recompensa no esta disponible");
        }

        if (recompensa.getStock() != null && recompensa.getStock() <= 0) {
            throw new IllegalArgumentException("Esta recompensa esta agotada");
        }

        double costo = recompensa.getCostoPuntos() != null ? recompensa.getCostoPuntos() : 0.0;
        if (costo <= 0) {
            throw new IllegalArgumentException("Costo de puntos invalido");
        }

        double saldoDisponible = saldoService.consultarSaldoReal(usuarioId);
        if (saldoDisponible < costo) {
            throw new IllegalArgumentException("Saldo insuficiente para canjear la recompensa");
        }

        if (recompensa.getStock() != null) {
            recompensa.setStock(recompensa.getStock() - 1);
            recompensaRepository.save(recompensa);
        }

        String codigo = "RC-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();

        CanjeRecompensa canje = new CanjeRecompensa();
        canje.setUsuario(usuario);
        canje.setRecompensa(recompensa);
        canje.setCostoPuntos(costo);
        canje.setEstado("CANJEADO");
        canje.setCodigoCanje(codigo);

        canje = canjeRepository.save(canje);

        // Si la recompensa contiene "descuento", crear automáticamente un Cupón válido de un solo uso
        if (recompensa.getTitulo().toLowerCase().contains("descuento")) {
            double valorDescuento = 10.0; // por defecto 10%
            if (recompensa.getTitulo().contains("25")) {
                valorDescuento = 25.0;
            } else if (recompensa.getTitulo().contains("50")) {
                valorDescuento = 50.0;
            } else if (recompensa.getTitulo().contains("15")) {
                valorDescuento = 15.0;
            } else if (recompensa.getTitulo().contains("10")) {
                valorDescuento = 10.0;
            }

            Cupon cupon = Cupon.builder()
                    .codigo(codigo)
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
                    .creadoPor("SYSTEM_RECOMPENSA")
                    .build();
            
            cuponRepository.save(cupon);
        }

        saldoService.crearYAcreditar(
                usuario,
                -costo,
                TipoMovimiento.RECOMPENSA_CANJE,
                null,
                "Canje de recompensa: " + recompensa.getTitulo()
        );

        return toResponse(canje);
    }

    public List<CanjeRecompensaResponse> historial(Long usuarioId) {
        List<CanjeRecompensa> canjes = canjeRepository.findByUsuarioIdOrderByFechaDesc(usuarioId);
        List<CanjeRecompensaResponse> resultado = new ArrayList<>();
        for (CanjeRecompensa canje : canjes) {
            resultado.add(toResponse(canje));
        }
        return resultado;
    }

    private CanjeRecompensaResponse toResponse(CanjeRecompensa canje) {
        CanjeRecompensaResponse response = new CanjeRecompensaResponse();
        response.setId(canje.getId());
        response.setCodigoCanje(canje.getCodigoCanje());
        response.setEstado(canje.getEstado());
        response.setCostoPuntos(canje.getCostoPuntos());
        response.setFecha(canje.getFecha());
        response.setRecompensaId(canje.getRecompensa().getId());
        response.setRecompensaTitulo(canje.getRecompensa().getTitulo());
        response.setRecompensaImagen(canje.getRecompensa().getImagenUrl());
        return response;
    }
}

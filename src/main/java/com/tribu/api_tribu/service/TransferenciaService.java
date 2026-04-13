package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.response.LimiteDiarioResponse;
import com.tribu.api_tribu.dto.response.TransferenciaResponse;
import com.tribu.api_tribu.dto.response.ValidarDestinatarioResponse;
import com.tribu.api_tribu.exception.TransferenciaException;
import com.tribu.api_tribu.model.MovimientoSaldo;
import com.tribu.api_tribu.model.MovimientoSaldo.TipoMovimiento;
import com.tribu.api_tribu.model.TransferenciaP2P;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.TransferenciaRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.websocket.SaldoWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransferenciaService {

    private final TransferenciaRepository transferenciaRepo;
    private final UsuarioRepository usuarioRepo;
    private final SaldoService saldoService;
    private final SaldoWebSocketService wsService;

    private static final double LIMITE_DIARIO = 500_000.0;
    private static final double MONTO_MINIMO = 1_000.0;
    private static final double MONTO_MAXIMO = 500_000.0;

    @Transactional
    public TransferenciaP2P transferir(String emailEmisor, String emailOCodigo, double monto, String mensaje) {
        Usuario emisorInicial = usuarioRepo.findByEmail(emailEmisor)
                .orElseThrow(() -> new TransferenciaException("Emisor no encontrado"));
        Usuario emisor = usuarioRepo.findByIdForUpdate(emisorInicial.getId())
                .orElseThrow(() -> new TransferenciaException("Emisor no encontrado"));

        String mensajeSaneado = mensaje != null ? org.springframework.web.util.HtmlUtils.htmlEscape(mensaje) : null;

        Usuario receptor = buscarReceptor(emailOCodigo);

        if (emisor.getId().equals(receptor.getId())) {
            throw new TransferenciaException.AutoTransferenciaException();
        }

        if (monto < MONTO_MINIMO) {
            throw new TransferenciaException.MontoMinimoException();
        }

        if (monto > MONTO_MAXIMO) {
            throw new TransferenciaException("El monto máximo es $500.000");
        }

        double saldoActual = saldoService.consultarSaldoReal(emisor.getId());
        if (saldoActual < monto) {
            throw new TransferenciaException.SaldoInsuficienteException();
        }

        double enviadoHoy = transferenciaRepo.sumMontoEnviadoHoy(
                emisor.getId(),
                LocalDateTime.now().toLocalDate().atStartOfDay(),
                LocalDateTime.now()
        );
        if (enviadoHoy + monto > LIMITE_DIARIO) {
            throw new TransferenciaException.LimiteDiarioExcedidoException();
        }

        String referencia = "TRF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        TransferenciaP2P transferencia = TransferenciaP2P.builder()
                .emisor(emisor)
                .receptor(receptor)
                .monto(monto)
                .mensaje(mensajeSaneado)
                .estado(TransferenciaP2P.EstadoTransferencia.PENDIENTE)
                .referenciaUnica(referencia)
                .build();

        transferencia = transferenciaRepo.save(transferencia);

        String descripcionEmisor = "Transferencia enviada a " + receptor.getNombreCompleto();
        MovimientoSaldo movimientoEmisor = saldoService.crearYAcreditar(
                emisor, -monto, TipoMovimiento.TRANSFERENCIA_ENVIADA, null, descripcionEmisor
        );

        String descripcionReceptor = emisor.getNombreCompleto() + " te envió $" + 
                String.format(Locale.US, "%.0f", monto);
        if (mensajeSaneado != null && !mensajeSaneado.isBlank()) {
            descripcionReceptor += " · " + mensajeSaneado;
        }
        MovimientoSaldo movimientoReceptor = saldoService.crearYAcreditar(
                receptor, monto, TipoMovimiento.TRANSFERENCIA_RECIBIDA, null, descripcionReceptor
        );

        transferencia.setMovimientoEmisor(movimientoEmisor);
        transferencia.setMovimientoReceptor(movimientoReceptor);
        transferencia.setEstado(TransferenciaP2P.EstadoTransferencia.COMPLETADA);
        transferencia.setFechaCompletada(LocalDateTime.now());
        transferencia = transferenciaRepo.save(transferencia);

        double nuevoSaldoEmisor = saldoService.consultarSaldoReal(emisor.getId());
        wsService.notificarSaldoActualizado(
                emisor.getId(), -monto, "TRANSFERENCIA_ENVIADA", descripcionEmisor
        );

        double nuevoSaldoReceptor = saldoService.consultarSaldoReal(receptor.getId());
        wsService.notificarSaldoActualizado(
                receptor.getId(), monto, "TRANSFERENCIA_RECIBIDA", descripcionReceptor
        );

        log.info("💸 Transferencia {} → {} : ${}", emisor.getId(), receptor.getId(), monto);

        return transferencia;
    }

    public boolean tieneSaldoSuficiente(Long usuarioId, double monto) {
        return saldoService.consultarSaldoReal(usuarioId) >= monto;
    }

    public double getLimiteDiarioRestante(Long usuarioId) {
        double enviado = transferenciaRepo.sumMontoEnviadoHoy(
                usuarioId,
                LocalDateTime.now().toLocalDate().atStartOfDay(),
                LocalDateTime.now()
        );
        return Math.max(0, LIMITE_DIARIO - enviado);
    }

    public LimiteDiarioResponse getLimiteDiario(Long usuarioId) {
        double enviado = transferenciaRepo.sumMontoEnviadoHoy(
                usuarioId,
                LocalDateTime.now().toLocalDate().atStartOfDay(),
                LocalDateTime.now()
        );
        return LimiteDiarioResponse.builder()
                .limiteTotal(LIMITE_DIARIO)
                .utilizado(enviado)
                .disponible(Math.max(0, LIMITE_DIARIO - enviado))
                .build();
    }

    public List<TransferenciaResponse> getHistorial(Long usuarioId) {
        Usuario usuario = usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new TransferenciaException("Usuario no encontrado"));

        List<TransferenciaP2P> transferencias = transferenciaRepo.findHistorialCompleto(usuario);

        return transferencias.stream()
                .map(t -> mapToResponse(t, usuarioId))
                .collect(Collectors.toList());
    }

    public ValidarDestinatarioResponse validarDestinatario(String emailOCodigo, Long usuarioIdActual) {
        Usuario receptor = usuarioRepo.findByEmail(emailOCodigo).orElse(null);
        
        if (receptor == null) {
            receptor = usuarioRepo.findByCodigoReferido(emailOCodigo).orElse(null);
        }

        if (receptor == null) {
            return ValidarDestinatarioResponse.builder()
                    .encontrado(false)
                    .build();
        }

        if (receptor.getId().equals(usuarioIdActual)) {
            return ValidarDestinatarioResponse.builder()
                    .encontrado(true)
                    .nombre(receptor.getNombreCompleto())
                    .avatar(null)
                    .build();
        }

        return ValidarDestinatarioResponse.builder()
                .encontrado(true)
                .nombre(receptor.getNombreCompleto())
                .avatar(null)
                .build();
    }

    private Usuario buscarReceptor(String emailOCodigo) {
        return usuarioRepo.findByEmail(emailOCodigo)
                .or(() -> usuarioRepo.findByCodigoReferido(emailOCodigo))
                .orElseThrow(TransferenciaException.DestinatarioNoEncontradoException::new);
    }

    private TransferenciaResponse mapToResponse(TransferenciaP2P t, Long usuarioId) {
        boolean esEmisor = t.getEmisor().getId().equals(usuarioId);
        
        return TransferenciaResponse.builder()
                .referencia(t.getReferenciaUnica())
                .tipoParticipante(esEmisor ? "EMISOR" : "RECEPTOR")
                .monto(t.getMonto())
                .contraparte(esEmisor ? t.getReceptor().getNombreCompleto() : t.getEmisor().getNombreCompleto())
                .mensaje(t.getMensaje())
                .estado(t.getEstado().name())
                .fecha(t.getFechaCompletada() != null ? t.getFechaCompletada() : t.getFechaCreacion())
                .nuevoSaldo(null)
                .build();
    }
}

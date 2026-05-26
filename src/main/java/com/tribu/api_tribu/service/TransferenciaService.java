package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.response.LimiteDiarioResponse;
import com.tribu.api_tribu.dto.response.TransferenciaResponse;
import com.tribu.api_tribu.dto.response.ValidarDestinatarioResponse;
import com.tribu.api_tribu.exception.TransferenciaException;
import com.tribu.api_tribu.model.MovimientoSaldo.TipoMovimiento;
import com.tribu.api_tribu.model.TransferenciaP2P;
import com.tribu.api_tribu.model.TransferenciaP2P.EstadoTransferencia;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.TransferenciaRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.websocket.AdminMonitoringWebSocketService;
import com.tribu.api_tribu.websocket.SaldoWebSocketService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class TransferenciaService {

    private final TransferenciaRepository transferenciaRepo;
    private final UsuarioRepository usuarioRepo;
    private final SaldoService saldoService;
    private final SaldoWebSocketService wsService;
    private final AdminMonitoringWebSocketService adminWsService;
    private final PasswordEncoder passwordEncoder;

    // Límites por nivel VIP: [montoMin, montoMax, transaccionesDiarias]
    private static final double[][] LIMITES_POR_NIVEL = {
        { 1_000,   10_000,   3  },  // Nivel 1: Bronce
        { 1_000,   50_000,   10 },  // Nivel 2: Plata
        { 1_000,   100_000,  999 }  // Nivel 3: Oro (ilimitado práctico)
    };

    public TransferenciaService(
            TransferenciaRepository transferenciaRepo,
            UsuarioRepository usuarioRepo,
            SaldoService saldoService,
            SaldoWebSocketService wsService,
            AdminMonitoringWebSocketService adminWsService,
            PasswordEncoder passwordEncoder) {
        this.transferenciaRepo = transferenciaRepo;
        this.usuarioRepo = usuarioRepo;
        this.saldoService = saldoService;
        this.wsService = wsService;
        this.adminWsService = adminWsService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public TransferenciaP2P transferir(String emailEmisor, String emailOCodigo, double monto, String mensaje) {
        Usuario emisorInicial = usuarioRepo.findByEmail(emailEmisor)
                .orElseThrow(() -> new TransferenciaException("Emisor no encontrado"));
        Usuario emisor = usuarioRepo.findByIdForUpdate(emisorInicial.getId())
                .orElseThrow(() -> new TransferenciaException("Emisor no encontrado"));

        // 1. Validar PIN
        if (emisor.getPinSeguridadHash() == null || emisor.getPinSeguridadHash().isBlank()) {
            throw new TransferenciaException("Debes configurar un PIN de seguridad antes de transferir");
        }

        String mensajeSaneado = mensaje != null ? HtmlUtils.htmlEscape(mensaje) : null;

        Usuario receptor = buscarReceptor(emailOCodigo);

        if (emisor.getId().equals(receptor.getId())) {
            throw new TransferenciaException.AutoTransferenciaException();
        }

        // 2. Validar montos por nivel VIP
        int nivel = getNivelSeguro(emisor.getNivelVip());
        double montoMin = LIMITES_POR_NIVEL[nivel - 1][0];
        double montoMax = LIMITES_POR_NIVEL[nivel - 1][1];
        int maxDiarias = (int) LIMITES_POR_NIVEL[nivel - 1][2];

        if (monto < montoMin) {
            throw new TransferenciaException("El monto mínimo es $" + String.format("%,.0f", montoMin));
        }

        if (monto > montoMax) {
            throw new TransferenciaException("El monto máximo para tu nivel es $" + String.format("%,.0f", montoMax));
        }

        double saldoActual = saldoService.consultarSaldoReal(emisor.getId());
        if (saldoActual < monto) {
            throw new TransferenciaException.SaldoInsuficienteException();
        }

        // 3. Validar límite diario de transacciones
        long enviadasHoy = countTransaccionesHoy(emisor.getId());
        if (enviadasHoy >= maxDiarias) {
            throw new TransferenciaException("Límite diario de " + maxDiarias + " transferencias alcanzado");
        }

        // 4. Validar límite diario de monto
        double enviadoHoy = getMontoEnviadoHoy(emisor.getId());
        if (enviadoHoy + monto > LIMITES_POR_NIVEL[nivel - 1][1] * maxDiarias) {
            throw new TransferenciaException("Límite diario de monto alcanzado para tu nivel");
        }

        String referencia = "TRF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        TransferenciaP2P transferencia = new TransferenciaP2P();
        transferencia.setEmisor(emisor);
        transferencia.setReceptor(receptor);
        transferencia.setMonto(monto);
        transferencia.setMensaje(mensajeSaneado);
        transferencia.setEstado(EstadoTransferencia.PENDIENTE);
        transferencia.setReferenciaUnica(referencia);

        transferencia = transferenciaRepo.save(transferencia);

        String descripcionEmisor = "Transferencia enviada a " + receptor.getNombreCompleto();
        saldoService.crearYAcreditar(
                emisor, -monto, TipoMovimiento.TRANSFERENCIA_ENVIADA, null, descripcionEmisor
        );

        String descripcionReceptor = emisor.getNombreCompleto() + " te envió $" +
                String.format(Locale.US, "%.0f", monto);
        if (mensajeSaneado != null && !mensajeSaneado.isBlank()) {
            descripcionReceptor += " · " + mensajeSaneado;
        }
        saldoService.crearYAcreditar(
                receptor, monto, TipoMovimiento.TRANSFERENCIA_RECIBIDA, null, descripcionReceptor
        );

        transferencia.setEstado(EstadoTransferencia.COMPLETADA);
        transferencia.setFechaCompletada(LocalDateTime.now());
        transferencia = transferenciaRepo.save(transferencia);

        adminWsService.emitirTransferencia(transferencia);

        wsService.notificarSaldoActualizado(
                emisor.getId(), -monto, "TRANSFERENCIA_ENVIADA", descripcionEmisor
        );
        wsService.notificarSaldoActualizado(
                receptor.getId(), monto, "TRANSFERENCIA_RECIBIDA", descripcionReceptor
        );

        return transferencia;
    }

    @Transactional
    public TransferenciaP2P transferir(String emailEmisor, String emailOCodigo, double monto, String mensaje, String pin) {
        Usuario emisor = usuarioRepo.findByEmail(emailEmisor)
                .orElseThrow(() -> new TransferenciaException("Emisor no encontrado"));

        if (emisor.getPinSeguridadHash() == null || emisor.getPinSeguridadHash().isBlank()) {
            throw new TransferenciaException("Debes configurar un PIN de seguridad antes de transferir");
        }

        if (pin == null || !passwordEncoder.matches(pin, emisor.getPinSeguridadHash())) {
            throw new TransferenciaException.PinIncorrectoException();
        }

        return transferir(emailEmisor, emailOCodigo, monto, mensaje);
    }

    public void validarPin(Long usuarioId, String pin) {
        Usuario usuario = usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new TransferenciaException("Usuario no encontrado"));

        if (usuario.getPinSeguridadHash() == null || usuario.getPinSeguridadHash().isBlank()) {
            throw new TransferenciaException("PIN no configurado");
        }

        if (pin == null || !passwordEncoder.matches(pin, usuario.getPinSeguridadHash())) {
            throw new TransferenciaException.PinIncorrectoException();
        }
    }

    public boolean tieneSaldoSuficiente(Long usuarioId, double monto) {
        return saldoService.consultarSaldoReal(usuarioId) >= monto;
    }

    public LimiteDiarioResponse getLimiteDiario(Long usuarioId) {
        Usuario usuario = usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new TransferenciaException("Usuario no encontrado"));
        int nivel = getNivelSeguro(usuario.getNivelVip());
        double montoMax = LIMITES_POR_NIVEL[nivel - 1][1];
        int maxDiarias = (int) LIMITES_POR_NIVEL[nivel - 1][2];
        double montoMin = LIMITES_POR_NIVEL[nivel - 1][0];

        double enviado = getMontoEnviadoHoy(usuarioId);
        long transaccionesHoy = countTransaccionesHoy(usuarioId);

        LimiteDiarioResponse response = new LimiteDiarioResponse();
        response.setLimiteTotal(montoMax * maxDiarias);
        response.setUtilizado(enviado);
        response.setDisponible(Math.max(0, (montoMax * maxDiarias) - enviado));
        response.setMinimoPorTransferencia(montoMin);
        response.setMaximoPorTransferencia(montoMax);
        response.setLimiteTransaccionesDiarias(maxDiarias);
        response.setTransaccionesHoy((int) transaccionesHoy);
        return response;
    }

    public List<TransferenciaResponse> getHistorial(Long usuarioId) {
        Usuario usuario = usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new TransferenciaException("Usuario no encontrado"));

        List<TransferenciaP2P> transferencias = transferenciaRepo.findHistorialCompleto(usuario);
        List<TransferenciaResponse> resultado = new ArrayList<>();

        for (TransferenciaP2P t : transferencias) {
            resultado.add(mapToResponse(t, usuarioId));
        }
        return resultado;
    }

    public ValidarDestinatarioResponse validarDestinatario(String emailOCodigo, Long usuarioIdActual) {
        Usuario receptor = usuarioRepo.findByEmail(emailOCodigo).orElse(null);

        if (receptor == null) {
            receptor = usuarioRepo.findByCodigoReferido(emailOCodigo).orElse(null);
        }

        ValidarDestinatarioResponse response = new ValidarDestinatarioResponse();

        if (receptor == null) {
            response.setEncontrado(false);
            return response;
        }

        response.setEncontrado(true);
        response.setNombre(receptor.getNombreCompleto());
        response.setEmail(enmascararEmail(receptor.getEmail()));
        response.setCodigoReferido(receptor.getCodigoReferido());
        response.setNivelVip(receptor.getNivelVip() != null ? receptor.getNivelVip() : 1);
        response.setCiudad(receptor.getCiudad());

        if (receptor.getId().equals(usuarioIdActual)) {
            response.setNombre(receptor.getNombreCompleto() + " (tú)");
        }

        return response;
    }

    private String enmascararEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        String[] partes = email.split("@");
        String nombre = partes[0];
        if (nombre.length() <= 2) return nombre + "@" + partes[1];
        return nombre.charAt(0) + "***" + nombre.charAt(nombre.length() - 1) + "@" + partes[1];
    }

    private Usuario buscarReceptor(String emailOCodigo) {
        return usuarioRepo.findByEmail(emailOCodigo)
                .or(() -> usuarioRepo.findByCodigoReferido(emailOCodigo))
                .orElseThrow(TransferenciaException.DestinatarioNoEncontradoException::new);
    }

    private int getNivelSeguro(Integer nivelVip) {
        if (nivelVip == null || nivelVip < 1) return 1;
        if (nivelVip > 3) return 3;
        return nivelVip;
    }

    private double getMontoEnviadoHoy(Long usuarioId) {
        Double total = transferenciaRepo.sumMontoEnviadoHoy(
                usuarioId,
                LocalDateTime.now().toLocalDate().atStartOfDay(),
                LocalDateTime.now()
        );
        return total != null ? total : 0.0;
    }

    private long countTransaccionesHoy(Long usuarioId) {
        Long count = transferenciaRepo.countTransaccionesHoy(
                usuarioId,
                LocalDateTime.now().toLocalDate().atStartOfDay(),
                LocalDateTime.now()
        );
        return count != null ? count : 0L;
    }

    private TransferenciaResponse mapToResponse(TransferenciaP2P t, Long usuarioId) {
        boolean esEmisor = t.getEmisor().getId().equals(usuarioId);

        TransferenciaResponse response = new TransferenciaResponse();
        response.setReferencia(t.getReferenciaUnica());
        response.setTipoParticipante(esEmisor ? "EMISOR" : "RECEPTOR");
        response.setMonto(t.getMonto());
        response.setContraparte(esEmisor ? t.getReceptor().getNombreCompleto() : t.getEmisor().getNombreCompleto());
        response.setMensaje(t.getMensaje());
        response.setEstado(t.getEstado().name());
        response.setFecha(t.getFechaCompletada() != null ? t.getFechaCompletada() : t.getFechaCreacion());
        response.setNuevoSaldo(null);
        return response;
    }
}

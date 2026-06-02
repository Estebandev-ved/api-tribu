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
import org.redisson.api.RBucket;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * 💸 TransferenciaService - Motor de Concurrencia y Sincronización Financiera.
 *
 * PROPÓSITO:
 *   Gestionar las transferencias P2P entre usuarios asegurando integridad total, protecciones contra doble gasto
 *   y condiciones de carrera en alta concurrencia mediante bloqueos distribuidos de exclusión mutua gestionados en Redis (Redisson).
 *
 * MEDIDAS DE SEGURIDAD IMPLEMENTADAS:
 *   1. Bloqueo Distribuido Mutuo y Determinista (Redisson): Evita el bloqueo del nivel de base de datos que provoca
 *      gridlocks y demoras infinitas. Bloquea emisor y receptor de forma ordenada por ID para evitar situaciones de Deadlock.
 *   2. Desacoplamiento de Transacciones: El bloqueo se adquiere y libera *fuera* de la transacción de base de datos
 *      (JPA/Hibernate), previniendo que lecturas fantasma o estados intermedios no confirmados (dirty reads) causen doble gasto.
 *   3. Saneamiento de Datos (HTML escaping): Saneado riguroso del mensaje de la transferencia para evitar ataques XSS almacenado.
 *   4. Validación de Límites por Nivel VIP: Controles estrictos de montos mínimos, máximos y transacciones diarias acumuladas.
 */
@Service
public class TransferenciaService {

    private final TransferenciaRepository transferenciaRepo;
    private final UsuarioRepository usuarioRepo;
    private final SaldoService saldoService;
    private final SaldoWebSocketService wsService;
    private final AdminMonitoringWebSocketService adminWsService;
    private final PasswordEncoder passwordEncoder;
    private final RedissonClient redissonClient;

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
            PasswordEncoder passwordEncoder,
            RedissonClient redissonClient) {
        this.transferenciaRepo = transferenciaRepo;
        this.usuarioRepo = usuarioRepo;
        this.saldoService = saldoService;
        this.wsService = wsService;
        this.adminWsService = adminWsService;
        this.passwordEncoder = passwordEncoder;
        this.redissonClient = redissonClient;
    }

    /**
     * Orquestador de transferencia de alta concurrencia.
     * Adquiere los bloqueos distribuidos de forma segura en Redis y delega la escritura transaccional a la base de datos.
     */
    public TransferenciaP2P transferir(String emailEmisor, String emailOCodigo, double monto, String mensaje) {
        Usuario emisorInicial = usuarioRepo.findByEmail(emailEmisor)
                .orElseThrow(() -> new TransferenciaException("Emisor no encontrado"));
        
        Usuario receptorInicial = buscarReceptor(emailOCodigo);

        Long idEmisor = emisorInicial.getId();
        Long idReceptor = receptorInicial.getId();

        if (idEmisor.equals(idReceptor)) {
            throw new TransferenciaException.AutoTransferenciaException();
        }

        // Definir orden determinista para prevenir interbloqueos (Deadlocks)
        Long firstId = Math.min(idEmisor, idReceptor);
        Long secondId = Math.max(idEmisor, idReceptor);

        RLock lock1 = redissonClient.getLock("tribu:user:lock:" + firstId);
        RLock lock2 = redissonClient.getLock("tribu:user:lock:" + secondId);

        try {
            // Intentar adquirir bloqueos distribuidos en Redis (espera máxima 5s, liberación automática en 10s ante fallas de red)
            boolean acquired1 = lock1.tryLock(5, 10, TimeUnit.SECONDS);
            if (!acquired1) {
                throw new TransferenciaException("Tu cuenta se encuentra procesando otra transacción. Por favor, espera.");
            }

            boolean acquired2 = lock2.tryLock(5, 10, TimeUnit.SECONDS);
            if (!acquired2) {
                throw new TransferenciaException("El destinatario está ocupado recibiendo fondos. Por favor, intenta de nuevo.");
            }

            // Invocar el método transaccional que asegura consistencia ACID en la base de datos
            return ejecutarTransferenciaTransaccional(idEmisor, idReceptor, monto, mensaje);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new TransferenciaException("La transacción fue cancelada debido a alta latencia o concurrencia del sistema.");
        } finally {
            // Liberar locks de forma ordenada
            if (lock2.isHeldByCurrentThread()) {
                lock2.unlock();
            }
            if (lock1.isHeldByCurrentThread()) {
                lock1.unlock();
            }
        }
    }

    /**
     * Ejecuta la lógica transaccional de débito/crédito y validación de reglas de negocio financieras.
     */
    @Transactional
    public TransferenciaP2P ejecutarTransferenciaTransaccional(Long idEmisor, Long idReceptor, double monto, String mensaje) {
        // Carga fresca con el bloqueo distribuido activo
        Usuario emisor = usuarioRepo.findById(idEmisor)
                .orElseThrow(() -> new TransferenciaException("Emisor no encontrado"));
        Usuario receptor = usuarioRepo.findById(idReceptor)
                .orElseThrow(() -> new TransferenciaException("Receptor no encontrado"));

        // 1. Validar PIN
        if (emisor.getPinSeguridadHash() == null || emisor.getPinSeguridadHash().isBlank()) {
            throw new TransferenciaException("Debes configurar un PIN de seguridad antes de transferir");
        }

        String mensajeSaneado = mensaje != null ? HtmlUtils.htmlEscape(mensaje) : null;

        // 2. Validar montos por nivel VIP
        int nivel = getNivelSeguro(emisor.getNivelVip());
        double montoMin = LIMITES_POR_NIVEL[nivel - 1][0];
        double montoMax = LIMITES_POR_NIVEL[nivel - 1][1];
        int maxDiarias = (int) LIMITES_POR_NIVEL[nivel - 1][2];

        if (monto < montoMin) {
            throw new TransferenciaException("El monto mínimo es " + String.format("%,.0f", montoMin) + " Puntos Tribu");
        }

        if (monto > montoMax) {
            throw new TransferenciaException("El monto máximo para tu nivel es " + String.format("%,.0f", montoMax) + " Puntos Tribu");
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

        String descripcionReceptor = emisor.getNombreCompleto() + " te envió " +
                String.format(Locale.US, "%.0f", monto) + " Puntos Tribu";
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

        // Ciberseguridad: Evitar fuerza bruta (Brute-force PIN protection) usando Redis Lockout
        RBucket<Integer> maxAttemptsBucket = redissonClient.getBucket("tribu:security:pinAttemptsLimit");
        int maxAttempts = maxAttemptsBucket.isExists() ? maxAttemptsBucket.get() : 3;

        RBucket<Integer> lockoutTimeBucket = redissonClient.getBucket("tribu:security:pinLockoutTime");
        int lockoutTime = lockoutTimeBucket.isExists() ? lockoutTimeBucket.get() : 15;

        RBucket<Boolean> pinLock = redissonClient.getBucket("tribu:pin:lock:" + emisor.getId());
        if (pinLock.isExists()) {
            throw new TransferenciaException("Has superado el límite de intentos de PIN. Transferencias congeladas por " + lockoutTime + " minutos.");
        }

        if (pin == null || !passwordEncoder.matches(pin, emisor.getPinSeguridadHash())) {
            RBucket<Integer> pinAttempts = redissonClient.getBucket("tribu:pin:attempts:" + emisor.getId());
            Integer attempts = pinAttempts.get();
            if (attempts == null) {
                attempts = 0;
            }
            attempts++;
            pinAttempts.set(attempts, java.time.Duration.ofMinutes(lockoutTime));

            if (attempts >= maxAttempts) {
                pinLock.set(true, java.time.Duration.ofMinutes(lockoutTime));
                pinAttempts.delete();
                throw new TransferenciaException("Límite de intentos de PIN superado. Tu cuenta ha sido congelada para transferencias por " + lockoutTime + " minutos.");
            }

            int restantes = maxAttempts - attempts;
            throw new TransferenciaException("PIN de seguridad incorrecto. Te quedan " + restantes + " intentos antes del bloqueo temporal.");
        }

        // Limpiar contador de intentos fallidos al ingresar el PIN correcto
        redissonClient.getBucket("tribu:pin:attempts:" + emisor.getId()).delete();

        return transferir(emailEmisor, emailOCodigo, monto, mensaje);
    }

    public void validarPin(Long usuarioId, String pin) {
        Usuario usuario = usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new TransferenciaException("Usuario no encontrado"));

        if (usuario.getPinSeguridadHash() == null || usuario.getPinSeguridadHash().isBlank()) {
            throw new TransferenciaException("PIN no configurado");
        }

        // Ciberseguridad: Evitar fuerza bruta (Brute-force PIN protection) usando Redis Lockout
        RBucket<Integer> maxAttemptsBucket = redissonClient.getBucket("tribu:security:pinAttemptsLimit");
        int maxAttempts = maxAttemptsBucket.isExists() ? maxAttemptsBucket.get() : 3;

        RBucket<Integer> lockoutTimeBucket = redissonClient.getBucket("tribu:security:pinLockoutTime");
        int lockoutTime = lockoutTimeBucket.isExists() ? lockoutTimeBucket.get() : 15;

        RBucket<Boolean> pinLock = redissonClient.getBucket("tribu:pin:lock:" + usuarioId);
        if (pinLock.isExists()) {
            throw new TransferenciaException("Límite de intentos de PIN superado. Transferencias congeladas por " + lockoutTime + " minutos.");
        }

        if (pin == null || !passwordEncoder.matches(pin, usuario.getPinSeguridadHash())) {
            RBucket<Integer> pinAttempts = redissonClient.getBucket("tribu:pin:attempts:" + usuarioId);
            Integer attempts = pinAttempts.get();
            if (attempts == null) {
                attempts = 0;
            }
            attempts++;
            pinAttempts.set(attempts, java.time.Duration.ofMinutes(lockoutTime));

            if (attempts >= maxAttempts) {
                pinLock.set(true, java.time.Duration.ofMinutes(lockoutTime));
                pinAttempts.delete();
                throw new TransferenciaException("Límite de intentos de PIN superado. Tu cuenta ha sido congelada para transferencias por " + lockoutTime + " minutos.");
            }

            int restantes = maxAttempts - attempts;
            throw new TransferenciaException("PIN incorrecto. Intentos restantes: " + restantes);
        }

        // Limpiar contador al ingresar PIN correcto
        redissonClient.getBucket("tribu:pin:attempts:" + usuarioId).delete();
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

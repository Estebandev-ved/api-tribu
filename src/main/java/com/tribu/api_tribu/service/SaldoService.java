package com.tribu.api_tribu.service;

import com.tribu.api_tribu.model.MovimientoSaldo;
import com.tribu.api_tribu.model.MovimientoSaldo.EstadoMovimiento;
import com.tribu.api_tribu.model.MovimientoSaldo.TipoMovimiento;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.MovimientoSaldoRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.websocket.AdminMonitoringWebSocketService;
import com.tribu.api_tribu.websocket.SaldoWebSocketService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Servicio central de operaciones financieras.
 *
 * REGLA DE ORO: Ningún otro servicio debe escribir en usuario.saldoFavor
 * directamente. Toda operación pasa por aquí.
 *
 * El saldo visible (usuario.saldoFavor) es una caché de conveniencia
 * que se sincroniza cada vez que un movimiento pasa a CLEARED.
 * La fuente de verdad es siempre MovimientoSaldoRepository.calcularSaldoReal().
 */
@Service
public class SaldoService {

    private final MovimientoSaldoRepository movimientoRepo;
    private final UsuarioRepository usuarioRepo;
    private final SaldoWebSocketService wsService;
    private final AdminMonitoringWebSocketService adminWsService;

    public SaldoService(
            MovimientoSaldoRepository movimientoRepo,
            UsuarioRepository usuarioRepo,
            SaldoWebSocketService wsService,
            AdminMonitoringWebSocketService adminWsService) {
        this.movimientoRepo = movimientoRepo;
        this.usuarioRepo = usuarioRepo;
        this.wsService = wsService;
        this.adminWsService = adminWsService;
    }

    // ── Días de espera por tipo de cashback ───────────────────────────────
    private static final int DIAS_HOLD_CASHBACK_COMPRA = 7;

    // ── Montos de referidos ───────────────────────────────────────────────
    public static final double BONO_REFERENTE   = 10_000.0;
    public static final double BONO_NUEVO_USUARIO = 5_000.0;

    // ─────────────────────────────────────────────────────────────────────
    // OPERACIONES INMEDIATAS (pasan directo a CLEARED)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Premio de la ruleta — se acredita inmediatamente.
     */
    @Transactional
    public MovimientoSaldo registrarPremioRuleta(Usuario usuario, double monto) {
        return crearYAcreditar(usuario, monto, TipoMovimiento.ROULETTE_REWARD, null,
                "Premio ganado en la Ruleta Tribu Diaria.");
    }

    /**
     * Bono de referido para el referente (quien invitó). ON_HOLD por 7 días.
     */
    @Transactional
    public MovimientoSaldo registrarBonoReferente(Usuario referente, String nombreInvitado) {
        return crearBonoOnHold(referente, BONO_REFERENTE, TipoMovimiento.REFERRAL_BONUS, null,
                "Bono PENDIENTE por invitar a " + nombreInvitado + " — disponible en 7 días");
    }

    /**
     * Bono de bienvenida para el nuevo usuario. ON_HOLD por 7 días.
     */
    @Transactional
    public MovimientoSaldo registrarBonoNuevoUsuario(Usuario usuario, String codigoUsado) {
        return crearBonoOnHold(usuario, BONO_NUEVO_USUARIO, TipoMovimiento.WELCOME_BONUS, null,
                "Bono PENDIENTE por usar el código de referido: " + codigoUsado + " — disponible en 7 días");
    }

    /**
     * Reembolso por devolución aprobada — inmediato.
     */
    @Transactional
    public MovimientoSaldo registrarReembolso(Usuario usuario, double monto, String numeroPedido) {
        return crearYAcreditar(usuario, monto, TipoMovimiento.REEMBOLSO, null,
                "Reembolso por devolución aprobada de la orden: " + numeroPedido);
    }

    /**
     * Pago de pedido usando el saldo de la tarjeta.
     * Crea un movimiento negativo en CLEARED.
     */
    @Transactional
    public MovimientoSaldo registrarCompraConSaldo(Usuario usuario, double monto, Long pedidoId) {
        Usuario lockedUser = usuarioRepo.findByIdForUpdate(usuario.getId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
                
        double saldoDisponible = consultarSaldoReal(lockedUser.getId());
        if (saldoDisponible < monto) {
            throw new IllegalArgumentException("Saldo insuficiente en tu Tribu Card");
        }

        // Monto negativo para el gasto
        return crearYAcreditar(lockedUser, -monto, TipoMovimiento.PURCHASE, pedidoId,
                "Pago de Pedido #" + pedidoId + " usando Tribu Card.");
    }

    // ─────────────────────────────────────────────────────────────────────
    // OPERACIONES DIFERIDAS (ON_HOLD → CLEARED después de N días)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Cashback por compra — queda en ON_HOLD durante 7 días.
     * El CashbackScheduler lo libera cuando se cumple unlockDate.
     *
     * @param pedidoId  Para trazabilidad
     * @param porcentaje  Decimal (ej. 0.05 = 5%)
     */
    @Transactional
    public MovimientoSaldo registrarCashbackDiferido(
            Usuario usuario, double montoCompra, double porcentaje, Long pedidoId) {

        // 1. Evitar duplicados (Idempotencia)
        if (pedidoId != null && movimientoRepo.existsByPedidoIdAndTipo(pedidoId, TipoMovimiento.CASHBACK)) {
            return null;
        }

        double montoCashback = montoCompra * porcentaje;
        if (montoCashback <= 0) return null;

        LocalDateTime unlockDate = LocalDateTime.now().plusDays(DIAS_HOLD_CASHBACK_COMPRA);

        MovimientoSaldo mov = new MovimientoSaldo();
        mov.setUsuario(usuario);
        mov.setMonto(montoCashback);
        mov.setTipo(TipoMovimiento.CASHBACK);
        mov.setEstado(EstadoMovimiento.ON_HOLD);
        mov.setUnlockDate(unlockDate);
        mov.setPedidoId(pedidoId);
        mov.setDescripcion(String.format(
                "Cashback (%.0f%%) por Pedido #%d — disponible el %s",
                porcentaje * 100, pedidoId,
                unlockDate.toLocalDate().toString()));

        MovimientoSaldo guardado = movimientoRepo.save(mov);

        // Admin monitoring: ledger global
        adminWsService.emitirMovimiento(guardado);

        // 2. Notificar al frontend vía WS (para efecto visual de "Dopamina")
        // Se envía tipo "CASHBACK_PENDING" para que el frontend sepa que no suma al saldo real pero sí aparece en la lista
        wsService.notificarSaldoActualizado(
                usuario.getId(),
                montoCashback,
                "CASHBACK_PENDING",
                "Cashback pendiente por Pedido #" + pedidoId);

        return guardado;
    }

    // ─────────────────────────────────────────────────────────────────────
    // LIBERACIÓN (llamado por el Scheduler)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Transiciona un movimiento de ON_HOLD a CLEARED y sincroniza saldoFavor.
     * Llamado exclusivamente por CashbackScheduler.
     *
     * @return el movimiento actualizado
     */
    @Transactional
    public MovimientoSaldo liberarMovimiento(MovimientoSaldo mov) {
        if (mov.getEstado() != EstadoMovimiento.ON_HOLD) {
            throw new IllegalStateException(
                    "No se puede liberar un movimiento en estado: " + mov.getEstado());
        }

        mov.setEstado(EstadoMovimiento.CLEARED);
        MovimientoSaldo liberado = movimientoRepo.save(mov);

        // Admin monitoring: update estado
        adminWsService.emitirMovimiento(liberado);

        // Sincronizar caché de saldoFavor
        sincronizarSaldoCache(mov.getUsuario().getId());

        return liberado;
    }

    // ─────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Crea un movimiento directamente en CLEARED y sincroniza el saldo.
     */
    @Transactional
    public MovimientoSaldo crearYAcreditar(
            Usuario usuario, double monto, TipoMovimiento tipo,
            Long pedidoId, String descripcion) {

        MovimientoSaldo mov = new MovimientoSaldo();
        mov.setUsuario(usuario);
        mov.setMonto(monto);
        mov.setTipo(tipo);
        mov.setEstado(EstadoMovimiento.CLEARED);
        mov.setPedidoId(pedidoId);
        mov.setDescripcion(descripcion);

        MovimientoSaldo guardado = movimientoRepo.save(mov);
        sincronizarSaldoCache(usuario.getId());

        // Admin monitoring: ledger global
        adminWsService.emitirMovimiento(guardado);

        return guardado;
    }

    @Transactional
    public MovimientoSaldo crearBonoOnHold(Usuario usuario, double monto, TipoMovimiento tipo, Long pedidoId, String descripcion) {
        LocalDateTime unlockDate = LocalDateTime.now().plusDays(DIAS_HOLD_CASHBACK_COMPRA);
        MovimientoSaldo mov = new MovimientoSaldo();
        mov.setUsuario(usuario);
        mov.setMonto(monto);
        mov.setTipo(tipo);
        mov.setEstado(EstadoMovimiento.ON_HOLD);
        mov.setUnlockDate(unlockDate);
        mov.setPedidoId(pedidoId);
        mov.setDescripcion(descripcion);
                
        MovimientoSaldo guardado = movimientoRepo.save(mov);

        // Admin monitoring: ledger global
        adminWsService.emitirMovimiento(guardado);
        
        wsService.notificarSaldoActualizado(
                usuario.getId(),
                monto,
                "BONO_PENDING",
                "Bono pendiente por liberar: " + descripcion);
                
        return guardado;
    }

    /**
     * Recalcula saldoFavor desde el ledger y lo guarda en el usuario.
     * Esto mantiene la caché sincronizada con la fuente de verdad.
     */
    @Transactional
    public void sincronizarSaldoCache(Long usuarioId) {
        Double saldoReal = movimientoRepo.calcularSaldoReal(usuarioId);
        usuarioRepo.findById(usuarioId).ifPresent(u -> {
            u.setSaldoFavor(saldoReal);
            usuarioRepo.save(u);
        });
    }

    /**
     * Consulta el saldo real desde el ledger (fuente de verdad).
     * Usar esto en decisiones financieras, nunca usuario.getSaldoFavor().
     */
    public double consultarSaldoReal(Long usuarioId) {
        return movimientoRepo.calcularSaldoReal(usuarioId);
    }
}

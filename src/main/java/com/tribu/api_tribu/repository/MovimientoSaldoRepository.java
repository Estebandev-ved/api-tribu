package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.MovimientoSaldo;
import com.tribu.api_tribu.model.MovimientoSaldo.EstadoMovimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MovimientoSaldoRepository extends JpaRepository<MovimientoSaldo, Long> {

    // ── Historial del usuario ──────────────────────────────────────────────

    List<MovimientoSaldo> findByUsuarioIdOrderByFechaDesc(Long usuarioId);

    List<MovimientoSaldo> findByUsuarioIdAndEstadoOrderByFechaDesc(Long usuarioId, EstadoMovimiento estado);

    // ── Cálculo de saldo real (patrón Ledger) ─────────────────────────────
    /**
     * El saldo real de un usuario = suma de todos sus movimientos CLEARED.
     * NUNCA leer usuario.saldoFavor directamente para decisiones financieras.
     */
    @Query("SELECT COALESCE(SUM(m.monto), 0.0) FROM MovimientoSaldo m " +
           "WHERE m.usuario.id = :usuarioId AND m.estado = 'CLEARED'")
    Double calcularSaldoReal(@Param("usuarioId") Long usuarioId);

    // ── Cashback diferido (Scheduler) ─────────────────────────────────────
    /**
     * Trae todos los movimientos ON_HOLD cuya unlock_date ya pasó.
     * El CashbackScheduler los procesa y cambia a CLEARED.
     */
    @Query("SELECT m FROM MovimientoSaldo m " +
           "WHERE m.estado = 'ON_HOLD' AND m.unlockDate <= :ahora")
    List<MovimientoSaldo> findMovimientosListosParaLiberar(@Param("ahora") LocalDateTime ahora);

    // ── WebSocket: movimientos recientes para notificar ───────────────────
    @Query("SELECT m FROM MovimientoSaldo m " +
           "WHERE m.usuario.id = :usuarioId AND m.estado = 'CLEARED' " +
           "ORDER BY m.fecha DESC")
    List<MovimientoSaldo> findUltimosMovimientosCleared(
            @Param("usuarioId") Long usuarioId);

    // ── Estadísticas admin ────────────────────────────────────────────────
    @Query("SELECT COALESCE(SUM(m.monto), 0.0) FROM MovimientoSaldo m " +
           "WHERE m.tipo = :tipo AND m.estado = 'CLEARED'")
    Double sumPorTipo(@Param("tipo") MovimientoSaldo.TipoMovimiento tipo);

    @Query("SELECT COUNT(m) FROM MovimientoSaldo m WHERE m.estado = 'ON_HOLD'")
    Long countPendientesDeLiberar();

    boolean existsByPedidoIdAndTipo(Long pedidoId, MovimientoSaldo.TipoMovimiento tipo);
}
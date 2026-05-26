package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.MovimientoSaldo;
import com.tribu.api_tribu.model.MovimientoSaldo.EstadoMovimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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

    // ── Admin: Buscador global de movimientos (ledger) ─────────────────────
    @Query("""
            SELECT new com.tribu.api_tribu.dto.response.MovimientoSaldoAdminDTO(
                m.id,
                m.fecha,
                m.monto,
                m.estado,
                m.tipo,
                m.descripcion,
                m.unlockDate,
                m.pedidoId,
                u.id,
                u.nombreCompleto,
                u.email,
                u.telefono,
                u.ciudad
            )
            FROM MovimientoSaldo m
            JOIN m.usuario u
            WHERE (
                :q IS NULL OR
                LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')) OR
                LOWER(u.nombreCompleto) LIKE LOWER(CONCAT('%', :q, '%')) OR
                LOWER(COALESCE(m.descripcion, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
                LOWER(COALESCE(CONCAT('', m.pedidoId), '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
                LOWER(CONCAT('', m.id)) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            AND (:estado IS NULL OR m.estado = :estado)
            AND (:tipo IS NULL OR m.tipo = :tipo)
            """)
    Page<com.tribu.api_tribu.dto.response.MovimientoSaldoAdminDTO> buscarAdmin(
            @Param("q") String q,
            @Param("estado") EstadoMovimiento estado,
            @Param("tipo") MovimientoSaldo.TipoMovimiento tipo,
            Pageable pageable
    );

    @Query("SELECT COUNT(m) FROM MovimientoSaldo m WHERE m.fecha >= :desde")
    Long countDesde(@Param("desde") LocalDateTime desde);

    // ── Expiracion de puntos (Scheduler) ───────────────────────────────────
    @Query("SELECT m FROM MovimientoSaldo m " +
           "WHERE m.estado = 'CLEARED' AND m.monto > 0 AND m.fecha <= :limite")
    List<MovimientoSaldo> findMovimientosParaExpirar(@Param("limite") LocalDateTime limite);
}

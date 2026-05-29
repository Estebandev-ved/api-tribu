package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.Pedido;
import com.tribu.api_tribu.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByUsuarioOrderByFechaPedidoDesc(Usuario usuario);

    List<Pedido> findByEstadoOrderByFechaPedidoDesc(String estado);

    List<Pedido> findAllByOrderByFechaPedidoDesc();

    Long countByFechaPedidoBetween(LocalDateTime inicio, LocalDateTime fin);

    @Query("SELECT COALESCE(SUM(p.total), 0.0) FROM Pedido p " +
           "WHERE p.estado = :estado AND p.fechaPedido BETWEEN :inicio AND :fin")
    Double calculateTotalByEstadoAndPeriod(@Param("estado") String estado, @Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    Long countByEstado(String estado);

    /**
     * Suma el total de pedidos de un usuario en un estado y período dado.
     * Usado por el TierEvaluationScheduler para calcular compras mensuales.
     * COALESCE garantiza retorno 0.0 si no hay pedidos (evita NPE).
     */
    @Query("SELECT COALESCE(SUM(p.total), 0.0) FROM Pedido p " +
           "WHERE p.usuario.id = :usuarioId " +
           "AND p.estado = :estado " +
           "AND p.fechaPedido BETWEEN :inicio AND :fin")
    Double calculateTotalEntregadoEnPeriodo(
            @Param("usuarioId") Long usuarioId,
            @Param("estado") String estado,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin
    );

    /**
     * Suma pedidos en estados 'PAGADO', 'DESPACHADO' o 'ENTREGADO'.
     * Usado para mostrar progreso en tiempo real al usuario.
     */
    @Query("SELECT COALESCE(SUM(p.total), 0.0) FROM Pedido p " +
           "WHERE p.usuario.id = :usuarioId " +
           "AND p.estado IN ('PAGADO', 'EN_PROCESO', 'DESPACHADO', 'ENTREGADO') " +
           "AND p.fechaPedido BETWEEN :inicio AND :fin")
    Double calculateTotalValidoTierEnPeriodo(
            @Param("usuarioId") Long usuarioId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin
    );

    @Query("SELECT DISTINCT d.producto.categoria.id FROM DetallePedido d " +
           "WHERE d.pedido.usuario.id = :uid AND d.pedido.estado = 'ENTREGADO'")
    List<Long> findCategoriasCompradas(@Param("uid") Long uid);

    @Query("SELECT DISTINCT d.producto.id FROM DetallePedido d " +
           "WHERE d.pedido.usuario.id = :uid AND d.pedido.estado = 'ENTREGADO'")
    List<Long> findProductosComprados(@Param("uid") Long uid);

    @Query(value = """
        SELECT ROW_NUMBER() OVER (ORDER BY SUM(p.total) DESC) as posicion,
               u.id, u.nombre_completo, COALESCE(SUM(p.total), 0) as total,
               COALESCE(t.nombre, 'SIN_TIER') as tier, COALESCE(u.racha_actual, 0) as racha
        FROM pedidos p
        JOIN usuarios u ON p.usuario_id = u.id
        LEFT JOIN tiers t ON u.tier_actual_id = t.id
        WHERE p.estado = 'ENTREGADO'
        AND p.fecha_pedido BETWEEN :inicio AND :fin
        GROUP BY u.id
        ORDER BY total DESC
        """, nativeQuery = true)
    List<Object[]> findTopCompradores(
        @Param("inicio") LocalDateTime inicio,
        @Param("fin") LocalDateTime fin,
        Pageable pageable);

    @Query(value = """
        SELECT ROW_NUMBER() OVER (ORDER BY SUM(p.total) DESC) as posicion,
               u.id, u.nombre_completo, COALESCE(SUM(p.total), 0) as total,
               COALESCE(t.nombre, 'SIN_TIER') as tier, COALESCE(u.racha_actual, 0) as racha
        FROM pedidos p
        JOIN usuarios u ON p.usuario_id = u.id
        LEFT JOIN tiers t ON u.tier_actual_id = t.id
        WHERE p.estado = 'ENTREGADO'
        AND p.fecha_pedido BETWEEN :inicio AND :fin
        AND u.id = :usuarioId
        GROUP BY u.id
        """, nativeQuery = true)
    List<Object[]> findPosicionEnTop(
        @Param("usuarioId") Long usuarioId,
        @Param("inicio") LocalDateTime inicio,
        @Param("fin") LocalDateTime fin);

    @Query("SELECT COUNT(p) FROM Pedido p WHERE p.usuario.id = :usuarioId AND p.estado IN ('PAGADO', 'EN_PROCESO', 'DESPACHADO', 'ENTREGADO')")
    Long countGlobalPedidosValidos(@Param("usuarioId") Long usuarioId);

    @Query("SELECT COALESCE(SUM(p.total), 0.0) FROM Pedido p WHERE p.usuario.id = :usuarioId AND p.estado IN ('PAGADO', 'EN_PROCESO', 'DESPACHADO', 'ENTREGADO')")
    Double calculateTotalGlobalValido(@Param("usuarioId") Long usuarioId);

    Pedido findByEfipayPaymentId(String efipayPaymentId);
}

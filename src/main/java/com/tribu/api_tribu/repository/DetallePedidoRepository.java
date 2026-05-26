package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.DetallePedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repository para acceder a los detalles de pedidos.
 * Expone consultas JPQL para obtener el libro diario de ventas de pedidos válidos.
 * Seguridad: Accedido únicamente desde FinanzasService, protegido por JWT + ROLE_ADMIN en el controlador.
 */
@Repository
public interface DetallePedidoRepository extends JpaRepository<DetallePedido, Long> {

    /**
     * Obtiene todos los detalles de pedidos en estado válido (pagado/enviado/entregado).
     * Carga el producto y el pedido completo para calcular los costos de venta.
     */
    @Query("SELECT d FROM DetallePedido d " +
           "JOIN FETCH d.pedido p " +
           "JOIN FETCH d.producto prod " +
           "LEFT JOIN FETCH prod.categoria " +
           "LEFT JOIN FETCH p.usuario " +
           "WHERE p.estado IN ('PAGADO', 'ENVIADO', 'ENTREGADO') " +
           "ORDER BY p.fechaPedido DESC")
    List<DetallePedido> findDetallesVentasValidas();

    /**
     * Obtiene todos los detalles de pedidos sin filtrar (incluyendo PENDIENTE)
     * para calcular el dinero pendiente de cobrar.
     */
    @Query("SELECT d FROM DetallePedido d " +
           "JOIN FETCH d.pedido p " +
           "JOIN FETCH d.producto prod " +
           "LEFT JOIN FETCH prod.categoria " +
           "LEFT JOIN FETCH p.usuario " +
           "ORDER BY p.fechaPedido DESC")
    List<DetallePedido> findAllDetallesWithRelations();
}

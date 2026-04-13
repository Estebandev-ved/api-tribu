package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.Categoria;
import com.tribu.api_tribu.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    List<Producto> findByActivoTrue();

    List<Producto> findByEsViralTrueAndActivoTrue();

    List<Producto> findByCategoria(Categoria categoria);

    List<Producto> findByNombreContainingIgnoreCaseAndActivoTrue(String nombre);

    List<Producto> findByStockLessThanEqual(Integer stock);

    List<Producto> findByStockBetween(Integer min, Integer max);

    List<Producto> findByStockLessThanEqualOrderByStockAsc(Integer stock);

    @Query(value = """
        SELECT p.nombre, SUM(dp.cantidad) as cantidad
        FROM productos p
        JOIN detalle_pedidos dp ON p.id = dp.producto_id
        JOIN pedidos pe ON dp.pedido_id = pe.id
        WHERE pe.estado IN ('PAGADO', 'ENVIADO', 'ENTREGADO')
        AND YEAR(pe.fecha_pedido) = YEAR(CURDATE())
        AND MONTH(pe.fecha_pedido) = MONTH(CURDATE())
        GROUP BY p.id, p.nombre
        ORDER BY cantidad DESC
        LIMIT 5
        """, nativeQuery = true)
    List<Map<String, Object>> findTop5ProductosMasVendidosMesActual();

    @Query(value = """
        SELECT p.nombre, SUM(dp.cantidad) as cantidad
        FROM productos p
        JOIN detalle_pedidos dp ON p.id = dp.producto_id
        JOIN pedidos pe ON dp.pedido_id = pe.id
        WHERE pe.estado IN ('PAGADO', 'ENVIADO', 'ENTREGADO')
        AND YEAR(pe.fecha_pedido) = YEAR(CURDATE())
        AND MONTH(pe.fecha_pedido) = MONTH(CURDATE())
        GROUP BY p.id, p.nombre
        ORDER BY cantidad DESC
        LIMIT 1
        """, nativeQuery = true)
    Map<String, Object> findTopProductoVendidoDelMes();

    @Query("SELECT p FROM Producto p WHERE p.categoria.id IN :categoriaIds " +
           "AND p.stock > 0 AND p.activo = true ORDER BY p.ventasTotales DESC")
    List<Producto> findByCategoriaIdInAndStockGreaterThanOrderByVentasTotalesDesc(
            @Param("categoriaIds") List<Long> categoriaIds,
            Pageable pageable);

    @Query(value = """
        SELECT p.* FROM productos p
        JOIN detalle_pedidos dp ON p.id = dp.producto_id
        JOIN pedidos ped ON dp.pedido_id = ped.id
        JOIN usuarios u ON ped.usuario_id = u.id
        JOIN tiers t ON u.tier_actual_id = t.id
        WHERE t.nombre = :tier AND ped.estado = 'ENTREGADO'
        AND p.id NOT IN (
            SELECT dp2.producto_id FROM detalle_pedidos dp2
            JOIN pedidos p2 ON dp2.pedido_id = p2.id
            WHERE p2.usuario_id = :uid
        )
        GROUP BY p.id 
        ORDER BY COUNT(*) DESC
        """, nativeQuery = true)
    List<Producto> findProductosPopularesPorTier(
            @Param("tier") String tier,
            @Param("uid") Long uid,
            Pageable pageable);

    @Query("SELECT p FROM Producto p WHERE p.stock > 0 AND p.activo = true " +
           "ORDER BY p.ventasTotales DESC")
    List<Producto> findProductosTendencia(Pageable pageable);
}

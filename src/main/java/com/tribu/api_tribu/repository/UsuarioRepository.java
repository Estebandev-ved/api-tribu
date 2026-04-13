package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM Usuario u WHERE u.id = :id")
    Optional<Usuario> findByIdForUpdate(@Param("id") Long id);

    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByCodigoReferido(String codigoReferido);

    boolean existsByEmail(String email);

    @Query("SELECT COUNT(u) FROM Usuario u WHERE u.fechaCreacion BETWEEN :inicio AND :fin")
    Long countByFechaCreacionBetween(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    @Query("SELECT u FROM Usuario u JOIN u.tierActual t WHERE t.nombre = :tierNombre")
    List<Usuario> findByTierActualNombre(@Param("tierNombre") String tierNombre);

    @Query("SELECT u FROM Usuario u WHERE u.fechaCreacion >= :fecha")
    List<Usuario> findNuevosUltimos7Dias(@Param("fecha") LocalDateTime fecha);

    @Query("SELECT u FROM Usuario u WHERE u.id NOT IN " +
           "(SELECT DISTINCT p.usuario.id FROM Pedido p WHERE p.estado = 'ENTREGADO' AND p.fechaPedido >= :fecha)")
    List<Usuario> findInactivos(@Param("fecha") LocalDateTime fecha);

    @Query(value = "SELECT u.* FROM usuarios u WHERE u.codigo_referido IS NOT NULL " +
           "ORDER BY (SELECT COUNT(*) FROM pedidos p WHERE p.usuario_id = u.id) DESC LIMIT 10", nativeQuery = true)
    List<Usuario> findTopReferidores();

    List<Usuario> findByCodigoReferidoUsado(String codigoReferido);

    @Query("SELECT COUNT(u) FROM Usuario u WHERE u.codigoReferidoUsado = :codigo")
    Long countReferidosPorCodigo(@Param("codigo") String codigo);

    @Query("SELECT u FROM Usuario u WHERE u.rachaActual > :rachaLimit AND u.ultimaActividadFecha < :fecha")
    List<Usuario> findByRachaActualGreaterThanAndUltimaActividadFechaBefore(
        @Param("rachaLimit") int rachaLimit, @Param("fecha") LocalDate fecha);
}

package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.dto.response.TransferenciaAdminDTO;
import com.tribu.api_tribu.model.TransferenciaP2P;
import com.tribu.api_tribu.model.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransferenciaRepository extends JpaRepository<TransferenciaP2P, Long> {

    List<TransferenciaP2P> findByEmisorOrderByFechaCreacionDesc(Usuario emisor);

    List<TransferenciaP2P> findByReceptorOrderByFechaCreacionDesc(Usuario receptor);

    Optional<TransferenciaP2P> findByReferenciaUnica(String referencia);

    @Query("SELECT t FROM TransferenciaP2P t WHERE t.emisor = :u OR t.receptor = :u ORDER BY t.fechaCreacion DESC")
    List<TransferenciaP2P> findHistorialCompleto(@Param("u") Usuario usuario);

    @Query("SELECT COALESCE(SUM(t.monto), 0.0) FROM TransferenciaP2P t " +
           "WHERE t.emisor.id = :uid AND t.estado = 'COMPLETADA' " +
           "AND t.fechaCreacion BETWEEN :inicio AND :fin")
    Double sumMontoEnviadoHoy(@Param("uid") Long uid,
                               @Param("inicio") LocalDateTime inicio,
                               @Param("fin") LocalDateTime fin);

    @Query("SELECT COUNT(t) FROM TransferenciaP2P t " +
           "WHERE t.emisor.id = :uid AND t.estado = 'COMPLETADA' " +
           "AND t.fechaCreacion BETWEEN :inicio AND :fin")
    Long countTransaccionesHoy(@Param("uid") Long uid,
                                @Param("inicio") LocalDateTime inicio,
                                @Param("fin") LocalDateTime fin);

    // ── Admin: monitoreo de transferencias P2P ─────────────────────────────
    @Query("""
            SELECT new com.tribu.api_tribu.dto.response.TransferenciaAdminDTO(
                t.id,
                t.fechaCreacion,
                t.fechaCompletada,
                t.monto,
                t.mensaje,
                t.estado,
                t.referenciaUnica,
                e.id,
                e.nombreCompleto,
                e.email,
                r.id,
                r.nombreCompleto,
                r.email,
                me.id,
                mr.id
            )
            FROM TransferenciaP2P t
            JOIN t.emisor e
            JOIN t.receptor r
            LEFT JOIN t.movimientoEmisor me
            LEFT JOIN t.movimientoReceptor mr
            WHERE (
                :q IS NULL OR
                LOWER(e.email) LIKE LOWER(CONCAT('%', :q, '%')) OR
                LOWER(r.email) LIKE LOWER(CONCAT('%', :q, '%')) OR
                LOWER(e.nombreCompleto) LIKE LOWER(CONCAT('%', :q, '%')) OR
                LOWER(r.nombreCompleto) LIKE LOWER(CONCAT('%', :q, '%')) OR
                LOWER(COALESCE(t.referenciaUnica, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
                LOWER(COALESCE(t.mensaje, '')) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            AND (:estado IS NULL OR t.estado = :estado)
            """)
    Page<TransferenciaAdminDTO> buscarAdmin(
            @Param("q") String q,
            @Param("estado") TransferenciaP2P.EstadoTransferencia estado,
            Pageable pageable
    );
}

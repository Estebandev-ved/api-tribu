package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.TransferenciaP2P;
import com.tribu.api_tribu.model.Usuario;
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
}

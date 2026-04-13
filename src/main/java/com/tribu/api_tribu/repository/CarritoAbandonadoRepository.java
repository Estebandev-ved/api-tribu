package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.CarritoAbandonado;
import com.tribu.api_tribu.model.EstadoCarrito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CarritoAbandonadoRepository extends JpaRepository<CarritoAbandonado, Long> {

    Optional<CarritoAbandonado> findByUsuarioIdAndEstado(Long usuarioId, EstadoCarrito estado);

    @Query("SELECT c FROM CarritoAbandonado c WHERE c.estado = :estado " +
           "AND c.fechaUltimaModificacion < :fecha")
    List<CarritoAbandonado> findByEstadoAndFechaModificacionBefore(
            @Param("estado") EstadoCarrito estado,
            @Param("fecha") LocalDateTime fecha);

    @Query("SELECT c FROM CarritoAbandonado c WHERE c.estado = :estado")
    List<CarritoAbandonado> findByEstado(@Param("estado") EstadoCarrito estado);
}
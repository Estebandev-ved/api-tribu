package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.TribuPass;
import com.tribu.api_tribu.model.TribuPass.EstadoPass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TribuPassRepository extends JpaRepository<TribuPass, Long> {

    Optional<TribuPass> findByUsuarioId(Long usuarioId);

    Optional<TribuPass> findByUsuarioIdAndEstado(Long usuarioId, EstadoPass estado);

    List<TribuPass> findByEstadoAndFechaRenovacionLessThanEqualAndRenovacionAutomaticaTrue(
            EstadoPass estado, LocalDateTime fechaRenovacion);

    boolean existsByUsuarioIdAndEstado(Long usuarioId, EstadoPass estado);
}

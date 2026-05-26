package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.CanjeRecompensa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CanjeRecompensaRepository extends JpaRepository<CanjeRecompensa, Long> {
    List<CanjeRecompensa> findByUsuarioIdOrderByFechaDesc(Long usuarioId);
    Optional<CanjeRecompensa> findByCodigoCanje(String codigoCanje);
}

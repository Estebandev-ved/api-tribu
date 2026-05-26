package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.EstadoSoporte;
import com.tribu.api_tribu.model.SoporteConversacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SoporteConversacionRepository extends JpaRepository<SoporteConversacion, Long> {
    List<SoporteConversacion> findByUsuarioEmailOrderByFechaActualizacionDesc(String email);
    List<SoporteConversacion> findByEstadoOrderByFechaActualizacionDesc(EstadoSoporte estado);
    List<SoporteConversacion> findByUsuarioIdAndEstadoNotOrderByFechaActualizacionDesc(Long usuarioId, EstadoSoporte estado);
    List<SoporteConversacion> findAllByOrderByFechaActualizacionDesc();
}

package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.NotificacionEvent;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificacionRepository extends JpaRepository<NotificacionEvent, Long> {

    List<NotificacionEvent> findByUsuarioId(String usuarioId);

    List<NotificacionEvent> findByUsuarioIdAndLeidaFalse(String usuarioId);

    List<NotificacionEvent> findByUsuarioIdOrderByFechaDesc(String usuarioId);

}

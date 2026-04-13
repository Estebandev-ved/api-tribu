package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.PushSuscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PushSuscripcionRepository extends JpaRepository<PushSuscripcion, Long> {
    List<PushSuscripcion> findByUsuarioIdAndActivaTrue(Long usuarioId);
    
    List<PushSuscripcion> findByEndpoint(String endpoint);
    
    void deleteByEndpoint(String endpoint);
}

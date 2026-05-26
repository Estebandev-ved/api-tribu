package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.SoporteMensaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SoporteMensajeRepository extends JpaRepository<SoporteMensaje, Long> {
    List<SoporteMensaje> findByConversacionIdOrderByFechaCreacionAsc(Long conversacionId);
}

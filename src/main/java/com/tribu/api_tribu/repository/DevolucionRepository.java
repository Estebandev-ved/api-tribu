package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.Devolucion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DevolucionRepository extends JpaRepository<Devolucion, Long> {
    List<Devolucion> findByEmailOrderByFechaSolicitudDesc(String email);
}

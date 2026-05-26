package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.Recompensa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecompensaRepository extends JpaRepository<Recompensa, Long> {
    List<Recompensa> findByActivoTrueOrderByCostoPuntosAsc();
}

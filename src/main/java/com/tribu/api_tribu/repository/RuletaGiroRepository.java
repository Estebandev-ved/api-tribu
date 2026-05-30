package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.RuletaGiro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RuletaGiroRepository extends JpaRepository<RuletaGiro, Long> {
    List<RuletaGiro> findAllByOrderByFechaDesc();
}

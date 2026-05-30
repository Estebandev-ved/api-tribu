package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.RuletaConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RuletaConfigRepository extends JpaRepository<RuletaConfig, Long> {
}

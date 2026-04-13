package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.CampanaMarketing;
import com.tribu.api_tribu.model.EstadoCampana;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampanaMarketingRepository extends JpaRepository<CampanaMarketing, Long> {
    List<CampanaMarketing> findByEstado(EstadoCampana estado);
}
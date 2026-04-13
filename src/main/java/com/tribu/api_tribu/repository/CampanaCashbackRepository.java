package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.CampanaCashback;
import com.tribu.api_tribu.model.Tier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CampanaCashbackRepository extends JpaRepository<CampanaCashback, Long> {

    @Query("SELECT c FROM CampanaCashback c WHERE c.activa = true " +
           "AND c.fechaInicio <= :ahora AND c.fechaFin >= :ahora")
    Optional<CampanaCashback> findCampanaActiva(@Param("ahora") LocalDateTime ahora);

    @Query("SELECT c FROM CampanaCashback c WHERE c.activa = true " +
           "AND c.fechaInicio <= :ahora AND c.fechaFin >= :ahora " +
           "AND (c.tiersAplicables IS EMPTY OR :tier MEMBER OF c.tiersAplicables)")
    Optional<CampanaCashback> findCampanaActivaParaTier(
            @Param("ahora") LocalDateTime ahora,
            @Param("tier") Tier tier);

    List<CampanaCashback> findByActivaTrue();

    @Query("SELECT c FROM CampanaCashback c WHERE c.activa = true " +
           "AND c.fechaInicio <= :ahora AND c.fechaFin >= :ahora " +
           "AND (c.tiersAplicables IS EMPTY OR EXISTS (SELECT t FROM c.tiersAplicables t WHERE t.id = :tierId))")
    Optional<CampanaCashback> findCampanaActivaParaTierId(
            @Param("ahora") LocalDateTime ahora,
            @Param("tierId") Long tierId);
}
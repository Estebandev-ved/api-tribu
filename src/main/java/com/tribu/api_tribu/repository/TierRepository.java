package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.Tier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TierRepository extends JpaRepository<Tier, Long> {

    /** Busca un tier por su nombre exacto (ej: "BRONCE", "PLATA", "ORO") */
    Optional<Tier> findByNombre(String nombre);

    /** Retorna todos los tiers ordenados de mayor a menor (ORO primero) */
    @Query("SELECT t FROM Tier t ORDER BY t.orden DESC")
    List<Tier> findAllOrderByOrdenDesc();

    /** Retorna el tier de menor orden (BRONCE = el tier base/fallback) */
    @Query("SELECT t FROM Tier t ORDER BY t.orden ASC LIMIT 1")
    Optional<Tier> findTierMinimo();
}

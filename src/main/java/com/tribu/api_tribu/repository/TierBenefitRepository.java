package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.Tier;
import com.tribu.api_tribu.model.TierBenefit;
import com.tribu.api_tribu.model.TipoBeneficio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TierBenefitRepository extends JpaRepository<TierBenefit, Long> {

    /** Todos los beneficios de un tier dado */
    List<TierBenefit> findByTier(Tier tier);

    /** Busca un beneficio específico por tier y tipo */
    Optional<TierBenefit> findByTierAndTipo(Tier tier, TipoBeneficio tipo);

    /** Busca beneficios por nombre del tier (para consultas directas sin cargar la entidad Tier) */
    List<TierBenefit> findByTierNombre(String tierNombre);
}

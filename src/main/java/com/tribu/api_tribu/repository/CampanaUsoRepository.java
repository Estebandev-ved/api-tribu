package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.CampanaUso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CampanaUsoRepository extends JpaRepository<CampanaUso, Long> {

    Optional<CampanaUso> findByCampanaIdAndUsuarioId(Long campanaId, Long usuarioId);

    boolean existsByCampanaIdAndUsuarioId(Long campanaId, Long usuarioId);

    long countByCampanaId(Long campanaId);
}
package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.GrupoCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface GrupoRepository extends JpaRepository<GrupoCompra, Long> {
    Optional<GrupoCompra> findByCodigoInvitacion(String codigo);
    List<GrupoCompra> findByOrganizadorId(Long organizadorId);
}

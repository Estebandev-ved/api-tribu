package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.GrupoParticipante;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GrupoParticipanteRepository extends JpaRepository<GrupoParticipante, Long> {
    List<GrupoParticipante> findByUsuarioId(Long usuarioId);
    List<GrupoParticipante> findByGrupoId(Long grupoId);
    boolean existsByGrupoIdAndUsuarioId(Long grupoId, Long usuarioId);
}

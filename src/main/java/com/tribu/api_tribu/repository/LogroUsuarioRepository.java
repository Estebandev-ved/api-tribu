package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.LogroUsuario;
import com.tribu.api_tribu.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LogroUsuarioRepository extends JpaRepository<LogroUsuario, Long> {
    List<LogroUsuario> findByUsuario(Usuario usuario);
    Optional<LogroUsuario> findByUsuarioAndLogroId(Usuario usuario, String logroId);
    boolean existsByUsuarioAndLogroId(Usuario usuario, String logroId);
}

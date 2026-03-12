package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.CrmNota;
import com.tribu.api_tribu.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CrmNotaRepository extends JpaRepository<CrmNota, Long> {
    List<CrmNota> findByClienteOrderByFechaCreacionDesc(Usuario cliente);

    List<CrmNota> findByCreadoPorOrderByFechaCreacionDesc(Usuario admin);

    List<CrmNota> findAllByOrderByFechaCreacionDesc();
}

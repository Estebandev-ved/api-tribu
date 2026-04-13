package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.FacturaElectronica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FacturaRepository extends JpaRepository<FacturaElectronica, Long> {
    Optional<FacturaElectronica> findByPedidoId(Long pedidoId);
    List<FacturaElectronica> findByUsuarioId(Long usuarioId);
    boolean existsByPedidoId(Long pedidoId);
}

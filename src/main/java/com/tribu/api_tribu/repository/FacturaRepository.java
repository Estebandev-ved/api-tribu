package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.FacturaElectronica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FacturaRepository extends JpaRepository<FacturaElectronica, Long> {
    Optional<FacturaElectronica> findByPedido_Id(Long pedidoId);
    List<FacturaElectronica> findByUsuario_Id(Long usuarioId);
    boolean existsByPedido_Id(Long pedidoId);
}

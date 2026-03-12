package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.Pedido;
import com.tribu.api_tribu.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByUsuarioOrderByFechaPedidoDesc(Usuario usuario);

    List<Pedido> findByEstadoOrderByFechaPedidoDesc(String estado);

    List<Pedido> findAllByOrderByFechaPedidoDesc();
}

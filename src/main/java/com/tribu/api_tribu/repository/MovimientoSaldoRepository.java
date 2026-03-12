package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.MovimientoSaldo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimientoSaldoRepository extends JpaRepository<MovimientoSaldo, Long> {
    List<MovimientoSaldo> findByUsuarioIdOrderByFechaDesc(Long usuarioId);
}

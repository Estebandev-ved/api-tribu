package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.Cupon;
import com.tribu.api_tribu.model.CuponUso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CuponUsoRepository extends JpaRepository<CuponUso, Long> {

    @Query("SELECT COUNT(u) FROM CuponUso u WHERE u.cupon = :cupon AND u.usuario.id = :usuarioId")
    int countByCuponAndUsuarioId(@Param("cupon") Cupon cupon, @Param("usuarioId") Long usuarioId);

    List<CuponUso> findByCupon(Cupon cupon);

    @Query("SELECT SUM(u.descuentoAplicado) FROM CuponUso u WHERE u.cupon = :cupon")
    Double sumDescuentoByCupon(@Param("cupon") Cupon cupon);
}

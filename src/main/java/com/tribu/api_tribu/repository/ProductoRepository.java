package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.Categoria;
import com.tribu.api_tribu.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    List<Producto> findByActivoTrue();

    List<Producto> findByEsViralTrueAndActivoTrue();

    List<Producto> findByCategoria(Categoria categoria);

    List<Producto> findByNombreContainingIgnoreCaseAndActivoTrue(String nombre);

    List<Producto> findByStockLessThanEqual(Integer stock);
}

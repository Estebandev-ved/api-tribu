package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    List<Categoria> findByActivaTrue();

    Optional<Categoria> findByNombre(String nombre);
}

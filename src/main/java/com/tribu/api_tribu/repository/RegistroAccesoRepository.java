package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.RegistroAcceso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface RegistroAccesoRepository extends JpaRepository<RegistroAcceso, Long> {

    @Query("SELECT COUNT(r) FROM RegistroAcceso r WHERE r.ipAddress = :ipAddress AND r.exitoso = false AND r.fecha >= :desde")
    long countFailedAttemptsByIpSince(@Param("ipAddress") String ipAddress, @Param("desde") LocalDateTime desde);

    @Query("SELECT r FROM RegistroAcceso r WHERE r.exitoso = true ORDER BY r.fecha DESC LIMIT 100")
    java.util.List<RegistroAcceso> findRecentSuccessfulAccesses();

    @Query("SELECT r FROM RegistroAcceso r WHERE r.exitoso = false ORDER BY r.fecha DESC LIMIT 100")
    java.util.List<RegistroAcceso> findRecentFailedAccesses();

    java.util.List<RegistroAcceso> findByEmailAndExitosoTrueOrderByFechaDesc(String email);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("DELETE FROM RegistroAcceso r WHERE r.id = :id AND r.email = :email")
    void deleteByIdAndEmail(@Param("id") Long id, @Param("email") String email);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("DELETE FROM RegistroAcceso r WHERE r.email = :email AND r.exitoso = true AND r.id <> :id")
    void deleteByEmailAndExitosoTrueAndIdNot(@Param("email") String email, @Param("id") Long id);
}

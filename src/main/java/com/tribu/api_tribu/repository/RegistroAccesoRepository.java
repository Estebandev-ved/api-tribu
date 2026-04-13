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
}

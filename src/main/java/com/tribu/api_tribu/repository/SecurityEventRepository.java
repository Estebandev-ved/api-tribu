package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.SecurityEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {
    List<SecurityEvent> findTop100ByOrderByTimestampDesc();
    SecurityEvent findTopByOrderByIdDesc();
}

package com.tribu.api_tribu.repository;

import com.tribu.api_tribu.model.LeaderboardSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaderboardSnapshotRepository extends JpaRepository<LeaderboardSnapshot, Long> {
    List<LeaderboardSnapshot> findByMesOrderByPosicionAsc(String mes);
}

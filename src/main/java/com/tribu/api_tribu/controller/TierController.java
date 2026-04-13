package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.model.Tier;
import com.tribu.api_tribu.repository.TierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tiers")
@RequiredArgsConstructor
public class TierController {

    private final TierRepository tierRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getTiers() {
        List<Map<String, Object>> tiers = tierRepository.findAll().stream()
                .map(t -> Map.of(
                        "id", (Object) t.getId(),
                        "nombre", (Object) t.getNombre(),
                        "orden", (Object) t.getOrden()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(tiers);
    }
}

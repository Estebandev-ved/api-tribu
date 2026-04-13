package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.CampanaMarketingRequest;
import com.tribu.api_tribu.model.CampanaMarketing;
import com.tribu.api_tribu.service.CampanaMarketingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/campanas-marketing")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CampanaMarketingController {

    private final CampanaMarketingService marketingService;

    @PostMapping
    public ResponseEntity<CampanaMarketing> crearCampana(@RequestBody CampanaMarketingRequest request) {
        return ResponseEntity.ok(marketingService.crearCampana(request));
    }

    @GetMapping
    public ResponseEntity<List<CampanaMarketing>> listarCampanas() {
        return ResponseEntity.ok(marketingService.listarCampanas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CampanaMarketing> getCampana(@PathVariable Long id) {
        return ResponseEntity.ok(marketingService.getCampana(id));
    }

    @PostMapping("/{id}/ejecutar")
    public ResponseEntity<Void> ejecutarCampana(@PathVariable Long id) {
        marketingService.ejecutarCampana(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/segmentos/conteo")
    public ResponseEntity<Map<String, Long>> getConteoSegmentos() {
        return ResponseEntity.ok(marketingService.getConteoSegmentos());
    }
}
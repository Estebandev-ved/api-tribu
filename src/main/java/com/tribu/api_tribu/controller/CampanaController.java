package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.CampanaRequest;
import com.tribu.api_tribu.dto.response.CampanaStatsDTO;
import com.tribu.api_tribu.model.CampanaCashback;
import com.tribu.api_tribu.service.CampanaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CampanaController {

    private final CampanaService campanaService;

    @GetMapping("/campanas/activa")
    public ResponseEntity<?> getCampanaActivaPublica() {
        CampanaCashback campana = campanaService.getCampanaActivaPublica();
        if (campana == null) {
            return ResponseEntity.ok().body(new java.util.HashMap<>());
        }
        return ResponseEntity.ok(campana);
    }

    @PostMapping("/admin/campanas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CampanaCashback> crearCampana(@RequestBody CampanaRequest request) {
        String adminEmail = "admin@tribu.com";
        CampanaCashback campana = campanaService.crearCampana(request, adminEmail);
        return ResponseEntity.ok(campana);
    }

    @GetMapping("/admin/campanas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CampanaCashback>> listarCampanas() {
        return ResponseEntity.ok(campanaService.listarCampanas());
    }

    @PutMapping("/admin/campanas/{id}/activar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> activarCampana(@PathVariable Long id) {
        campanaService.activarCampana(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/admin/campanas/{id}/desactivar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> desactivarCampana(@PathVariable Long id) {
        campanaService.desactivarCampana(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/admin/campanas/{id}/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CampanaStatsDTO> getStats(@PathVariable Long id) {
        return ResponseEntity.ok(campanaService.getStats(id));
    }

    @DeleteMapping("/admin/campanas/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> eliminarCampana(@PathVariable Long id) {
        campanaService.eliminarCampana(id);
        return ResponseEntity.noContent().build();
    }
}
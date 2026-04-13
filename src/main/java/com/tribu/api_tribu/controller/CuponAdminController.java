package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.CuponRequest;
import com.tribu.api_tribu.dto.response.CuponStatsDTO;
import com.tribu.api_tribu.model.Cupon;
import com.tribu.api_tribu.service.CuponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/cupones")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class CuponAdminController {

    private final CuponService cuponService;

    @GetMapping
    public ResponseEntity<List<Cupon>> listarTodos() {
        return ResponseEntity.ok(cuponService.listarTodos());
    }

    @PostMapping
    public ResponseEntity<Cupon> crear(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CuponRequest request) {
        return ResponseEntity.ok(cuponService.crear(request, userDetails.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cupon> actualizar(
            @PathVariable Long id,
            @RequestBody CuponRequest request) {
        return ResponseEntity.ok(cuponService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        cuponService.eliminar(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<CuponStatsDTO> getStats(@PathVariable Long id) {
        return ResponseEntity.ok(cuponService.getStats(id));
    }
}

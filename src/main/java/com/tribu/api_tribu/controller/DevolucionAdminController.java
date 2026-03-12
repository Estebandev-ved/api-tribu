package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.ActualizarEstadoDevolucionRequest;
import com.tribu.api_tribu.dto.response.DevolucionResponse;
import com.tribu.api_tribu.service.DevolucionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/devoluciones")
@RequiredArgsConstructor
public class DevolucionAdminController {

    private final DevolucionService devolucionService;

    @GetMapping
    public ResponseEntity<List<DevolucionResponse>> getAllDevoluciones() {
        return ResponseEntity.ok(devolucionService.getAllDevoluciones());
    }

    @GetMapping("/estadisticas")
    public ResponseEntity<Map<String, Object>> getEstadisticas() {
        return ResponseEntity.ok(devolucionService.getEstadisticasDevoluciones());
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<DevolucionResponse> actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarEstadoDevolucionRequest request) {
        return ResponseEntity.ok(devolucionService.actualizarEstado(id, request));
    }

    @PostMapping("/{id}/reembolsar-saldo")
    public ResponseEntity<Map<String, String>> reembolsarSaldo(
            @PathVariable Long id,
            @RequestBody Map<String, Double> payload) {
        Double monto = payload.get("monto");
        devolucionService.reembolsarSaldo(id, monto);
        return ResponseEntity.ok(Map.of("mensaje", "Saldo reembolsado exitosamente a la billetera del cliente."));
    }
}

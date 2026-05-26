package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.RecompensaRequest;
import com.tribu.api_tribu.dto.response.RecompensaDTO;
import com.tribu.api_tribu.service.RecompensaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/recompensas")
public class AdminRecompensaController {

    private final RecompensaService recompensaService;

    public AdminRecompensaController(RecompensaService recompensaService) {
        this.recompensaService = recompensaService;
    }

    @GetMapping
    public ResponseEntity<List<RecompensaDTO>> listarTodas() {
        return ResponseEntity.ok(recompensaService.listarTodas());
    }

    @PostMapping
    public ResponseEntity<RecompensaDTO> crear(@RequestBody RecompensaRequest request) {
        return ResponseEntity.ok(recompensaService.crear(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecompensaDTO> actualizar(@PathVariable Long id, @RequestBody RecompensaRequest request) {
        return ResponseEntity.ok(recompensaService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        recompensaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}

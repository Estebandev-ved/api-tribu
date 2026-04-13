package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.model.Producto;
import com.tribu.api_tribu.service.InventarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/inventario")
@RequiredArgsConstructor
public class InventarioController {

    private final InventarioService inventarioService;

    @GetMapping("/stock-bajo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Producto>> getStockBajo() {
        return ResponseEntity.ok(inventarioService.getStockBajo());
    }

    @GetMapping("/stock-critico")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Producto>> getStockCritico() {
        return ResponseEntity.ok(inventarioService.getStockCritico());
    }

    @PutMapping("/{id}/stock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Producto> actualizarStock(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body) {
        Integer cantidad = body.get("cantidad");
        if (cantidad == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(inventarioService.actualizarStock(id, cantidad));
    }

    @PutMapping("/{id}/umbrales")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Producto> actualizarUmbrales(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body) {
        Integer stockMinimo = body.get("stockMinimo");
        Integer stockCritico = body.get("stockCritico");
        
        if (stockMinimo == null || stockCritico == null) {
            return ResponseEntity.badRequest().build();
        }
        
        return ResponseEntity.ok(inventarioService.actualizarUmbrales(id, stockMinimo, stockCritico));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InventarioService.InventarioDashboard> getDashboard() {
        return ResponseEntity.ok(inventarioService.getDashboard());
    }
}

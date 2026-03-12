package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.ProductoRequest;
import com.tribu.api_tribu.dto.response.ProductoResponse;
import com.tribu.api_tribu.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    // ——— Públicos ———

    @GetMapping
    public ResponseEntity<List<ProductoResponse>> getAll() {
        return ResponseEntity.ok(productoService.getAll());
    }

    @GetMapping("/virales")
    public ResponseEntity<List<ProductoResponse>> getVirales() {
        return ResponseEntity.ok(productoService.getVirales());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductoResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productoService.getById(id));
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<ProductoResponse>> buscar(@RequestParam String nombre) {
        return ResponseEntity.ok(productoService.buscarPorNombre(nombre));
    }

    // ——— Solo ADMIN (protegido por SecurityConfig) ———

    @PostMapping
    public ResponseEntity<ProductoResponse> crear(@Valid @RequestBody ProductoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productoService.crear(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductoResponse> actualizar(@PathVariable Long id,
            @Valid @RequestBody ProductoRequest request) {
        return ResponseEntity.ok(productoService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        productoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stock-bajo")
    public ResponseEntity<List<ProductoResponse>> stockBajo(
            @RequestParam(defaultValue = "5") Integer umbral) {
        return ResponseEntity.ok(productoService.getStockBajo(umbral));
    }
}

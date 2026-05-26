package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.SolicitarFacturaRequest;
import com.tribu.api_tribu.dto.request.ActualizarDatosFacturaRequest;
import com.tribu.api_tribu.model.FacturaElectronica;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.service.FacturaService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.List;

@RestController
@RequestMapping("/api/facturas")
@RequiredArgsConstructor
public class FacturaController {

    private final FacturaService facturaService;
    private final UsuarioRepository usuarioRepo;

    @PostMapping("/solicitar")
    public ResponseEntity<FacturaElectronica> solicitar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody SolicitarFacturaRequest request) {
        
        Usuario usuario = usuarioRepo.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        return ResponseEntity.ok(facturaService.generarFactura(request, usuario.getId()));
    }

    @PostMapping("/pedido/{pedidoId}/datos")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacturaElectronica> completarDatosFactura(
            @PathVariable Long pedidoId,
            @RequestBody ActualizarDatosFacturaRequest request) {
        return ResponseEntity.ok(
                facturaService.completarDatosYEmitir(pedidoId, request.getNit(), request.getRazonSocial()));
    }

    @PatchMapping("/admin/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacturaElectronica> actualizarDatosFactura(
            @PathVariable Long id,
            @RequestBody ActualizarDatosFacturaRequest request) {
        return ResponseEntity.ok(
                facturaService.actualizarDatosFactura(id, request.getNit(), request.getRazonSocial()));
    }

    @GetMapping("/mis-facturas")
    public ResponseEntity<List<FacturaElectronica>> getMisFacturas(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Usuario usuario = usuarioRepo.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        return ResponseEntity.ok(facturaService.getMisFacturas(usuario.getId()));
    }

    @GetMapping("/pedido/{pedidoId}")
    public ResponseEntity<FacturaElectronica> getFacturaPorPedido(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long pedidoId) {
        
        Usuario usuario = usuarioRepo.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        FacturaElectronica factura = facturaService.getFacturaPorPedido(pedidoId);
        
        if (factura == null || !factura.getUsuario().getId().equals(usuario.getId())) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(factura);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<Resource> descargarPdf(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        
        Usuario usuario = usuarioRepo.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        List<FacturaElectronica> facturas = facturaService.getMisFacturas(usuario.getId());
        FacturaElectronica factura = facturas.stream()
                .filter(f -> f.getId().equals(id))
                .findFirst()
                .orElse(null);

        if (factura == null) {
            return ResponseEntity.notFound().build();
        }

        if (factura.getPdfUrl() == null) {
            return ResponseEntity.notFound().build();
        }

        File file = new File(factura.getPdfUrl());
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }

    @GetMapping("/admin/todas")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FacturaElectronica>> listarTodas() {
        return ResponseEntity.ok(facturaService.listarTodas());
    }
}

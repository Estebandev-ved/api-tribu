package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.ActualizarEstadoPedidoRequest;
import com.tribu.api_tribu.dto.request.CrmNotaRequest;
import com.tribu.api_tribu.dto.response.CrmNotaResponse;
import com.tribu.api_tribu.dto.response.PedidoResponse;
import com.tribu.api_tribu.service.CrmNotaService;
import com.tribu.api_tribu.service.PedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final PedidoService pedidoService;
    private final CrmNotaService crmNotaService;

    // ——— Gestión de Pedidos (Panel Admin) ———

    @GetMapping("/pedidos")
    public ResponseEntity<List<PedidoResponse>> getAllPedidos() {
        return ResponseEntity.ok(pedidoService.getAllPedidos());
    }

    @GetMapping("/pedidos/estado/{estado}")
    public ResponseEntity<List<PedidoResponse>> getByEstado(@PathVariable String estado) {
        return ResponseEntity.ok(pedidoService.getByEstado(estado));
    }

    @PatchMapping("/pedidos/{id}/estado")
    public ResponseEntity<PedidoResponse> actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarEstadoPedidoRequest request) {
        return ResponseEntity.ok(pedidoService.actualizarEstado(id, request));
    }

    // ——— CRM ———

    @GetMapping("/crm/notas")
    public ResponseEntity<List<CrmNotaResponse>> getTodasLasNotas() {
        return ResponseEntity.ok(crmNotaService.getTodasLasNotas());
    }

    @GetMapping("/crm/notas/cliente/{clienteId}")
    public ResponseEntity<List<CrmNotaResponse>> getNotasPorCliente(@PathVariable Long clienteId) {
        return ResponseEntity.ok(crmNotaService.getNotasPorCliente(clienteId));
    }

    @PostMapping("/crm/notas")
    public ResponseEntity<CrmNotaResponse> crearNota(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CrmNotaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(crmNotaService.crearNota(userDetails.getUsername(), request));
    }
}

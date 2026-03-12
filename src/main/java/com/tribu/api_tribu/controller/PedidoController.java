package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.CrearPedidoRequest;
import com.tribu.api_tribu.dto.response.PedidoResponse;
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
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

    // El cliente ve sus propios pedidos
    @GetMapping
    public ResponseEntity<List<PedidoResponse>> getMisPedidos(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(pedidoService.getMisPedidos(userDetails.getUsername()));
    }

    // El cliente crea un pedido
    @PostMapping
    public ResponseEntity<PedidoResponse> crear(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CrearPedidoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pedidoService.crearPedido(userDetails.getUsername(), request));
    }
}

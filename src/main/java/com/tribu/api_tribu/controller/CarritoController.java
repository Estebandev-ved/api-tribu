package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.CarritoItemRequest;
import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.CarritoAbandonado;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.service.CarritoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carrito")
@RequiredArgsConstructor
public class CarritoController {

    private final CarritoService carritoService;
    private final UsuarioRepository usuarioRepository;

    @PutMapping("/actualizar")
    public ResponseEntity<?> actualizarCarrito(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody List<CarritoItemRequest> items) {
        
        String email = userDetails.getUsername();
        Long usuarioId = getUsuarioIdFromEmail(email);
        carritoService.actualizarCarrito(usuarioId, items);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/completar")
    public ResponseEntity<?> completarCarrito(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        Long usuarioId = getUsuarioIdFromEmail(email);
        carritoService.marcarConvertido(usuarioId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/activo")
    public ResponseEntity<?> getCarritoActivo(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        Long usuarioId = getUsuarioIdFromEmail(email);
        CarritoAbandonado carrito = carritoService.getCarritoActivo(usuarioId);
        if (carrito == null) {
            return ResponseEntity.ok().body(null);
        }
        return ResponseEntity.ok(carrito);
    }

    private Long getUsuarioIdFromEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", email))
                .getId();
    }
}
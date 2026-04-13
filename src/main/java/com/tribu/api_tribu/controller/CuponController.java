package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.CuponRequest;
import com.tribu.api_tribu.dto.response.CuponStatsDTO;
import com.tribu.api_tribu.dto.response.CuponValidacionDTO;
import com.tribu.api_tribu.model.Cupon;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.service.CuponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cupones")
@RequiredArgsConstructor
public class CuponController {

    private final CuponService cuponService;
    private final UsuarioRepository usuarioRepo;

    @PostMapping("/validar")
    public ResponseEntity<CuponValidacionDTO> validar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> request) {
        
        Usuario usuario = usuarioRepo.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        String codigo = (String) request.get("codigo");
        Double totalCarrito = ((Number) request.get("totalCarrito")).doubleValue();

        return ResponseEntity.ok(cuponService.validar(codigo, usuario.getId(), totalCarrito));
    }

    @GetMapping("/mis-cupones")
    public ResponseEntity<List<Cupon>> getMisCupones(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(cuponService.listarTodos());
    }
}

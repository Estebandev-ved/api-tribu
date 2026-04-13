package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.response.ProductoRecomendadoDTO;
import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.service.RecomendacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RecomendacionController {

    private final RecomendacionService recomendacionService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping("/recomendaciones")
    public ResponseEntity<List<ProductoRecomendadoDTO>> getRecomendaciones(
            @RequestParam(defaultValue = "8") int limite,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long usuarioId = getUsuarioId(userDetails.getUsername());
        return ResponseEntity.ok(recomendacionService.getRecomendaciones(usuarioId, limite));
    }

    private Long getUsuarioId(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", email))
                .getId();
    }
}
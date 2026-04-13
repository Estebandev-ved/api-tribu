package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.response.ReferidoNodoDTO;
import com.tribu.api_tribu.dto.response.ReferidoStatsDTO;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.service.ReferidoTreeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/referidos")
@RequiredArgsConstructor
public class ReferidoController {

    private final ReferidoTreeService referidoTreeService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping("/mi-arbol")
    public ResponseEntity<ReferidoNodoDTO> getMiArbol(
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        
        return ResponseEntity.ok(referidoTreeService.construirArbol(usuario.getId()));
    }

    @GetMapping("/stats")
    public ResponseEntity<ReferidoStatsDTO> getStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        
        return ResponseEntity.ok(referidoTreeService.getStats(usuario.getId()));
    }

    @GetMapping("/mis-referidos")
    public ResponseEntity<List<ReferidoNodoDTO>> getMisReferidos(
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        
        return ResponseEntity.ok(referidoTreeService.getMisReferidos(usuario.getId()));
    }
}

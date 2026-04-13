package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.response.LeaderboardEntryDTO;
import com.tribu.api_tribu.model.LeaderboardSnapshot;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping("/mes-actual")
    public ResponseEntity<List<LeaderboardEntryDTO>> getTopMes(
            @RequestParam(defaultValue = "10") int limite) {
        return ResponseEntity.ok(leaderboardService.getTopMes(limite));
    }

    @GetMapping("/mi-posicion")
    public ResponseEntity<LeaderboardEntryDTO> getMiPosicion(
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        
        LeaderboardEntryDTO posicion = leaderboardService.getMiPosicion(usuario.getId());
        if (posicion == null) {
            return ResponseEntity.ok(LeaderboardEntryDTO.builder()
                .posicion(null)
                .usuarioId(usuario.getId())
                .nombre(usuario.getNombreCompleto())
                .totalCompras(0.0)
                .tier("SIN_TIER")
                .rachaActual(0)
                .build());
        }
        return ResponseEntity.ok(posicion);
    }

    @GetMapping("/historico")
    public ResponseEntity<List<LeaderboardSnapshot>> getHistorico(
            @RequestParam String mes) {
        return ResponseEntity.ok(leaderboardService.getHistorico(mes));
    }
}

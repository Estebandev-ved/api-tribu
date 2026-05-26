package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.CanjeRecompensaRequest;
import com.tribu.api_tribu.dto.response.CanjeRecompensaResponse;
import com.tribu.api_tribu.dto.response.RecompensaDTO;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.service.CanjeRecompensaService;
import com.tribu.api_tribu.service.RecompensaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recompensas")
public class RecompensaController {

    private final RecompensaService recompensaService;
    private final CanjeRecompensaService canjeRecompensaService;
    private final UsuarioRepository usuarioRepository;

    public RecompensaController(
            RecompensaService recompensaService,
            CanjeRecompensaService canjeRecompensaService,
            UsuarioRepository usuarioRepository) {
        this.recompensaService = recompensaService;
        this.canjeRecompensaService = canjeRecompensaService;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping
    public ResponseEntity<List<RecompensaDTO>> listarActivas() {
        return ResponseEntity.ok(recompensaService.listarActivas());
    }

    @PostMapping("/canjear")
    public ResponseEntity<CanjeRecompensaResponse> canjear(@RequestBody CanjeRecompensaRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        CanjeRecompensaResponse response = canjeRecompensaService.canjear(usuario.getId(), request.getRecompensaId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/mis-canjes")
    public ResponseEntity<List<CanjeRecompensaResponse>> misCanjes() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        return ResponseEntity.ok(canjeRecompensaService.historial(usuario.getId()));
    }
}

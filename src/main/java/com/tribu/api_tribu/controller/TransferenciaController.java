package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.TransferenciaRequest;
import com.tribu.api_tribu.dto.response.LimiteDiarioResponse;
import com.tribu.api_tribu.dto.response.TransferenciaResponse;
import com.tribu.api_tribu.dto.response.ValidarDestinatarioResponse;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.service.SaldoService;
import com.tribu.api_tribu.service.TransferenciaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transferencias")
@RequiredArgsConstructor
public class TransferenciaController {

    private final TransferenciaService transferenciaService;
    private final UsuarioRepository usuarioRepo;
    private final SaldoService saldoService;

    @PostMapping("/enviar")
    public ResponseEntity<TransferenciaResponse> enviar(@RequestBody TransferenciaRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        
        var transferencia = transferenciaService.transferir(
                email,
                request.getDestinatario(),
                request.getMonto(),
                request.getMensaje()
        );

        Usuario emisor = usuarioRepo.findByEmail(email).orElseThrow();
        double nuevoSaldo = saldoService.consultarSaldoReal(emisor.getId());

        TransferenciaResponse response = TransferenciaResponse.builder()
                .referencia(transferencia.getReferenciaUnica())
                .tipoParticipante("EMISOR")
                .monto(transferencia.getMonto())
                .contraparte(transferencia.getReceptor().getNombreCompleto())
                .mensaje(transferencia.getMensaje())
                .estado(transferencia.getEstado().name())
                .fecha(transferencia.getFechaCompletada())
                .nuevoSaldo(nuevoSaldo)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/historial")
    public ResponseEntity<List<TransferenciaResponse>> historial() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepo.findByEmail(email).orElseThrow();
        
        List<TransferenciaResponse> historial = transferenciaService.getHistorial(usuario.getId());
        return ResponseEntity.ok(historial);
    }

    @GetMapping("/limite-disponible")
    public ResponseEntity<LimiteDiarioResponse> limiteDisponible() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepo.findByEmail(email).orElseThrow();
        
        LimiteDiarioResponse response = transferenciaService.getLimiteDiario(usuario.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/validar-destinatario")
    public ResponseEntity<ValidarDestinatarioResponse> validarDestinatario(@RequestBody TransferenciaRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepo.findByEmail(email).orElseThrow();
        
        ValidarDestinatarioResponse response = transferenciaService.validarDestinatario(
                request.getDestinatario(), 
                usuario.getId()
        );
        return ResponseEntity.ok(response);
    }
}

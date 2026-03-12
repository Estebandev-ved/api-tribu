package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.MovimientoSaldo;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.MovimientoSaldoRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/usuarios/ruleta")
@RequiredArgsConstructor
public class RuletaController {

    private final UsuarioRepository usuarioRepository;
    private final MovimientoSaldoRepository movimientoSaldoRepository;
    private final Random random = new Random();

    private Usuario obtenerUsuarioAutenticado() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", email));
    }

    @PostMapping("/girar")
    @Transactional
    public ResponseEntity<Map<String, Object>> girarRuleta() {
        Usuario usuario = obtenerUsuarioAutenticado();

        LocalDateTime ultimoGiro = usuario.getFechaUltimoGiroRuleta();
        if (ultimoGiro != null && ultimoGiro.toLocalDate().isEqual(LocalDate.now())) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("mensaje", "Ya has girado la ruleta hoy. Vuelve mañana.");
            return ResponseEntity.badRequest().body(error);
        }

        double premio = calcularPremioAleatorio();

        usuario.setFechaUltimoGiroRuleta(LocalDateTime.now());
        if (premio > 0) {
            usuario.setSaldoFavor(usuario.getSaldoFavor() + premio);
            MovimientoSaldo movimiento = MovimientoSaldo.builder()
                    .usuario(usuario)
                    .monto(premio)
                    .tipo("PREMIO_RULETA")
                    .descripcion("Premio ganado en la Ruleta Tribu Diaria.")
                    .build();
            movimientoSaldoRepository.save(movimiento);
        }

        usuarioRepository.save(usuario);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("premio", premio);
        result.put("nuevoSaldo", usuario.getSaldoFavor());
        return ResponseEntity.ok(result);
    }

    private double calcularPremioAleatorio() {
        int r = random.nextInt(100);
        if (r < 40)
            return 0.0; // 40% chance of 0
        if (r < 70)
            return 1000.0; // 30% chance of 1.000
        if (r < 85)
            return 2000.0; // 15% chance of 2.000
        if (r < 95)
            return 5000.0; // 10% chance of 5.000
        return 10000.0; // 5% chance of 10.000
    }
}

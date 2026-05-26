package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.model.MovimientoSaldo;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.repository.MovimientoSaldoRepository;
import com.tribu.api_tribu.repository.PedidoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/usuarios/perfil")
public class UsuarioPerfilController {

    private final UsuarioRepository usuarioRepository;
    private final MovimientoSaldoRepository movimientoSaldoRepository;
    private final PedidoRepository pedidoRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioPerfilController(
            UsuarioRepository usuarioRepository,
            MovimientoSaldoRepository movimientoSaldoRepository,
            PedidoRepository pedidoRepository,
            PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.movimientoSaldoRepository = movimientoSaldoRepository;
        this.pedidoRepository = pedidoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private Usuario obtenerUsuarioAutenticado() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", email));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getMiPerfil() {
        Usuario u = obtenerUsuarioAutenticado();

        if (u.getCodigoReferido() == null || u.getCodigoReferido().isBlank()) {
            String newCode = "TRIBU-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
            u.setCodigoReferido(newCode);
            usuarioRepository.save(u);
        }

        java.time.YearMonth mesActual = java.time.YearMonth.now();
        java.time.LocalDateTime inicio = mesActual.atDay(1).atStartOfDay();
        java.time.LocalDateTime fin = mesActual.atEndOfMonth().atTime(23, 59, 59);
        Double gastadoMes = pedidoRepository.calculateTotalValidoTierEnPeriodo(u.getId(), inicio, fin);

        Map<String, Object> m = new HashMap<>();
        m.put("id", u.getId());
        m.put("nombreCompleto", u.getNombreCompleto());
        m.put("email", u.getEmail());
        m.put("telefono", u.getTelefono() != null ? u.getTelefono() : "");
        m.put("direccion", u.getDireccion() != null ? u.getDireccion() : "");
        
        Double saldoReal = movimientoSaldoRepository.calcularSaldoReal(u.getId());
        m.put("saldoFavor", saldoReal != null ? saldoReal : 0.0);
        m.put("fechaUltimoGiroRuleta", u.getFechaUltimoGiroRuleta());
        m.put("nivelVip", u.getNivelVip() != null ? u.getNivelVip() : 1);
        m.put("gastadoMes", gastadoMes != null ? gastadoMes : 0.0);
        
        String tierName = u.getTierActual() != null ? u.getTierActual().getNombre() : 
                        (u.getNivelVip() == 3 ? "ORO" : u.getNivelVip() == 2 ? "PLATA" : "BRONCE");
        m.put("tier", tierName);
        m.put("codigoReferido", u.getCodigoReferido());
        m.put("tienePin", u.getPinSeguridadHash() != null && !u.getPinSeguridadHash().isBlank());

        return ResponseEntity.ok(m);
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> actualizarMiPerfil(@RequestBody Map<String, String> payload) {
        Usuario u = obtenerUsuarioAutenticado();

        if (payload.containsKey("nombreCompleto")) {
            u.setNombreCompleto(payload.get("nombreCompleto"));
        }
        if (payload.containsKey("telefono")) {
            u.setTelefono(payload.get("telefono"));
        }
        if (payload.containsKey("direccion")) {
            u.setDireccion(payload.get("direccion"));
        }

        usuarioRepository.save(u);

        Map<String, Object> m = new HashMap<>();
        m.put("mensaje", "Perfil actualizado correctamente");
        m.put("nombreCompleto", u.getNombreCompleto());
        m.put("telefono", u.getTelefono() != null ? u.getTelefono() : "");
        m.put("direccion", u.getDireccion() != null ? u.getDireccion() : "");

        return ResponseEntity.ok(m);
    }

    @GetMapping("/movimientos")
    public ResponseEntity<List<MovimientoSaldo>> getMisMovimientos() {
        Usuario u = obtenerUsuarioAutenticado();
        List<MovimientoSaldo> movimientos = movimientoSaldoRepository.findByUsuarioIdOrderByFechaDesc(u.getId());
        return ResponseEntity.ok(movimientos);
    }

    @PostMapping("/pin")
    public ResponseEntity<Map<String, Object>> setPin(@RequestBody Map<String, String> payload) {
        Usuario u = obtenerUsuarioAutenticado();
        String pinActual = payload.get("pinActual");
        String pinNuevo = payload.get("pinNuevo");

        if (pinNuevo == null || pinNuevo.length() < 4 || pinNuevo.length() > 6) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("mensaje", "El PIN debe tener entre 4 y 6 digitos");
            return ResponseEntity.badRequest().body(error);
        }

        // Si ya tiene PIN, requiere el actual para cambiarlo
        if (u.getPinSeguridadHash() != null && !u.getPinSeguridadHash().isBlank()) {
            if (pinActual == null || !passwordEncoder.matches(pinActual, u.getPinSeguridadHash())) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("mensaje", "PIN actual incorrecto");
                return ResponseEntity.badRequest().body(error);
            }
        }

        u.setPinSeguridadHash(passwordEncoder.encode(pinNuevo));
        usuarioRepository.save(u);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("mensaje", "PIN configurado correctamente");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verificar-pin")
    public ResponseEntity<Map<String, Object>> verificarPin(@RequestBody Map<String, String> payload) {
        Usuario u = obtenerUsuarioAutenticado();
        String pin = payload.get("pin");

        Map<String, Object> response = new HashMap<>();

        if (u.getPinSeguridadHash() == null || u.getPinSeguridadHash().isBlank()) {
            response.put("success", false);
            response.put("mensaje", "PIN no configurado");
            return ResponseEntity.badRequest().body(response);
        }

        if (pin == null || !passwordEncoder.matches(pin, u.getPinSeguridadHash())) {
            response.put("success", false);
            response.put("mensaje", "PIN incorrecto");
            return ResponseEntity.badRequest().body(response);
        }

        response.put("success", true);
        response.put("mensaje", "PIN verificado correctamente");
        return ResponseEntity.ok(response);
    }
}

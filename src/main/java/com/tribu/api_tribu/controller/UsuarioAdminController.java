package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.Rol;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.RolRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/usuarios")
@RequiredArgsConstructor
public class UsuarioAdminController {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;

    // Listar todos los usuarios
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        List<Map<String, Object>> usuarios = usuarioRepository.findAll().stream()
                .map(u -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", u.getId());
                    m.put("nombreCompleto", u.getNombreCompleto());
                    m.put("email", u.getEmail());
                    m.put("telefono", u.getTelefono() != null ? u.getTelefono() : "");
                    m.put("rol", u.getRol() != null ? u.getRol().getNombre() : "SIN_ROL");
                    m.put("saldoFavor", u.getSaldoFavor());
                    return m;
                })
                .toList();
        return ResponseEntity.ok(usuarios);
    }

    // Promover usuario a ADMIN
    @PatchMapping("/{id}/promover-admin")
    public ResponseEntity<Map<String, Object>> promoverAAdmin(@PathVariable Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id", id));

        Rol rolAdmin = rolRepository.findByNombre("ADMIN")
                .orElseThrow(() -> new ResourceNotFoundException("Rol", "nombre", "ADMIN"));

        usuario.setRol(rolAdmin);
        usuarioRepository.save(usuario);

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("mensaje", "Usuario promovido a ADMIN exitosamente");
        respuesta.put("id", usuario.getId());
        respuesta.put("email", usuario.getEmail());
        respuesta.put("rol", "ADMIN");
        return ResponseEntity.ok(respuesta);
    }

    // Cambiar a rol CLIENTE
    @PatchMapping("/{id}/asignar-cliente")
    public ResponseEntity<Map<String, Object>> asignarCliente(@PathVariable Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id", id));

        Rol rolCliente = rolRepository.findByNombre("CLIENTE")
                .orElseThrow(() -> new ResourceNotFoundException("Rol", "nombre", "CLIENTE"));

        usuario.setRol(rolCliente);
        usuarioRepository.save(usuario);

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("mensaje", "Rol actualizado a CLIENTE");
        respuesta.put("id", usuario.getId());
        respuesta.put("email", usuario.getEmail());
        respuesta.put("rol", "CLIENTE");
        return ResponseEntity.ok(respuesta);
    }
}

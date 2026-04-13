package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.model.RegistroAcceso;
import com.tribu.api_tribu.repository.RegistroAccesoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/seguridad")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSecurityController {

    private final RegistroAccesoRepository registroAccesoRepo;

    /**
     * Devuelve los últimos 100 intentos de inicio de sesión
     */
    @GetMapping("/accesos")
    public ResponseEntity<List<RegistroAcceso>> getUltimosAccesos() {
        // En una app real usaríamos Paginación, pero para prototipo rápido listamos los últimos 100
        List<RegistroAcceso> accesos = registroAccesoRepo.findAll(Sort.by(Sort.Direction.DESC, "fecha"))
                .stream().limit(100).collect(Collectors.toList());
        return ResponseEntity.ok(accesos);
    }
}

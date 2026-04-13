package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.DevolucionRequest;
import com.tribu.api_tribu.dto.response.DevolucionResponse;
import com.tribu.api_tribu.service.DevolucionService;
import com.tribu.api_tribu.model.Devolucion;
import com.tribu.api_tribu.repository.DevolucionRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/devoluciones")
@RequiredArgsConstructor
public class DevolucionPublicController {

    private final DevolucionService devolucionService;
    private final DevolucionRepository devolucionRepository;

    /**
     * Obtiene las devoluciones del usuario autenticado por su email.
     * Seguridad: Solo retorna las devoluciones que coinciden con el email del usuario logueado.
     */
    @GetMapping("/mis-devoluciones")
    public ResponseEntity<List<Devolucion>> getMisDevoluciones(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<Devolucion> devoluciones = devolucionRepository
                .findByEmailOrderByFechaSolicitudDesc(userDetails.getUsername());
        return ResponseEntity.ok(devoluciones);
    }

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<DevolucionResponse> crearDevolucion(
            @RequestPart("data") @Valid DevolucionRequest request,
            @RequestPart(value = "evidencia", required = false) MultipartFile evidencia) {
        return ResponseEntity.status(HttpStatus.CREATED).body(devolucionService.crearDevolucion(request, evidencia));
    }
}

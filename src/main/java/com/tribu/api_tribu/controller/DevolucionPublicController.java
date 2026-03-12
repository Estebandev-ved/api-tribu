package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.request.DevolucionRequest;
import com.tribu.api_tribu.dto.response.DevolucionResponse;
import com.tribu.api_tribu.service.DevolucionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/devoluciones")
@RequiredArgsConstructor
public class DevolucionPublicController {

    private final DevolucionService devolucionService;

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<DevolucionResponse> crearDevolucion(
            @RequestPart("data") @Valid DevolucionRequest request,
            @RequestPart(value = "evidencia", required = false) MultipartFile evidencia) {
        return ResponseEntity.status(HttpStatus.CREATED).body(devolucionService.crearDevolucion(request, evidencia));
    }
}

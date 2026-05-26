package com.tribu.api_tribu.controller;

import com.tribu.api_tribu.dto.response.TransferenciaAdminDTO;
import com.tribu.api_tribu.model.TransferenciaP2P;
import com.tribu.api_tribu.repository.TransferenciaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/transferencias")
public class AdminTransferenciasController {

    private final TransferenciaRepository transferenciaRepository;

    public AdminTransferenciasController(TransferenciaRepository transferenciaRepository) {
        this.transferenciaRepository = transferenciaRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) TransferenciaP2P.EstadoTransferencia estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        String query = (q != null && !q.trim().isEmpty()) ? q.trim() : null;
        int safeSize = Math.min(Math.max(size, 5), 200);
        int safePage = Math.max(page, 0);

        PageRequest pr = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "fechaCreacion"));
        Page<TransferenciaAdminDTO> result = transferenciaRepository.buscarAdmin(query, estado, pr);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("items", result.getContent());
        body.put("page", result.getNumber());
        body.put("size", result.getSize());
        body.put("totalElements", result.getTotalElements());
        body.put("totalPages", result.getTotalPages());
        return ResponseEntity.ok(body);
    }
}

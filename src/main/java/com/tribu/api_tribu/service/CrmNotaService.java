package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.request.CrmNotaRequest;
import com.tribu.api_tribu.dto.response.CrmNotaResponse;
import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.CrmNota;
import com.tribu.api_tribu.model.NotificacionEvent;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.CrmNotaRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CrmNotaService {

        private final CrmNotaRepository crmNotaRepository;
        private final UsuarioRepository usuarioRepository;
        private final ApplicationEventPublisher eventPublisher;

        public CrmNotaResponse crearNota(String emailAdmin, CrmNotaRequest request) {
                Usuario admin = usuarioRepository.findByEmail(emailAdmin)
                                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", emailAdmin));

                Usuario cliente = usuarioRepository.findById(request.getClienteId())
                                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id",
                                                request.getClienteId()));

                CrmNota nota = new CrmNota();
                nota.setContenido(request.getContenido());
                nota.setCreadoPor(admin);
                nota.setCliente(cliente);

                CrmNota notaGuardada = crmNotaRepository.save(nota);
                enviarNotificacionNota(notaGuardada);

                return toResponse(notaGuardada);
        }

        public List<CrmNotaResponse> getNotasPorCliente(Long clienteId) {
                Usuario cliente = usuarioRepository.findById(clienteId)
                                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", clienteId));
                return crmNotaRepository.findByClienteOrderByFechaCreacionDesc(cliente).stream()
                                .map(this::toResponse).collect(Collectors.toList());
        }

        public List<CrmNotaResponse> getTodasLasNotas() {
                return crmNotaRepository.findAllByOrderByFechaCreacionDesc().stream()
                                .map(this::toResponse).collect(Collectors.toList());
        }

        private void enviarNotificacionNota(CrmNota nota) {
                NotificacionEvent event = new NotificacionEvent(
                                "NOTA",
                                "Nueva nota agregada",
                                "Se ha agregado una nueva nota al cliente " + nota.getCliente().getNombreCompleto(),
                                nota.getCliente().getId().toString());
                eventPublisher.publishEvent(event);
        }

        // ——— Helper ———

        private CrmNotaResponse toResponse(CrmNota n) {
                return CrmNotaResponse.builder()
                                .id(n.getId())
                                .contenido(n.getContenido())
                                .fechaCreacion(n.getFechaCreacion())
                                .adminNombre(n.getCreadoPor().getNombreCompleto())
                                .adminEmail(n.getCreadoPor().getEmail())
                                .clienteId(n.getCliente().getId())
                                .clienteNombre(n.getCliente().getNombreCompleto())
                                .clienteEmail(n.getCliente().getEmail())
                                .build();
        }
}

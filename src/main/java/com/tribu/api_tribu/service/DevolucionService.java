package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.request.ActualizarEstadoDevolucionRequest;
import com.tribu.api_tribu.dto.request.DevolucionRequest;
import com.tribu.api_tribu.dto.response.DevolucionResponse;
import com.tribu.api_tribu.model.Devolucion;
import com.tribu.api_tribu.repository.DevolucionRepository;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.model.MovimientoSaldo;
import com.tribu.api_tribu.model.NotificacionEvent;
import com.tribu.api_tribu.repository.MovimientoSaldoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.context.ApplicationEventPublisher;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DevolucionService {

    private final DevolucionRepository devolucionRepository;
    private final UsuarioRepository usuarioRepository;
    private final MovimientoSaldoRepository movimientoSaldoRepository;
    private final EmailService emailService;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    public Map<String, Object> getEstadisticasDevoluciones() {
        List<Devolucion> todas = devolucionRepository.findAll();
        long pendientes = todas.stream().filter(d -> "PENDIENTE".equals(d.getEstado())).count();
        long aprobadas = todas.stream().filter(d -> "APROBADA".equals(d.getEstado())).count();
        long rechazadas = todas.stream().filter(d -> "RECHAZADA".equals(d.getEstado())).count();
        long completadas = todas.stream().filter(d -> "COMPLETADA".equals(d.getEstado())).count();

        Map<String, Long> motivos = todas.stream()
                .collect(Collectors.groupingBy(Devolucion::getReason, Collectors.counting()));

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", (long) todas.size());
        stats.put("pendientes", pendientes);
        stats.put("aprobadas", aprobadas);
        stats.put("rechazadas", rechazadas);
        stats.put("completadas", completadas);
        stats.put("motivos", motivos);
        return stats;
    }

    @Transactional
    public DevolucionResponse crearDevolucion(DevolucionRequest request, MultipartFile evidencia) {
        String evidenciaUrl = null;

        if (evidencia != null && !evidencia.isEmpty()) {
            try {
                Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
                Files.createDirectories(uploadPath);

                String extension = getExtension(evidencia.getOriginalFilename());
                String nombreArchivo = UUID.randomUUID().toString() + extension;
                Path destino = uploadPath.resolve(nombreArchivo);

                Files.copy(evidencia.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);
                evidenciaUrl = "/uploads/" + nombreArchivo;
            } catch (IOException e) {
                throw new RuntimeException("Error al guardar la evidencia", e);
            }
        }

        Devolucion devolucion = Devolucion.builder()
                .orderNumber(request.getOrderNumber())
                .email(request.getEmail())
                .reason(request.getReason())
                .estado("PENDIENTE")
                .evidenciaUrl(evidenciaUrl)
                .fechaSolicitud(LocalDateTime.now())
                .build();

        Devolucion guardada = devolucionRepository.save(devolucion);

        // Enviar email de confirmación
        emailService.enviarConfirmacionDevolucion(guardada.getEmail(), guardada.getId(), guardada.getOrderNumber());

        return mapToResponse(guardada);
    }

    @Transactional(readOnly = true)
    public List<DevolucionResponse> getAllDevoluciones() {
        return devolucionRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DevolucionResponse actualizarEstado(Long id, ActualizarEstadoDevolucionRequest request) {
        Devolucion devolucion = devolucionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Devolución no encontrada"));

        String estadoAntiguo = devolucion.getEstado();
        devolucion.setEstado(request.getEstado().toUpperCase());
        Devolucion actualizada = devolucionRepository.save(devolucion);

        // Si el estado cambió, enviar correo al cliente
        if (!estadoAntiguo.equals(actualizada.getEstado())) {
            emailService.enviarCambioEstadoDevolucion(
                    actualizada.getEmail(),
                    actualizada.getId(),
                    actualizada.getOrderNumber(),
                    actualizada.getEstado());
        }

        return mapToResponse(actualizada);
    }

    @Transactional
    public void reembolsarSaldo(Long id, Double monto) {
        Devolucion devolucion = devolucionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Devolución no encontrada"));

        Usuario usuario = usuarioRepository.findByEmail(devolucion.getEmail())
                .orElseThrow(() -> new RuntimeException(
                        "No se encontró usuario registrado con el correo: " + devolucion.getEmail()));

        usuario.setSaldoFavor(usuario.getSaldoFavor() + monto);
        usuarioRepository.save(usuario);

        MovimientoSaldo movimiento = MovimientoSaldo.builder()
                .usuario(usuario)
                .monto(monto)
                .tipo("REEMBOLSO")
                .descripcion("Reembolso por devolución aprobada de la orden: " + devolucion.getOrderNumber())
                .build();

        NotificacionEvent event = new NotificacionEvent(
                "DEVOLUCION",
                "Devolución aprobada",
                "La devolución de la orden " + devolucion.getOrderNumber() + " ha sido aprobada.",
                usuario.getId().toString());
        eventPublisher.publishEvent(event);

        movimientoSaldoRepository.save(movimiento);

        // Update devolucion status automatically
        devolucion.setEstado("COMPLETADA");
        devolucionRepository.save(devolucion);

        // Notify client
        emailService.enviarCambioEstadoDevolucion(
                devolucion.getEmail(),
                devolucion.getId(),
                devolucion.getOrderNumber(),
                devolucion.getEstado());
    }

    private DevolucionResponse mapToResponse(Devolucion devolucion) {
        return DevolucionResponse.builder()
                .id(devolucion.getId())
                .orderNumber(devolucion.getOrderNumber())
                .email(devolucion.getEmail())
                .reason(devolucion.getReason())
                .estado(devolucion.getEstado())
                .evidenciaUrl(devolucion.getEvidenciaUrl())
                .fechaSolicitud(devolucion.getFechaSolicitud())
                .build();
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains("."))
            return ".jpg";
        return filename.substring(filename.lastIndexOf('.'));
    }
}

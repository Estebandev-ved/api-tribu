package com.tribu.api_tribu.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/admin/imagenes")
public class ImagenController {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final java.util.Set<String> ALLOWED_TYPES = java.util.Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif");

    @PostMapping
    public ResponseEntity<Map<String, String>> subirImagen(
            @RequestParam("archivo") MultipartFile archivo) throws IOException {

        // Validaciones
        if (archivo.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El archivo está vacío"));
        }
        if (!ALLOWED_TYPES.contains(archivo.getContentType())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Solo se permiten JPEG, PNG, WebP o GIF"));
        }
        if (archivo.getSize() > MAX_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("error", "El archivo supera el límite de 5 MB"));
        }

        // Crear carpeta si no existe
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        Files.createDirectories(uploadPath);

        // Nombre único para evitar colisiones
        String extension = getExtension(archivo.getOriginalFilename());
        String nombreArchivo = UUID.randomUUID().toString() + extension;
        Path destino = uploadPath.resolve(nombreArchivo);

        Files.copy(archivo.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);
        log.info("📸 Imagen subida: {}", destino);

        // URL pública accesible por el frontend
        String url = "/uploads/" + nombreArchivo;
        return ResponseEntity.ok(Map.of("url", url, "nombre", nombreArchivo));
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains("."))
            return ".jpg";
        return filename.substring(filename.lastIndexOf('.'));
    }
}

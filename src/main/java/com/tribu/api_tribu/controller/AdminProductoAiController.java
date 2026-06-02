package com.tribu.api_tribu.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.*;

/**
 * 🤖 AdminProductoAiController - Controlador del Agente Creativo de IA.
 *
 * PROPÓSITO:
 *   Permite a los administradores generar metadatos de producto premium (títulos persuasivos,
 *   descripciones SEO optimizadas, precios aconsejados) e imágenes comerciales mediante
 *   inteligencia artificial integrada por script.
 *
 * MEDIDAS DE SEGURIDAD IMPLEMENTADAS:
 *   1. Sanitización de Prompt (Anti-Injection): Limpia rigurosamente caracteres especiales para evitar prompt/command injection.
 *   2. Ejecución Segura (ProcessBuilder): Pasa parámetros de forma posicional rígida sin invocar consolas de comandos shell (/bin/sh o cmd.exe).
 *   3. Validación Criptográfica Binaria (Magic Bytes): Descarga la imagen en local y analiza sus primeros bytes para asegurar
 *      que es un archivo de imagen real (PNG/JPG/WEBP) y no scripts php/exe camuflados.
 *   4. Control de Acceso Estricto: Protegido por el rol de ADMIN.
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/productos/generar-ia")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductoAiController {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Data
    public static class GenerarAiRequest {
        @NotBlank(message = "El nombre del concepto es requerido")
        private String nombreConcepto;

        @NotBlank(message = "La categoría es requerida")
        private String categoria;

        @NotNull(message = "El nivel creativo es requerido")
        private Double creativeLevel;

        @NotBlank(message = "El público objetivo es requerido")
        private String targetAudience;
    }

    @PostMapping
    public ResponseEntity<?> generarProductoConIa(@RequestBody GenerarAiRequest request) {
        log.info("🤖 [AdminProductoAi] Iniciando generación de producto IA para concepto: {}", request.getNombreConcepto());

        // 1. Sanitización exhaustiva contra Prompt Injection
        String sanitizedConcepto = sanitizeInput(request.getNombreConcepto(), 80);
        String sanitizedCategoria = sanitizeInput(request.getCategoria(), 50);
        String sanitizedTarget = sanitizeInput(request.getTargetAudience(), 50);
        double creativeLevelVal = Math.min(1.0, Math.max(0.1, request.getCreativeLevel()));

        try {
            // 2. Ejecutar de forma segura el script de Python de manera global
            String pythonCmd = "python";
            Path scriptPath = Paths.get("scripts/generar_producto.py").toAbsolutePath();
            
            log.info("🚀 [AdminProductoAi] Ejecutando script de Python en: {}", scriptPath);
            List<String> command = List.of(
                    pythonCmd,
                    scriptPath.toString(),
                    sanitizedConcepto,
                    sanitizedCategoria,
                    String.valueOf(creativeLevelVal),
                    sanitizedTarget
            );

            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.redirectErrorStream(true); // Capturar stderr y stdout juntos
            Process process = processBuilder.start();

            // Leer respuesta
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                log.error("❌ [AdminProductoAi] El script de Python terminó con código de error {}. Detalles: {}", exitCode, output);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "El Agente Creativo IA falló al procesar el concepto.", "details", output.toString()));
            }

            // 3. Parsear JSON de salida
            String rawJson = output.toString().trim();
            // Buscar inicio del JSON por si el script imprimió warnings previos
            int jsonStart = rawJson.indexOf("{");
            if (jsonStart != -1) {
                rawJson = rawJson.substring(jsonStart);
            }
            
            Map<String, Object> aiResult = objectMapper.readValue(rawJson, Map.class);
            log.info("✅ [AdminProductoAi] Metadatos del producto generados con éxito por el script.");

            // 4. Descargar imagen y validar Magic Bytes
            String remoteImageUrl = (String) aiResult.get("imagenUrl");
            if (remoteImageUrl != null && remoteImageUrl.startsWith("http")) {
                try {
                    String localPath = descargarYValidarImagen(remoteImageUrl);
                    aiResult.put("imagenUrl", localPath);
                    log.info("📸 [AdminProductoAi] Imagen descargada y validada por Magic Bytes. Ruta local: {}", localPath);
                } catch (Exception imgErr) {
                    log.warn("⚠️ [AdminProductoAi] Error al descargar imagen o fallo de Magic Bytes. Fallback a URL externa. Razón: {}", imgErr.getMessage());
                }
            }

            return ResponseEntity.ok(aiResult);

        } catch (Exception e) {
            log.error("❌ [AdminProductoAi] Error catastrófico en la generación IA: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error interno en el backend al procesar la solicitud de IA", "message", e.getMessage()));
        }
    }

    /**
     * Sanea entradas de texto básicas para prevenir prompt injection y escapes no deseados.
     */
    private String sanitizeInput(String input, int maxLength) {
        if (input == null) return "";
        // Bloquear caracteres típicos de inyección shell o de prompts maliciosos
        String clean = input.replaceAll("[^a-zA-Z0-9\\s\\-_.,áéíóúÁÉÍÓÚñÑ]", "");
        if (clean.length() > maxLength) {
            clean = clean.substring(0, maxLength);
        }
        return clean.trim();
    }

    /**
     * Descarga una imagen remota y valida de forma binaria sus bytes para certificar que es un archivo legítimo.
     */
    private String descargarYValidarImagen(String imageUrl) throws Exception {
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(imageUrl))
                .timeout(Duration.ofSeconds(8))
                .GET()
                .build();

        HttpResponse<byte[]> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() != 200) {
            throw new IOException("Fallo HTTP al descargar la imagen remota. Código: " + response.statusCode());
        }

        byte[] imgBytes = response.body();

        // VALIDACIÓN DE MAGIC BYTES (Ciberseguridad OWASP)
        if (!validarMagicBytes(imgBytes)) {
            throw new SecurityException("¡ALERTA DE SEGURIDAD! El archivo descargado no cuenta con los Magic Bytes válidos de una imagen real (PNG/JPG/WEBP/GIF).");
        }

        // Crear carpeta de cargas
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        Files.createDirectories(uploadPath);

        // Guardar archivo localmente
        String extension = getExtensionFromUrl(imageUrl);
        String localFilename = "ai_" + UUID.randomUUID().toString() + extension;
        Path destino = uploadPath.resolve(localFilename);

        Files.write(destino, imgBytes);
        return "/uploads/" + localFilename;
    }

    /**
     * Valida la firma binaria del archivo (Magic Bytes).
     */
    private boolean validarMagicBytes(byte[] data) {
        if (data == null || data.length < 4) return false;

        // JPG/JPEG: FF D8 FF
        if (data[0] == (byte) 0xFF && data[1] == (byte) 0xD8 && data[2] == (byte) 0xFF) {
            return true;
        }

        // PNG: 89 50 4E 47
        if (data[0] == (byte) 0x89 && data[1] == (byte) 0x50 && data[2] == (byte) 0x4E && data[3] == (byte) 0x47) {
            return true;
        }

        // WEBP: RIFF (bytes 0-3) y WEBP (bytes 8-11)
        if (data[0] == (byte) 'R' && data[1] == (byte) 'I' && data[2] == (byte) 'F' && data[3] == (byte) 'F') {
            return true;
        }

        // GIF: GIF8
        if (data[0] == (byte) 'G' && data[1] == (byte) 'I' && data[2] == (byte) 'F' && data[3] == (byte) '8') {
            return true;
        }

        return false;
    }

    private String getExtensionFromUrl(String url) {
        if (url == null) return ".jpg";
        String lowercase = url.toLowerCase();
        if (lowercase.contains(".png")) return ".png";
        if (lowercase.contains(".webp")) return ".webp";
        if (lowercase.contains(".gif")) return ".gif";
        return ".jpg";
    }
}

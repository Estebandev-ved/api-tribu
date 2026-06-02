package com.tribu.api_tribu.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 🛡️ RateLimitingFilter - Filtro de Control de Frecuencia de API (Rate Limiting).
 *
 * PROPÓSITO:
 *   Interceptar las peticiones HTTP entrantes a nivel de filtro servlet para aplicar políticas estrictas de limitación
 *   de tasa de uso (Rate Limiting), mitigando ataques de fuerza bruta en logins, denegación de servicio (DoS) a nivel de
 *   aplicación (Capa 7) y abusos automatizados de APIs de transferencias.
 *
 * MEDIDAS DE SEGURIDAD IMPLEMENTADAS:
 *   1. Algoritmo Token Bucket (Bucket4j): Implementa un sistema de cubos de fichas por IP cliente para asegurar que las
 *      peticiones se procesan dentro de rangos normales de operación.
 *   2. Rate Limiting por Segmento Crítico:
 *      - Rutas de Autenticación (Login, 2FA): Máximo 5 peticiones por minuto. Mitiga fuerza bruta de credenciales.
 *      - Rutas de Billetera (Transferencias): Máximo 10 peticiones por minuto. Previene ataques de spam de transacciones.
 *      - Rutas Generales de la API: Máximo 60 peticiones por minuto. Evita raspado (scraping) de productos y DDoS volumétrico.
 *   3. Saneamiento de IP (Reverse Proxy Ready): Inspecciona la cabecera 'X-Forwarded-For' provista por Nginx/Cloudflare
 *      para identificar la dirección IP real del cliente externo, en lugar de bloquear la IP local del reverse proxy (127.0.0.1).
 *   4. Respuesta Segura 429: Cuando un cliente excede su cuota, responde inmediatamente con un código de estado HTTP 429
 *      Too Many Requests y un JSON informativo, finalizando el hilo de ejecución para proteger los recursos de la CPU y la base de datos.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    // Mapa concurrente y thread-safe para almacenar los buckets por IP cliente y tipo de ruta
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    @org.springframework.beans.factory.annotation.Autowired
    private org.redisson.api.RedissonClient redissonClient;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Aplicar rate limiting únicamente a las rutas bajo /api/
        if (path.startsWith("/api/")) {
            String clientIp = getClientIp(request);
            String bucketKey = getBucketKey(clientIp, path);
            Bucket bucket = cache.computeIfAbsent(bucketKey, key -> createNewBucket(path));

            // Si el cliente no tiene tokens suficientes, bloquear la petición
            if (!bucket.tryConsume(1)) {
                sendErrorResponse(response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Identifica el tipo de ruta y asigna límites específicos por cliente.
     */
    private String getBucketKey(String ip, String path) {
        if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/2fa")) {
            return ip + ":AUTH";
        } else if (path.startsWith("/api/transferencias")) {
            return ip + ":TRANSFER";
        }
        return ip + ":DEFAULT";
    }

    /**
     * Crea un cubo de fichas (Bucket) según la criticidad de la ruta solicitada.
     */
    private Bucket createNewBucket(String path) {
        boolean emergency = false;
        try {
            if (redissonClient != null) {
                Object val = redissonClient.getBucket("tribu:security:emergencyRateLimit").get();
                if (val != null) {
                    emergency = Boolean.parseBoolean(val.toString());
                }
            }
        } catch (Exception e) {
            // Silencioso en fallos de conexión a Redis
        }

        if (emergency) {
            // Límite de Blindaje de Emergencia Crítico: 5 peticiones por minuto en TODAS las rutas de API
            return Bucket.builder()
                    .addLimit(Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1))))
                    .build();
        }

        if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/2fa")) {
            // Límite Auth: 5 peticiones por minuto (Recarga de tokens: 5 tokens cada 1 minuto)
            return Bucket.builder()
                    .addLimit(Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1))))
                    .build();
        } else if (path.startsWith("/api/transferencias")) {
            // Límite Transferencias: 10 peticiones por minuto (Recarga de tokens: 10 tokens cada 1 minuto)
            return Bucket.builder()
                    .addLimit(Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1))))
                    .build();
        } else {
            // Límite General: 60 peticiones por minuto (Recarga de tokens: 60 tokens cada 1 minuto)
            return Bucket.builder()
                    .addLimit(Bandwidth.classic(60, Refill.intervally(60, Duration.ofMinutes(1))))
                    .build();
        }
    }

    /**
     * Recupera la IP real del cliente inspeccionando las cabeceras del proxy inverso Nginx/Cloudflare.
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // En caso de múltiples proxies encadenados, el primer valor es la IP real del cliente
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Responde de forma segura con un código HTTP 429 y un JSON explicativo.
     */
    private void sendErrorResponse(HttpServletResponse response) throws IOException {
        response.setStatus(429); // Too Many Requests
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(
                "{" +
                "\"timestamp\": " + System.currentTimeMillis() + "," +
                "\"status\": 429," +
                "\"error\": \"Too Many Requests\"," +
                "\"message\": \"Has excedido el límite seguro de peticiones permitido por Tribu para esta acción. Por favor, espera un momento e intenta nuevamente.\"," +
                "\"security_measure\": \"Rate Limiting (Capa 7) activo para mitigar ataques DDoS y Fuerza Bruta.\"" +
                "}"
        );
    }
}

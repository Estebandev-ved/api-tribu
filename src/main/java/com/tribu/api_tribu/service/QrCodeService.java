package com.tribu.api_tribu.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * 🛡️ QrCodeService - Generador y Validador de Códigos QR Firmados Criptográficamente.
 *
 * MEDIDAS DE CIBERSEGURIDAD:
 *   1. Firma Criptográfica HMAC-SHA256: Protege el QR contra ataques de manipulación de datos (Tampering).
 *      El pagador no puede modificar el monto ni la cuenta de destino ya que alteraría la firma.
 *   2. Prevención de Ataques de Repetición (Replay Attacks): Cada código QR expira automáticamente
 *      15 minutos después de su generación utilizando marcas de tiempo Unix.
 *   3. Prevención de Timing Attacks: Comparación de firmas mediante MessageDigest.isEqual.
 *   4. Saneamiento: El concepto o mensaje se escapa utilizando HtmlUtils para evitar XSS persistente.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QrCodeService {

    @Value("${jwt.secret}")
    private String hmacSecret;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final long EXPIRATION_SECONDS = 900; // 15 Minutos

    /**
     * Genera un código QR firmado en formato Base64 para un cobro.
     * Retorna un Map con la imagen QR en Base64 y los datos de firma originales.
     */
    public Map<String, Object> generarQrCobroBase64(String emailDestinatario, double monto, String mensaje) {
        try {
            long timestamp = Instant.now().getEpochSecond();
            String mensajeSaneado = mensaje != null ? HtmlUtils.htmlEscape(mensaje) : "";

            // 1. Generar la firma HMAC-SHA256
            String payload = emailDestinatario + "|" + monto + "|" + mensajeSaneado + "|" + timestamp;
            String firma = calcularHmac(payload);

            // 2. Encapsular datos en un Map/JSON
            Map<String, Object> data = new HashMap<>();
            data.put("email", emailDestinatario);
            data.put("monto", monto);
            data.put("mensaje", mensajeSaneado);
            data.put("timestamp", timestamp);
            data.put("signature", firma);

            String jsonPayload = objectMapper.writeValueAsString(data);

            // 3. Crear el código QR en Base64
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(jsonPayload, BarcodeFormat.QR_CODE, 350, 350);
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            byte[] pngData = pngOutputStream.toByteArray();

            String qrBase64 = "data:image/png;base64," + Base64.getEncoder().encodeToString(pngData);

            Map<String, Object> result = new HashMap<>();
            result.put("qrBase64", qrBase64);
            result.put("rawPayload", data);
            return result;
        } catch (Exception e) {
            log.error("💥 Error generando QR de cobro firmado: {}", e.getMessage());
            throw new RuntimeException("Error al generar el cobro QR");
        }
    }

    /**
     * Valida la firma HMAC-SHA256 de los datos de un QR y verifica su expiración.
     */
    public boolean validarQrCobro(String email, double monto, String mensaje, long timestamp, String firmaRecibida) {
        try {
            // 1. Verificar expiración (Anti-Replay)
            long ahora = Instant.now().getEpochSecond();
            if (ahora - timestamp > EXPIRATION_SECONDS) {
                log.warn("⚠️ Código QR expirado. Generado hace {} segundos.", ahora - timestamp);
                return false;
            }

            // 2. Re-calcular firma HMAC
            String payload = email + "|" + monto + "|" + (mensaje != null ? mensaje : "") + "|" + timestamp;
            String firmaCalculada = calcularHmac(payload);

            // 3. Comparar firmas usando MessageDigest.isEqual para mitigar ataques de canal lateral/tiempo
            byte[] a = firmaCalculada.getBytes(StandardCharsets.UTF_8);
            byte[] b = firmaRecibida.getBytes(StandardCharsets.UTF_8);

            boolean valida = MessageDigest.isEqual(a, b);
            if (!valida) {
                log.error("🚨 ALERTA DE SEGURIDAD: Intento de uso de QR con firma manipulada para el usuario {}", email);
            }
            return valida;
        } catch (Exception e) {
            log.error("Error validando firma de QR: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Calcula la firma HMAC-SHA256.
     */
    private String calcularHmac(String data) throws Exception {
        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(hmacSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256Hmac.init(secretKey);
        byte[] rawHmac = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(rawHmac);
    }
}

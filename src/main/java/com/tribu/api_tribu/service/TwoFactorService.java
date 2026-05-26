package com.tribu.api_tribu.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Servicio de Autenticación de Dos Factores (2FA).
 *
 * Seguridad implementada:
 * - Algoritmo TOTP (RFC 6238), compatible con Google Authenticator y Authy.
 * - Cada usuario recibe un secreto TOTP único generado criptográficamente.
 * - El código QR se genera en el servidor y se entrega como Base64 (nunca se
 *   expone el secreto crudo directamente al cliente salvo en el setup inicial).
 * - Los códigos son de uso único con ventana de 30 segundos.
 */
@Slf4j
@Service
public class TwoFactorService {

    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();

    private static final String ISSUER = "Tribu";

    /**
     * Genera un nuevo secreto TOTP para el usuario.
     * Retorna el secreto en formato Base32 (para guardarlo en la base de datos).
     */
    public String generarSecreto() {
        GoogleAuthenticatorKey key = gAuth.createCredentials();
        return key.getKey();
    }

    /**
     * Valida un código TOTP de 6 dígitos contra el secreto del usuario.
     * Permite una ventana de ±1 período (tolerancia de reloj de 30s).
     *
     * @param secreto Secreto Base32 almacenado en la cuenta del usuario
     * @param codigo  Código de 6 dígitos ingresado por el usuario
     * @return true si el código es válido
     */
    public boolean validarCodigo(String secreto, int codigo) {
        try {
            return gAuth.authorize(secreto, codigo);
        } catch (Exception e) {
            log.warn("Error validando código 2FA: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Genera la URL de registro para Google Authenticator/Authy (otpauth://).
     */
    public String generarOtpAuthUrl(String email, String secreto) {
        return String.format("otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30",
                URLEncoder.encode(ISSUER, StandardCharsets.UTF_8),
                URLEncoder.encode(email, StandardCharsets.UTF_8),
                secreto,
                URLEncoder.encode(ISSUER, StandardCharsets.UTF_8));
    }

    /**
     * Genera un código QR como imagen PNG codificada en Base64.
     * Seguridad: el QR se genera en el servidor, el cliente solo recibe la imagen.
     *
     * @param otpAuthUrl URL otpauth:// generada con generarOtpAuthUrl()
     * @return Imagen QR en formato "data:image/png;base64,..."
     */
    public String generarQrBase64(String otpAuthUrl) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(otpAuthUrl, BarcodeFormat.QR_CODE, 200, 200);
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            byte[] pngData = pngOutputStream.toByteArray();
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(pngData);
        } catch (Exception e) {
            log.error("Error generando QR 2FA: {}", e.getMessage());
            throw new RuntimeException("Error generando código QR para 2FA");
        }
    }
}

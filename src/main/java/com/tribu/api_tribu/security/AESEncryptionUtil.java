package com.tribu.api_tribu.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
public class AESEncryptionUtil {

    private static final String ALGORITHM = "AES";
    
    // In a real app, this should be 32 bytes for AES-256 and injected via env var.
    @Value("${security.aes.secret:MySuperSecretKeyForAes256Encryption!}")
    private String secretKey;

    public String encrypt(String valueToEnc) throws Exception {
        SecretKeySpec key = new SecretKeySpec(secretKey.substring(0, 32).getBytes(StandardCharsets.UTF_8), ALGORITHM);
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, key);
        byte[] encValue = cipher.doFinal(valueToEnc.getBytes());
        return Base64.getEncoder().encodeToString(encValue);
    }

    public String decrypt(String encryptedValue) throws Exception {
        SecretKeySpec key = new SecretKeySpec(secretKey.substring(0, 32).getBytes(StandardCharsets.UTF_8), ALGORITHM);
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, key);
        byte[] decordedValue = Base64.getDecoder().decode(encryptedValue);
        byte[] decValue = cipher.doFinal(decordedValue);
        return new String(decValue);
    }
}

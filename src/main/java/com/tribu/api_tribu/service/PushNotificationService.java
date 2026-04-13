package com.tribu.api_tribu.service;

import com.tribu.api_tribu.model.PushSuscripcion;
import com.tribu.api_tribu.repository.PushSuscripcionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Base64;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PushNotificationService {

    @Value("${vapid.public.key}")
    private String publicKey;

    @Value("${vapid.private.key}")
    private String privateKey;

    @Value("${vapid.subject}")
    private String subject;

    private final PushSuscripcionRepository suscripcionRepository;

    public void enviarAUsuario(Long usuarioId, String titulo, String cuerpo, String url) {
        List<PushSuscripcion> suscripciones = suscripcionRepository
                .findByUsuarioIdAndActivaTrue(usuarioId);

        suscripciones.forEach(s -> enviarPush(s, titulo, cuerpo, url));
    }

    public void enviarMasivo(List<Long> usuarioIds, String titulo, String cuerpo) {
        usuarioIds.forEach(id -> enviarAUsuario(id, titulo, cuerpo, "/"));
    }

    private void enviarPush(PushSuscripcion suscripcion, String titulo, String cuerpo, String url) {
        try {
            PushService pushService = new PushService(publicKey, privateKey, subject);
            
            String payload = buildPayload(titulo, cuerpo, url);
            
            Notification notification = new Notification(
                    suscripcion.getEndpoint(),
                    suscripcion.getP256dh(),
                    suscripcion.getAuth(),
                    payload
            );

            HttpResponse response = pushService.send(notification);
            int statusCode = response.getStatusLine().getStatusCode();

            if (statusCode == 410 || statusCode == 404) {
                suscripcion.setActiva(false);
                suscripcionRepository.save(suscripcion);
                log.info("Suscripción expirada o inválida marcada como inactiva: {}", suscripcion.getId());
            }
        } catch (GeneralSecurityException | IOException e) {
            log.warn("Error enviando push a suscripción {}: {}", suscripcion.getId(), e.getMessage());
        } catch (Exception e) {
            log.warn("Error enviando push a suscripción {}: {}", suscripcion.getId(), e.getMessage());
        }
    }

    private String buildPayload(String titulo, String cuerpo, String url) {
        return String.format(
                "{\"title\":\"%s\",\"body\":\"%s\",\"url\":\"%s\",\"icon\":\"/icon-192.png\"}",
                titulo, cuerpo, url
        );
    }

    public String getPublicKey() {
        return publicKey;
    }
}

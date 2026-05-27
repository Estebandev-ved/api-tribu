package com.tribu.api_tribu.config;

import com.tribu.api_tribu.websocket.AdminTopicGuardInterceptor;
import com.tribu.api_tribu.websocket.WebSocketJwtChannelInterceptor;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

/**
 * Configura Spring WebSockets con protocolo STOMP.
 *
 * Canales:
 *   - El cliente React se suscribe a: /user/queue/saldo
 *   - El backend emite hacia:         /user/{usuarioId}/queue/saldo
 *
 * En React (usando @stomp/stompjs):
 *   const client = new Client({ brokerURL: 'ws://localhost:8080/ws' });
 *   client.subscribe('/user/queue/saldo', (msg) => {
 *     const data = JSON.parse(msg.body);
 *     // data = { tipo, monto, descripcion, nuevoSaldo }
 *     // → Disparar animación de monedas hacia la Tribu Card
 *   });
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketJwtChannelInterceptor webSocketJwtChannelInterceptor;
    private final AdminTopicGuardInterceptor adminTopicGuardInterceptor;

    public WebSocketConfig(
            WebSocketJwtChannelInterceptor webSocketJwtChannelInterceptor,
            AdminTopicGuardInterceptor adminTopicGuardInterceptor
    ) {
        this.webSocketJwtChannelInterceptor = webSocketJwtChannelInterceptor;
        this.adminTopicGuardInterceptor = adminTopicGuardInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefijo para mensajes que van del cliente al servidor
        registry.setApplicationDestinationPrefixes("/app");

        // Broker en memoria para mensajes server → cliente
        // /topic = broadcast a todos, /queue = mensajes personales
        registry.enableSimpleBroker("/topic", "/queue");

        // Prefijo para mensajes dirigidos a un usuario específico
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketJwtChannelInterceptor, adminTopicGuardInterceptor);
    }
}

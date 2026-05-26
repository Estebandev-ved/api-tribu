package com.tribu.api_tribu.websocket;

import com.tribu.api_tribu.security.JwtUtil;
import com.tribu.api_tribu.repository.UsuarioRepository;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

@Component
public class WebSocketJwtChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final UsuarioRepository usuarioRepository;

    public WebSocketJwtChannelInterceptor(JwtUtil jwtUtil, UserDetailsService userDetailsService, UsuarioRepository usuarioRepository) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null) authHeader = accessor.getFirstNativeHeader("authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String jwt = authHeader.substring(7);
                try {
                    String email = jwtUtil.extractUsername(jwt);
                    if (email != null && !email.isBlank()) {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                        if (jwtUtil.isTokenValid(jwt, userDetails)) {
                            Long usuarioId = null;
                            try {
                                var opt = usuarioRepository.findByEmail(email);
                                if (opt.isPresent()) {
                                    usuarioId = opt.get().getId();
                                }
                            } catch (Exception ignored) {
                                usuarioId = null;
                            }

                            Object principal = (usuarioId != null) ? usuarioId.toString() : userDetails;

                            Authentication auth = new UsernamePasswordAuthenticationToken(
                                    principal,
                                    null,
                                    userDetails.getAuthorities()
                            );
                            accessor.setUser(auth);
                            SecurityContextHolder.getContext().setAuthentication(auth);
                        }
                    }
                } catch (Exception ignored) {
                    // Si falla, se conecta sin auth. Las suscripciones se bloquearan por seguridad de mensajes.
                }
            }
        }
        return message;
    }
}

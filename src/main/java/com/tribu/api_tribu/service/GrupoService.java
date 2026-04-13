package com.tribu.api_tribu.service;

import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.GrupoCompra;
import com.tribu.api_tribu.model.GrupoParticipante;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.GrupoParticipanteRepository;
import com.tribu.api_tribu.repository.GrupoRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GrupoService {

    private final GrupoRepository grupoRepository;
    private final GrupoParticipanteRepository participanteRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public GrupoCompra crearGrupo(String emailOrganizador, String nombre, String emoji, BigDecimal montoTotal) {
        Usuario organizador = usuarioRepository.findByEmail(emailOrganizador)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", emailOrganizador));

        String codigo = generarCodigoUnico();

        GrupoCompra grupo = GrupoCompra.builder()
                .nombre(nombre)
                .emoji(emoji)
                .codigoInvitacion(codigo)
                .montoTotal(montoTotal)
                .organizador(organizador)
                .estado(GrupoCompra.EstadoGrupo.ABIERTO)
                .build();

        GrupoCompra saved = grupoRepository.save(grupo);

        // El organizador es el primer participante
        GrupoParticipante participante = GrupoParticipante.builder()
                .usuario(organizador)
                .grupo(saved)
                .montoAsignado(BigDecimal.ZERO)
                .pagado(false)
                .estado("PENDIENTE")
                .build();
        
        participanteRepository.save(participante);

        return saved;
    }

    @Transactional
    public void unirseAGrupo(String emailUsuario, String codigoInvitacion) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", emailUsuario));

        GrupoCompra grupo = grupoRepository.findByCodigoInvitacion(codigoInvitacion)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo", "codigo", codigoInvitacion));

        if (participanteRepository.existsByGrupoIdAndUsuarioId(grupo.getId(), usuario.getId())) {
            throw new IllegalArgumentException("Ya eres parte de este grupo");
        }

        GrupoParticipante participante = GrupoParticipante.builder()
                .usuario(usuario)
                .grupo(grupo)
                .montoAsignado(BigDecimal.ZERO)
                .pagado(false)
                .estado("PENDIENTE")
                .build();

        participanteRepository.save(participante);
    }

    public List<GrupoCompra> listarMisGrupos(String emailUsuario) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", emailUsuario));

        // Obtener grupos donde el usuario participa
        return participanteRepository.findByUsuarioId(usuario.getId())
                .stream()
                .map(GrupoParticipante::getGrupo)
                .toList();
    }

    private String generarCodigoUnico() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random rnd = new Random();
        String codigo;
        do {
            StringBuilder sb = new StringBuilder("TRB-");
            for (int i = 0; i < 4; i++) {
                sb.append(chars.charAt(rnd.nextInt(chars.length())));
            }
            codigo = sb.toString();
        } while (grupoRepository.findByCodigoInvitacion(codigo).isPresent());
        return codigo;
    }
}

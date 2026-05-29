package com.tribu.api_tribu.service;

import com.tribu.api_tribu.exception.ResourceNotFoundException;
import com.tribu.api_tribu.model.GrupoCompra;
import com.tribu.api_tribu.model.GrupoParticipante;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.GrupoParticipanteRepository;
import com.tribu.api_tribu.repository.GrupoRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class GrupoService {

    private final GrupoRepository grupoRepository;
    private final GrupoParticipanteRepository participanteRepository;
    private final UsuarioRepository usuarioRepository;
    private final SaldoService saldoService;
    private final EfipayService efipayService;

    @Value("${efipay.webhook.url}")
    private String efipayWebhookUrl;

    @Value("${efipay.app.base.url}")
    private String efipayAppBaseUrl;

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

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarMisGruposMapeados(String emailUsuario) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", emailUsuario));

        List<GrupoParticipante> participaciones = participanteRepository.findByUsuarioId(usuario.getId());

        return participaciones.stream().map(part -> {
            GrupoCompra grupo = part.getGrupo();
            List<GrupoParticipante> todosParticipantes = grupo.getParticipantes();

            long totalMiembros = todosParticipantes.size();
            long miembrosPagados = todosParticipantes.stream().filter(GrupoParticipante::isPagado).count();

            BigDecimal tuMonto = part.getMontoAsignado();
            if (tuMonto == null || tuMonto.compareTo(BigDecimal.ZERO) == 0) {
                tuMonto = totalMiembros > 0 
                    ? grupo.getMontoTotal().divide(BigDecimal.valueOf(totalMiembros), 2, java.math.RoundingMode.HALF_UP) 
                    : BigDecimal.ZERO;
            }

            Map<String, Object> m = new HashMap<>();
            m.put("id", grupo.getId());
            m.put("nombre", grupo.getNombre());
            m.put("emoji", grupo.getEmoji());
            m.put("organizador", grupo.getOrganizador().getNombreCompleto());
            m.put("totalMiembros", totalMiembros);
            m.put("miembrosPagados", miembrosPagados);
            m.put("tuMonto", tuMonto);
            m.put("expiresAt", grupo.getExpiresAt());
            m.put("estado", grupo.getEstado().name());
            m.put("tuEstado", part.isPagado() ? "PAGADO" : "PENDIENTE");
            m.put("codigoInvitacion", grupo.getCodigoInvitacion());

            return m;
        }).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obtenerDetalle(Long grupoId) {
        GrupoCompra grupo = grupoRepository.findById(grupoId)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo", "id", grupoId));

        List<Map<String, Object>> participantesList = grupo.getParticipantes().stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getId());
            m.put("nombre", p.getUsuario().getNombreCompleto());
            m.put("email", p.getUsuario().getEmail());
            m.put("montoAsignado", p.getMontoAsignado());
            m.put("pagado", p.isPagado());
            m.put("estado", p.getEstado());
            return m;
        }).toList();

        Map<String, Object> res = new HashMap<>();
        res.put("id", grupo.getId());
        res.put("nombre", grupo.getNombre());
        res.put("emoji", grupo.getEmoji());
        res.put("montoTotal", grupo.getMontoTotal());
        res.put("codigoInvitacion", grupo.getCodigoInvitacion());
        res.put("estado", grupo.getEstado().name());
        res.put("expiresAt", grupo.getExpiresAt());
        res.put("organizador", grupo.getOrganizador().getNombreCompleto());
        res.put("participantes", participantesList);

        return res;
    }

    @Transactional
    public String pagarParticipacion(String emailUsuario, Long grupoId) {
        return pagarParticipacionConMetodo(emailUsuario, grupoId, null);
    }

    @Transactional
    public String pagarParticipacionEfipay(String emailUsuario, Long grupoId) {
        return pagarParticipacionConMetodo(emailUsuario, grupoId, "EFIPAY");
    }

    @Transactional
    public String pagarParticipacionConMetodo(String emailUsuario, Long grupoId, String metodoPago) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", emailUsuario));

        GrupoCompra grupo = grupoRepository.findById(grupoId)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo", "id", grupoId));

        if (grupo.getEstado() != GrupoCompra.EstadoGrupo.ABIERTO) {
            throw new IllegalArgumentException("El grupo no está abierto para recibir pagos");
        }

        GrupoParticipante participante = participanteRepository.findByGrupoIdAndUsuarioId(grupo.getId(), usuario.getId())
                .orElseThrow(() -> new IllegalArgumentException("No eres participante de este grupo"));

        if (participante.isPagado()) {
            throw new IllegalArgumentException("Ya has pagado tu parte de este grupo");
        }

        // Calcular el monto a pagar
        BigDecimal tuMonto = participante.getMontoAsignado();
        if (tuMonto == null || tuMonto.compareTo(BigDecimal.ZERO) == 0) {
            long totalMiembros = participanteRepository.countByGrupoId(grupo.getId());
            tuMonto = totalMiembros > 0 
                ? grupo.getMontoTotal().divide(BigDecimal.valueOf(totalMiembros), 2, java.math.RoundingMode.HALF_UP) 
                : BigDecimal.ZERO;
        }

        if ("EFIPAY".equalsIgnoreCase(metodoPago)) {
            String approvedUrl = efipayAppBaseUrl + "/grupos?efipay=approved";
            String rejectedUrl = efipayAppBaseUrl + "/grupos?efipay=rejected";
            String pendingUrl = efipayAppBaseUrl + "/grupos?efipay=pending";

            String referenceId = "GRUPO-" + grupoId + "-" + usuario.getId();

            EfipayService.EfipayPaymentResponse efipayResponse = efipayService.generatePayment(
                    referenceId,
                    tuMonto.doubleValue(),
                    "Grupo #" + grupoId + " - " + usuario.getEmail(),
                    efipayWebhookUrl,
                    approvedUrl,
                    rejectedUrl,
                    pendingUrl
            );

            if (efipayResponse != null) {
                return efipayResponse.checkoutUrl();
            }
            return null;
        }

        // Descontar saldo usando SaldoService
        saldoService.registrarCompraConSaldo(usuario, tuMonto.doubleValue(), null);

        // Marcar como pagado
        participante.setPagado(true);
        participante.setEstado("PAGADO");
        participanteRepository.save(participante);

        // Verificar si todos los miembros pagaron para completar el grupo
        List<GrupoParticipante> todos = participanteRepository.findByGrupoId(grupo.getId());
        boolean todosPagados = todos.stream().allMatch(GrupoParticipante::isPagado);
        if (todosPagados) {
            grupo.setEstado(GrupoCompra.EstadoGrupo.COMPLETADO);
            grupoRepository.save(grupo);
        }

        return null;
    }

    public List<GrupoCompra> listarMisGrupos(String emailUsuario) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", emailUsuario));

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

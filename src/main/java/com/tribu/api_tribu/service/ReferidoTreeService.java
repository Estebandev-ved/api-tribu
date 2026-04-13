package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.response.ReferidoNodoDTO;
import com.tribu.api_tribu.dto.response.ReferidoStatsDTO;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.PedidoRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReferidoTreeService {

    private final UsuarioRepository usuarioRepository;
    private final PedidoRepository pedidoRepository;

    public ReferidoNodoDTO construirArbol(Long usuarioId) {
        Usuario raiz = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        return construirNodo(raiz, 0, 3);
    }

    private ReferidoNodoDTO construirNodo(Usuario usuario, int nivel, int maxNivel) {
        ReferidoNodoDTO nodo = ReferidoNodoDTO.builder()
            .id(usuario.getId())
            .nombre(usuario.getNombreCompleto())
            .tier(usuario.getTierActual() != null ? usuario.getTierActual().getNombre() : "SIN_TIER")
            .rachaActual(usuario.getRachaActual() != null ? usuario.getRachaActual() : 0)
            .totalComprasMes(calcularComprasMes(usuario))
            .activoEsteMes(estaActivoEsteMes(usuario))
            .hijos(new ArrayList<>())
            .build();

        if (nivel < maxNivel) {
            String codigo = usuario.getCodigoReferido();
            if (codigo != null && !codigo.isEmpty()) {
                List<Usuario> hijos = usuarioRepository.findByCodigoReferidoUsado(codigo);
                nodo.setHijos(hijos.stream()
                    .map(h -> construirNodo(h, nivel + 1, maxNivel))
                    .collect(Collectors.toList()));
            }
        }

        return nodo;
    }

    private double calcularComprasMes(Usuario usuario) {
        YearMonth mes = YearMonth.now();
        LocalDateTime inicio = mes.atDay(1).atStartOfDay();
        LocalDateTime fin = mes.atEndOfMonth().atTime(23, 59, 59);
        Double total = pedidoRepository.calculateTotalEntregadoEnPeriodo(
            usuario.getId(), "ENTREGADO", inicio, fin);
        return total != null ? total : 0.0;
    }

    private boolean estaActivoEsteMes(Usuario usuario) {
        return calcularComprasMes(usuario) > 0;
    }

    public List<ReferidoNodoDTO> getMisReferidos(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        
        String codigo = usuario.getCodigoReferido();
        if (codigo == null || codigo.isEmpty()) {
            return new ArrayList<>();
        }

        List<Usuario> referidos = usuarioRepository.findByCodigoReferidoUsado(codigo);
        return referidos.stream()
            .map(r -> construirNodo(r, 1, 1))
            .collect(Collectors.toList());
    }

    public ReferidoStatsDTO getStats(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        String codigo = usuario.getCodigoReferido();
        if (codigo == null || codigo.isEmpty()) {
            return ReferidoStatsDTO.builder()
                .totalReferidos(0L)
                .nivel1Count(0L)
                .nivel2Count(0L)
                .nivel3Count(0L)
                .activosEsteMes(0L)
                .gananciasNivel1(0.0)
                .gananciasNivel2(0.0)
                .gananciasNivel3(0.0)
                .totalGanancias(0.0)
                .build();
        }

        List<Usuario> nivel1 = usuarioRepository.findByCodigoReferidoUsado(codigo);
        long activos1 = nivel1.stream().filter(this::estaActivoEsteMes).count();

        List<Usuario> nivel2 = new ArrayList<>();
        List<Usuario> nivel3 = new ArrayList<>();

        for (Usuario ref : nivel1) {
            if (ref.getCodigoReferido() != null) {
                nivel2.addAll(usuarioRepository.findByCodigoReferidoUsado(ref.getCodigoReferido()));
            }
        }

        for (Usuario ref : nivel2) {
            if (ref.getCodigoReferido() != null) {
                nivel3.addAll(usuarioRepository.findByCodigoReferidoUsado(ref.getCodigoReferido()));
            }
        }

        long activos2 = nivel2.stream().filter(this::estaActivoEsteMes).count();
        long activos3 = nivel3.stream().filter(this::estaActivoEsteMes).count();

        double gananciasNivel1 = nivel1.stream()
            .mapToDouble(this::calcularComprasMes)
            .sum() * 0.05;
        double gananciasNivel2 = nivel2.stream()
            .mapToDouble(this::calcularComprasMes)
            .sum() * 0.02;
        double gananciasNivel3 = nivel3.stream()
            .mapToDouble(this::calcularComprasMes)
            .sum() * 0.01;

        return ReferidoStatsDTO.builder()
            .totalReferidos((long) nivel1.size() + nivel2.size() + nivel3.size())
            .nivel1Count((long) nivel1.size())
            .nivel2Count((long) nivel2.size())
            .nivel3Count((long) nivel3.size())
            .activosEsteMes(activos1 + activos2 + activos3)
            .gananciasNivel1(gananciasNivel1)
            .gananciasNivel2(gananciasNivel2)
            .gananciasNivel3(gananciasNivel3)
            .totalGanancias(gananciasNivel1 + gananciasNivel2 + gananciasNivel3)
            .build();
    }
}

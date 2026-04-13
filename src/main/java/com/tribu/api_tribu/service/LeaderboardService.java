package com.tribu.api_tribu.service;

import com.tribu.api_tribu.dto.response.LeaderboardEntryDTO;
import com.tribu.api_tribu.model.LeaderboardSnapshot;
import com.tribu.api_tribu.model.MovimientoSaldo.TipoMovimiento;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.LeaderboardSnapshotRepository;
import com.tribu.api_tribu.repository.PedidoRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.websocket.SaldoWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.PageRequest;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final LeaderboardSnapshotRepository snapshotRepository;
    private final SaldoService saldoService;
    private final SaldoWebSocketService wsService;

    private static final double[] PREMIOS_TOP3 = {50_000.0, 25_000.0, 10_000.0};
    private static final String[] BADGES_TOP3 = {"Campeón del mes", "Finalista", "Top 3"};

    public List<LeaderboardEntryDTO> getTopMes(int limite) {
        YearMonth mes = YearMonth.now();
        LocalDateTime inicio = mes.atDay(1).atStartOfDay();
        LocalDateTime fin = mes.atEndOfMonth().atTime(23, 59, 59);

        List<Object[]> resultados = pedidoRepository.findTopCompradores(inicio, fin, PageRequest.of(0, limite));
        List<LeaderboardEntryDTO> entries = new ArrayList<>();

        for (Object[] row : resultados) {
            LeaderboardEntryDTO dto = LeaderboardEntryDTO.builder()
                .posicion(((Number) row[0]).intValue())
                .usuarioId(((Number) row[1]).longValue())
                .nombre((String) row[2])
                .totalCompras(((Number) row[3]).doubleValue())
                .tier((String) row[4])
                .rachaActual(((Number) row[5]).intValue())
                .build();
            entries.add(dto);
        }

        return entries;
    }

    public LeaderboardEntryDTO getMiPosicion(Long usuarioId) {
        YearMonth mes = YearMonth.now();
        LocalDateTime inicio = mes.atDay(1).atStartOfDay();
        LocalDateTime fin = mes.atEndOfMonth().atTime(23, 59, 59);

        List<Object[]> resultados = pedidoRepository.findPosicionEnTop(usuarioId, inicio, fin);

        if (resultados.isEmpty()) {
            return null;
        }

        Object[] row = resultados.get(0);
        return LeaderboardEntryDTO.builder()
            .posicion(((Number) row[0]).intValue())
            .usuarioId(((Number) row[1]).longValue())
            .nombre((String) row[2])
            .totalCompras(((Number) row[3]).doubleValue())
            .tier((String) row[4])
            .rachaActual(((Number) row[5]).intValue())
            .build();
    }

    public List<LeaderboardSnapshot> getHistorico(String mes) {
        return snapshotRepository.findByMesOrderByPosicionAsc(mes);
    }

    @Transactional
    public void generarSnapshotYPremiar() {
        YearMonth mesAnterior = YearMonth.now().minusMonths(1);
        LocalDateTime inicio = mesAnterior.atDay(1).atStartOfDay();
        LocalDateTime fin = mesAnterior.atEndOfMonth().atTime(23, 59, 59);

        List<Object[]> top3 = pedidoRepository.findTopCompradores(inicio, fin, PageRequest.of(0, 3));

        for (int i = 0; i < top3.size(); i++) {
            Object[] row = top3.get(i);
            Long usuarioId = ((Number) row[1]).longValue();

            Optional<Usuario> optUsuario = usuarioRepository.findById(usuarioId);
            if (optUsuario.isEmpty()) continue;

            Usuario usuario = optUsuario.get();

            LeaderboardSnapshot snapshot = LeaderboardSnapshot.builder()
                .usuario(usuario)
                .posicion(i + 1)
                .totalCompras(((Number) row[3]).doubleValue())
                .mes(mesAnterior.toString())
                .tier((String) row[4])
                .rachaMaxima(usuario.getRachaMaxima())
                .build();
            snapshotRepository.save(snapshot);

            saldoService.crearYAcreditar(usuario, PREMIOS_TOP3[i], TipoMovimiento.LEADERBOARD_REWARD, null,
                "🏆 Premio por quedar #" + (i + 1) + " en el leaderboard de " + mesAnterior);

            wsService.notificarSaldoActualizado(usuarioId, PREMIOS_TOP3[i], "LEADERBOARD_REWARD",
                "¡Felicidades! Quedaste #" + (i + 1) + " del mes y ganaste $" + (int) PREMIOS_TOP3[i]);

            log.info("🏆 Usuario {} quedó #{} del mes {} - Premio: ${}",
                usuarioId, i + 1, mesAnterior, PREMIOS_TOP3[i]);
        }

        log.info("✅ [LeaderboardScheduler] Snapshot generado y top 3 premiado para {}", mesAnterior);
    }
}

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
import org.redisson.api.RScoredSortedSet;
import org.redisson.api.RedissonClient;
import org.redisson.client.protocol.ScoredEntry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

/**
 * 🏆 LeaderboardService - Gestor de Ligas y Rankings de la Tribu.
 *
 * ARQUITECTURA DE ALTO RENDIMIENTO (REDIS SORTED SETS):
 *   1. Rapidez O(log N): Usamos RScoredSortedSet de Redisson para mantener las compras de cada usuario ordenadas
 *      en memoria en tiempo real, evitando consultas SQL de agregación pesadas.
 *   2. Calentamiento Automático (Lazy Loading Cache): Si Redis se reinicia, el servicio recupera y repuebla
 *      el Sorted Set desde MySQL de forma totalmente transparente.
 *   3. Desacoplamiento de Datos: Redis almacena 'usuarioId -> score'. Los detalles (nombre, racha, nivel)
 *      se obtienen de base de datos de manera indexada por ID primario.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final LeaderboardSnapshotRepository snapshotRepository;
    private final SaldoService saldoService;
    private final SaldoWebSocketService wsService;
    private final RedissonClient redissonClient;

    private static final double[] PREMIOS_TOP3 = {50_000.0, 25_000.0, 10_000.0};

    private String getRedisKey() {
        return "tribu:leaderboard:" + YearMonth.now();
    }

    /**
     * Incrementa o agrega el score de compras de un usuario en el Sorted Set de Redis.
     */
    public void actualizarScoreRedis(Long usuarioId, double montoCompra) {
        try {
            RScoredSortedSet<String> sortedSet = redissonClient.getScoredSortedSet(getRedisKey());
            sortedSet.addScore(usuarioId.toString(), montoCompra);
            log.info("🏆 [Redis Leaderboard] Sumado ${} a usuarioId {} en el Sorted Set", montoCompra, usuarioId);
        } catch (Exception e) {
            log.error("💥 Falló la actualización de puntuación en Redis: {}", e.getMessage());
        }
    }

    /**
     * Obtiene el Top compradores del mes en curso utilizando Redis Sorted Set.
     */
    public List<LeaderboardEntryDTO> getTopMes(int limite) {
        try {
            RScoredSortedSet<String> sortedSet = redissonClient.getScoredSortedSet(getRedisKey());

            // Cache Warming: Si Redis está vacío, repoblar desde base de datos
            if (sortedSet.isEmpty()) {
                calentarCacheDesdeSql();
            }

            Collection<ScoredEntry<String>> entries = sortedSet.entryRangeReversed(0, limite - 1);
            List<LeaderboardEntryDTO> dtoList = new ArrayList<>();
            int posicion = 1;

            for (ScoredEntry<String> entry : entries) {
                Long usuarioId = Long.parseLong(entry.getValue());
                double total = entry.getScore();

                Optional<Usuario> opt = usuarioRepository.findById(usuarioId);
                if (opt.isPresent()) {
                    Usuario u = opt.get();
                    dtoList.add(LeaderboardEntryDTO.builder()
                            .posicion(posicion++)
                            .usuarioId(usuarioId)
                            .nombre(u.getNombreCompleto())
                            .totalCompras(total)
                            .tier(obtenerNombreTier(u))
                            .rachaActual(u.getRachaActual())
                            .build());
                }
            }
            return dtoList;
        } catch (Exception e) {
            log.warn("⚠️ Falló lectura de Redis Leaderboard. Usando fallback de base de datos SQL: {}", e.getMessage());
            return getTopMesFallbackSql(limite);
        }
    }

    /**
     * Obtiene la posición del usuario autenticado de forma instantánea.
     */
    public LeaderboardEntryDTO getMiPosicion(Long usuarioId) {
        try {
            RScoredSortedSet<String> sortedSet = redissonClient.getScoredSortedSet(getRedisKey());
            
            if (sortedSet.isEmpty()) {
                calentarCacheDesdeSql();
            }

            Double score = sortedSet.getScore(usuarioId.toString());
            Integer rank = sortedSet.revRank(usuarioId.toString()); // 0-indexed de mayor a menor

            Optional<Usuario> opt = usuarioRepository.findById(usuarioId);
            if (opt.isEmpty()) return null;
            Usuario u = opt.get();

            if (score == null || rank == null) {
                return LeaderboardEntryDTO.builder()
                        .posicion(null)
                        .usuarioId(usuarioId)
                        .nombre(u.getNombreCompleto())
                        .totalCompras(0.0)
                        .tier(obtenerNombreTier(u))
                        .rachaActual(u.getRachaActual())
                        .build();
            }

            return LeaderboardEntryDTO.builder()
                    .posicion(rank + 1)
                    .usuarioId(usuarioId)
                    .nombre(u.getNombreCompleto())
                    .totalCompras(score)
                    .tier(obtenerNombreTier(u))
                    .rachaActual(u.getRachaActual())
                    .build();
        } catch (Exception e) {
            log.warn("⚠️ Falló lectura mi posición en Redis. Usando fallback SQL: {}", e.getMessage());
            return getMiPosicionFallbackSql(usuarioId);
        }
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
                    "¡Felicidades! Quedaste #" + (i + 1) + " del mes y ganaste " + (int) PREMIOS_TOP3[i] + " Puntos Tribu");

            log.info("🏆 Usuario {} quedó #{} del mes {} - Premio: {} Puntos Tribu",
                    usuarioId, i + 1, mesAnterior, PREMIOS_TOP3[i]);
        }

        log.info("✅ [LeaderboardScheduler] Snapshot generado y top 3 premiado para {}", mesAnterior);
    }

    /**
     * ⚡ Calentamiento de Caché (Cache Warming)
     */
    private void calentarCacheDesdeSql() {
        log.info("🔥 Calentando caché del Leaderboard en Redis desde la base de datos SQL...");
        YearMonth mes = YearMonth.now();
        LocalDateTime inicio = mes.atDay(1).atStartOfDay();
        LocalDateTime fin = mes.atEndOfMonth().atTime(23, 59, 59);

        List<Object[]> compradores = pedidoRepository.findTopCompradores(inicio, fin, PageRequest.of(0, 100));
        RScoredSortedSet<String> sortedSet = redissonClient.getScoredSortedSet(getRedisKey());

        for (Object[] row : compradores) {
            Long uid = ((Number) row[1]).longValue();
            double total = ((Number) row[3]).doubleValue();
            sortedSet.add(total, uid.toString());
        }
        log.info("🔥 Calentamiento finalizado. {} registros inyectados a Redis.", compradores.size());
    }

    /**
     * 🛡️ Métodos Fallback SQL ante fallas del servidor Redis
     */
    private List<LeaderboardEntryDTO> getTopMesFallbackSql(int limite) {
        YearMonth mes = YearMonth.now();
        LocalDateTime inicio = mes.atDay(1).atStartOfDay();
        LocalDateTime fin = mes.atEndOfMonth().atTime(23, 59, 59);

        List<Object[]> resultados = pedidoRepository.findTopCompradores(inicio, fin, PageRequest.of(0, limite));
        List<LeaderboardEntryDTO> entries = new ArrayList<>();

        for (Object[] row : resultados) {
            entries.add(LeaderboardEntryDTO.builder()
                    .posicion(((Number) row[0]).intValue())
                    .usuarioId(((Number) row[1]).longValue())
                    .nombre((String) row[2])
                    .totalCompras(((Number) row[3]).doubleValue())
                    .tier((String) row[4])
                    .rachaActual(((Number) row[5]).intValue())
                    .build());
        }
        return entries;
    }

    private LeaderboardEntryDTO getMiPosicionFallbackSql(Long usuarioId) {
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

    private String obtenerNombreTier(Usuario u) {
        if (u.getTierActual() != null) {
            return u.getTierActual().getNombre();
        }
        if (u.getNivelVip() != null) {
            int n = u.getNivelVip();
            if (n == 1) return "BRONCE";
            if (n == 2) return "PLATA";
            if (n == 3) return "ORO";
        }
        return "SIN_TIER";
    }
}

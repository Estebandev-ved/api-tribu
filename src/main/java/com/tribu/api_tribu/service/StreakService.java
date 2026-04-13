package com.tribu.api_tribu.service;

import com.tribu.api_tribu.model.MovimientoSaldo.TipoMovimiento;
import com.tribu.api_tribu.model.Usuario;
import com.tribu.api_tribu.repository.UsuarioRepository;
import com.tribu.api_tribu.websocket.SaldoWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class StreakService {

    private final UsuarioRepository usuarioRepository;
    private final SaldoService saldoService;
    private final SaldoWebSocketService wsService;

    private static final int[] DIAS_BONUS = {3, 7, 14, 30, 60};
    private static final double[] MONTOS_BONUS = {1_000.0, 3_000.0, 7_000.0, 20_000.0, 50_000.0};

    @Transactional
    public void registrarActividad(Usuario usuario) {
        LocalDate hoy = LocalDate.now();
        LocalDate ayer = hoy.minusDays(1);
        LocalDate ultima = usuario.getUltimaActividadFecha();

        if (ultima == null || ultima.isBefore(ayer)) {
            usuario.setRachaActual(1);
        } else if (ultima.isEqual(ayer)) {
            usuario.setRachaActual(usuario.getRachaActual() + 1);
        } else if (ultima.isEqual(hoy)) {
            return;
        }

        usuario.setUltimaActividadFecha(hoy);
        if (usuario.getRachaActual() > usuario.getRachaMaxima()) {
            usuario.setRachaMaxima(usuario.getRachaActual());
        }
        usuarioRepository.save(usuario);

        verificarBonusRacha(usuario);
    }

    private void verificarBonusRacha(Usuario usuario) {
        int racha = usuario.getRachaActual();
        double bonus = calcularBonusRacha(racha);
        if (bonus <= 0) return;

        saldoService.crearYAcreditar(usuario, bonus, TipoMovimiento.STREAK_BONUS, null,
            "🔥 ¡" + racha + " días seguidos! Bonus de racha.");
        wsService.notificarSaldoActualizado(usuario.getId(), bonus,
            "STREAK_BONUS", "¡Racha de " + racha + " días! +$" + (int)bonus);
    }

    public double calcularBonusRacha(int dias) {
        for (int i = 0; i < DIAS_BONUS.length; i++) {
            if (dias == DIAS_BONUS[i]) {
                return MONTOS_BONUS[i];
            }
        }
        return 0.0;
    }

    public Map<String, Object> getMiRacha(Usuario usuario) {
        int actual = usuario.getRachaActual() != null ? usuario.getRachaActual() : 0;
        int maxima = usuario.getRachaMaxima() != null ? usuario.getRachaMaxima() : 0;
        LocalDate ultima = usuario.getUltimaActividadFecha();

        int[] proximosBonus = getProximoBonus(actual);
        int diasFaltantes = proximosBonus[0];
        double montoProximo = proximosBonus[1];

        Map<String, Object> rachaMap = new java.util.HashMap<>();
        rachaMap.put("rachaActual", actual);
        rachaMap.put("rachaMaxima", maxima);
        rachaMap.put("ultimaActividad", ultima != null ? ultima.toString() : null);
        rachaMap.put("proximoBonusDias", diasFaltantes);
        rachaMap.put("proximoBonusMonto", (int) montoProximo);
        return rachaMap;
    }

    private int[] getProximoBonus(int rachaActual) {
        for (int i = 0; i < DIAS_BONUS.length; i++) {
            if (rachaActual < DIAS_BONUS[i]) {
                return new int[]{DIAS_BONUS[i] - rachaActual, (int) MONTOS_BONUS[i]};
            }
        }
        return new int[]{0, 0};
    }

    @Transactional
    public void resetearRacha(Long usuarioId) {
        Optional<Usuario> opt = usuarioRepository.findById(usuarioId);
        if (opt.isPresent()) {
            Usuario usuario = opt.get();
            if (usuario.getRachaActual() != null && usuario.getRachaActual() > 0) {
                usuario.setRachaActual(0);
                usuarioRepository.save(usuario);
                wsService.notificarSaldoActualizado(usuarioId, 0, "STREAK_ROTO",
                    "Tu racha se ha roto. ¡Vuelve a empezar!");
            }
        }
    }
}

package com.tribu.api_tribu.telegram;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramNotificationService {
    private final TribuAdminBot bot;

    public void alertaStockCritico(String nombreProducto, int stockActual) {
        bot.notificarAdmins("⚠️ *STOCK CRÍTICO*\n" +
                "Producto: " + nombreProducto + "\n" +
                "Stock actual: " + stockActual + " unidades\n" +
                "Acción requerida: Reponer inventario urgente");
    }

    public void alertaStockBajo(String nombreProducto, int stockActual) {
        bot.notificarAdmins("🟡 *Stock bajo*\n" +
                nombreProducto + ": " + stockActual + " unidades restantes");
    }

    public void alertaNuevoUsuario(String nombre, String email) {
        bot.notificarAdmins("🆕 Nuevo usuario: *" + nombre + "* (" + email + ")");
    }

    public void alertaPedidoGrande(Long pedidoId, Double total) {
        if (total >= 500_000) {
            bot.notificarAdmins("💎 *Pedido grande #" + pedidoId + "*\nTotal: $" +
                    String.format("%.0f", total));
        }
    }

    public void alertaErrorSistema(String servicio, String error) {
        bot.notificarAdmins("🔴 *ERROR en " + servicio + "*\n" + error);
    }

    public void alertaSoporteEscalado(Long conversacionId, String nombreUsuario, String email, String motivo, String ultimoMensaje) {
        bot.notificarAdmins("🚨 *SOPORTE ESCALADO A HUMANO*\n\n" +
                "• *Conversación:* #" + conversacionId + "\n" +
                "• *Usuario:* " + nombreUsuario + " (" + email + ")\n" +
                "• *Motivo:* " + motivo + "\n" +
                "• *Último mensaje:* _\"" + ultimoMensaje + "\"_\n\n" +
                "⚠️ _Por favor, responda desde el Panel de Administración._");
    }

    public void notificarLiberacionCashback(String nombreUsuario, Double monto) {
        bot.notificarAdmins("💸 *Cashback Liberado*\n" +
                "Usuario: " + nombreUsuario + "\n" +
                "Monto: $" + String.format("%.0f", monto));
    }

    public void notificarCambioTier(String nombreUsuario, String tierAnterior, String tierNuevo) {
        bot.notificarAdmins("⭐ *Cambio de Tier*\n" +
                "Usuario: " + nombreUsuario + "\n" +
                tierAnterior + " → *" + tierNuevo + "*");
    }
}

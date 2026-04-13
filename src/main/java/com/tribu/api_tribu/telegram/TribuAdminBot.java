package com.tribu.api_tribu.telegram;

import com.tribu.api_tribu.model.Pedido;
import com.tribu.api_tribu.model.Producto;
import com.tribu.api_tribu.repository.PedidoRepository;
import com.tribu.api_tribu.repository.ProductoRepository;
import com.tribu.api_tribu.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Component
public class TribuAdminBot extends TelegramLongPollingBot {

    @Value("${telegram.bot.token}")
    private String token;

    @Value("${telegram.bot.username}")
    private String username;

    @Value("${telegram.bot.admin.chat.ids}")
    private List<String> adminChatIds;

    private final UsuarioRepository usuarioRepository;
    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;

    public TribuAdminBot(UsuarioRepository usuarioRepository, PedidoRepository pedidoRepository, 
                         ProductoRepository productoRepository) {
        this.usuarioRepository = usuarioRepository;
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
    }

    @Override
    public void onUpdateReceived(Update update) {
        if (!update.hasMessage() || !update.getMessage().hasText()) return;
        
        Long chatId = update.getMessage().getChatId();
        String chatIdStr = chatId.toString();

        if (!adminChatIds.contains(chatIdStr)) {
            enviarMensaje(chatId, "⛔ No tienes permisos para usar este bot.");
            return;
        }

        String texto = update.getMessage().getText();
        String respuesta = procesarComando(texto, chatId);
        if (respuesta != null) {
            enviarMensaje(chatId, respuesta);
        }
    }

    private String procesarComando(String comando, Long chatId) {
        return switch (comando) {
            case "/start" -> "👋 Hola Admin! Comandos: /stats /stock /pendientes /top5 /alertas";
            case "/stats" -> buildStatsDelDia();
            case "/stock" -> buildReporteStockBajo();
            case "/pendientes" -> buildPedidosPendientes();
            case "/top5" -> buildTop5Productos();
            case "/alertas" -> buildAlertasActivas();
            default -> "Comando no reconocido. Usa /stats /stock /pendientes /top5 /alertas";
        };
    }

    public void notificarAdmins(String mensaje) {
        for (String chatIdStr : adminChatIds) {
            try {
                Long chatId = Long.parseLong(chatIdStr);
                enviarMensaje(chatId, mensaje);
            } catch (NumberFormatException e) {
                System.err.println("Invalid admin chat ID: " + chatIdStr);
            }
        }
    }

    public void enviarMensaje(Long chatId, String texto) {
        try {
            execute(SendMessage.builder()
                    .chatId(chatId.toString())
                    .text(texto)
                    .parseMode("Markdown")
                    .build());
        } catch (TelegramApiException e) {
            log.error("Error enviando mensaje Telegram: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    private String buildStatsDelDia() {
        LocalDate hoy = LocalDate.now();
        LocalDateTime inicioDia = hoy.atStartOfDay();
        LocalDateTime finDia = hoy.atTime(23, 59, 59);

        Long nuevosUsuarios = usuarioRepository.countByFechaCreacionBetween(inicioDia, finDia);
        Long pedidosDelDia = pedidoRepository.countByFechaPedidoBetween(inicioDia, finDia);
        Double ventasDelDia = pedidoRepository.calculateTotalByEstadoAndPeriod("PAGADO", inicioDia, finDia);
        Double ventasEntregados = pedidoRepository.calculateTotalByEstadoAndPeriod("ENTREGADO", inicioDia, finDia);
        Long pedidosPendientes = pedidoRepository.countByEstado("PENDIENTE");
        Long pedidosEnviados = pedidoRepository.countByEstado("ENVIADO");
        Long pedidosEntregados = pedidoRepository.countByEstado("ENTREGADO");

        String topProducto = "N/A";
        var top = productoRepository.findTopProductoVendidoDelMes();
        if (top != null) {
            topProducto = "\"" + top.get("nombre") + "\" (" + top.get("cantidad") + " unidades)";
        }

        return String.format("""
            📊 *Resumen del día* - %s

            💰 Ventas: $%s
            📦 Pedidos: %d (%d entregados, %d en camino, %d pendientes)
            👥 Nuevos usuarios: %d

            Top producto: %s
            """,
            hoy.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
            String.format("%.0f", ventasDelDia != null ? ventasDelDia : 0),
            pedidosDelDia != null ? pedidosDelDia.intValue() : 0,
            pedidosEntregados != null ? pedidosEntregados.intValue() : 0,
            pedidosEnviados != null ? pedidosEnviados.intValue() : 0,
            pedidosPendientes != null ? pedidosPendientes.intValue() : 0,
            nuevosUsuarios != null ? nuevosUsuarios.intValue() : 0,
            topProducto
        );
    }

    private String buildReporteStockBajo() {
        var stockCritico = productoRepository.findByStockLessThanEqual(3);
        var stockBajo = productoRepository.findByStockBetween(4, 5);

        if (stockCritico.isEmpty() && stockBajo.isEmpty()) {
            return "✅ Inventario OK — Sin productos en stock bajo";
        }

        StringBuilder sb = new StringBuilder("📦 *Reporte de inventario*\n\n");

        if (!stockCritico.isEmpty()) {
            sb.append("🔴 *Stock Crítico* (< 3 uds):\n");
            stockCritico.forEach(p -> sb.append("• ").append(p.getNombre()).append(": ").append(p.getStock()).append(" uds\n"));
            sb.append("\n");
        }

        if (!stockBajo.isEmpty()) {
            sb.append("🟡 *Stock Bajo* (4-5 uds):\n");
            stockBajo.forEach(p -> sb.append("• ").append(p.getNombre()).append(": ").append(p.getStock()).append(" uds\n"));
        }

        return sb.toString();
    }

    private String buildPedidosPendientes() {
        var pendientes = pedidoRepository.findByEstadoOrderByFechaPedidoDesc("PENDIENTE");
        
        if (pendientes.isEmpty()) {
            return "✅ No hay pedidos pendientes";
        }

        StringBuilder sb = new StringBuilder("📋 *Pedidos Pendientes*\n\n");
        pendientes.stream().limit(10).forEach(p -> {
            sb.append("• #").append(p.getId())
              .append(" - ").append(p.getUsuario().getNombreCompleto())
              .append(" - $").append(p.getTotal().toPlainString())
              .append("\n");
        });

        if (pendientes.size() > 10) {
            sb.append("\n... y ").append(pendientes.size() - 10).append(" más");
        }

        return sb.toString();
    }

    private String buildTop5Productos() {
        var top5 = productoRepository.findTop5ProductosMasVendidosMesActual();
        
        if (top5.isEmpty()) {
            return "📊 No hay datos de ventas del mes";
        }

        StringBuilder sb = new StringBuilder("🏆 *Top 5 Productos del Mes*\n\n");
        int i = 1;
        for (var p : top5) {
            sb.append(i).append(". ").append(p.get("nombre"))
              .append(": ").append(p.get("cantidad")).append(" uds\n");
            i++;
        }

        return sb.toString();
    }

    private String buildAlertasActivas() {
        return "⚠️ *Alertas del Sistema*\n\n" +
               "Sistema operativo. No hay alertas activas.";
    }

    @Override
    public String getBotUsername() {
        return username;
    }

    @Override
    public String getBotToken() {
        return token;
    }
}

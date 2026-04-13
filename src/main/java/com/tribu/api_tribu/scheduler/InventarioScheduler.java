package com.tribu.api_tribu.scheduler;

import com.tribu.api_tribu.model.Producto;
import com.tribu.api_tribu.repository.ProductoRepository;
import com.tribu.api_tribu.telegram.TelegramNotificationService;
import com.tribu.api_tribu.telegram.TribuAdminBot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventarioScheduler {

    private final ProductoRepository productoRepository;
    private final TelegramNotificationService telegramService;
    private final TribuAdminBot triboAdminBot;

    @Scheduled(cron = "0 0 7 * * *", zone = "America/Bogota")
    public void reporteDiarioInventario() {
        log.info("📦 Ejecutando reporte diario de inventario...");
        
        List<Producto> stockBajo = productoRepository.findByStockLessThanEqualOrderByStockAsc(10);

        if (stockBajo.isEmpty()) {
            triboAdminBot.notificarAdmins("✅ Inventario OK — Sin productos en stock bajo");
            return;
        }

        StringBuilder reporte = new StringBuilder("📦 *Reporte de inventario*\n\n");
        
        int stockCritico = 0;
        int stockBajoCount = 0;
        
        for (Producto p : stockBajo) {
            int stock = p.getStock() != null ? p.getStock() : 0;
            int critico = p.getStockCritico() != null ? p.getStockCritico() : 3;
            String emoji = stock <= critico ? "🔴" : "🟡";
            reporte.append(emoji).append(" ").append(p.getNombre())
                   .append(": ").append(stock).append(" uds\n");
            
            if (stock <= critico) {
                stockCritico++;
            } else {
                stockBajoCount++;
            }
        }

        reporte.append("\n📊 Total: ").append(stockCritico).append(" críticos, ")
               .append(stockBajoCount).append(" en aviso");

        triboAdminBot.notificarAdmins(reporte.toString());
    }
}

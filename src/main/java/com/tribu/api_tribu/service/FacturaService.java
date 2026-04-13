package com.tribu.api_tribu.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.tribu.api_tribu.dto.request.SolicitarFacturaRequest;
import com.tribu.api_tribu.model.*;
import com.tribu.api_tribu.repository.FacturaRepository;
import com.tribu.api_tribu.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileOutputStream;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class FacturaService {

    private final FacturaRepository facturaRepo;
    private final PedidoRepository pedidoRepo;
    private final EmailService emailService;

    @Value("${app.facturas.ruta:/tmp/facturas}")
    private String rutaFacturas;

    private static final double IVA_TASA = 0.19;

    @Transactional
    public FacturaElectronica generarFactura(SolicitarFacturaRequest request, Long usuarioId) {
        Pedido pedido = pedidoRepo.findById(request.getPedidoId())
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));

        if (!pedido.getUsuario().getId().equals(usuarioId)) {
            throw new IllegalArgumentException("El pedido no pertenece a este usuario");
        }

        if (facturaRepo.existsByPedidoId(pedido.getId())) {
            throw new IllegalArgumentException("Ya existe una factura para este pedido");
        }

        double total = pedido.getTotal().doubleValue();
        double subtotal = total / (1 + IVA_TASA);
        double iva = total - subtotal;

        String numeroFactura = generarNumero();

        FacturaElectronica factura = FacturaElectronica.builder()
                .pedido(pedido)
                .usuario(pedido.getUsuario())
                .numeroFactura(numeroFactura)
                .nit(request.getNit())
                .razonSocial(request.getRazonSocial())
                .subtotal(subtotal)
                .iva(iva)
                .total(total)
                .estado(FacturaElectronica.EstadoFactura.GENERADA)
                .build();

        factura = facturaRepo.save(factura);

        String pdfPath = generarFacturaPDF(factura, pedido);
        factura.setPdfUrl(pdfPath);
        factura = facturaRepo.save(factura);

        factura.setEstado(FacturaElectronica.EstadoFactura.ENVIADA);
        facturaRepo.save(factura);

        emailService.enviarFactura(pedido.getUsuario().getEmail(), factura, pdfPath);

        log.info("📄 Factura {} generada para pedido {}", numeroFactura, pedido.getId());
        return factura;
    }

    public String generarFacturaPDF(FacturaElectronica factura, Pedido pedido) {
        try {
            String fileName = "factura_" + factura.getNumeroFactura() + ".pdf";
            String filePath = rutaFacturas + "/" + fileName;

            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, new FileOutputStream(filePath));
            document.open();

            Font titleFont = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD);
            Font headerFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);
            Font normalFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL);
            Font smallFont = new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL);

            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{1f, 1f});

            PdfPCell companyCell = new PdfPCell();
            companyCell.setBorder(Rectangle.NO_BORDER);
            companyCell.addElement(new Paragraph("TRIBU CARD SAS", titleFont));
            companyCell.addElement(new Paragraph("NIT: 901.234.567-8", normalFont));
            companyCell.addElement(new Paragraph("Bogotá, Colombia", normalFont));
            headerTable.addCell(companyCell);

            PdfPCell invoiceCell = new PdfPCell();
            invoiceCell.setBorder(Rectangle.NO_BORDER);
            invoiceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            invoiceCell.addElement(new Paragraph("FACTURA ELECTRÓNICA", headerFont));
            invoiceCell.addElement(new Paragraph("N° " + factura.getNumeroFactura(), normalFont));
            invoiceCell.addElement(new Paragraph("Fecha: " + factura.getFechaEmision().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), normalFont));
            headerTable.addCell(invoiceCell);

            document.add(headerTable);
            document.add(Chunk.NEWLINE);

            PdfPTable clientTable = new PdfPTable(1);
            clientTable.setWidthPercentage(100);
            PdfPCell clientCell = new PdfPCell();
            clientCell.setBorder(Rectangle.BOX);
            clientCell.setPadding(10);
            clientCell.addElement(new Paragraph("CLIENTE:", headerFont));
            clientCell.addElement(new Paragraph(factura.getRazonSocial(), normalFont));
            clientCell.addElement(new Paragraph("NIT/CC: " + factura.getNit(), normalFont));
            clientTable.addCell(clientCell);
            document.add(clientTable);
            document.add(Chunk.NEWLINE);

            PdfPTable detailTable = new PdfPTable(4);
            detailTable.setWidthPercentage(100);
            detailTable.setWidths(new float[]{3f, 1f, 1f, 1f});

            PdfPCell headerCell = new PdfPCell(new Phrase("PRODUCTO", headerFont));
            headerCell.setBackgroundColor(new BaseColor(220, 220, 220));
            headerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            detailTable.addCell(headerCell);

            headerCell = new PdfPCell(new Phrase("CANT", headerFont));
            headerCell.setBackgroundColor(new BaseColor(220, 220, 220));
            headerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            detailTable.addCell(headerCell);

            headerCell = new PdfPCell(new Phrase("PRECIO", headerFont));
            headerCell.setBackgroundColor(new BaseColor(220, 220, 220));
            headerCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            detailTable.addCell(headerCell);

            headerCell = new PdfPCell(new Phrase("TOTAL", headerFont));
            headerCell.setBackgroundColor(new BaseColor(220, 220, 220));
            headerCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            detailTable.addCell(headerCell);

            if (pedido.getDetalles() != null) {
                for (DetallePedido detalle : pedido.getDetalles()) {
                    PdfPCell cell = new PdfPCell(new Phrase(detalle.getProducto().getNombre(), normalFont));
                    cell.setBorder(Rectangle.BOX);
                    detailTable.addCell(cell);

                    cell = new PdfPCell(new Phrase(String.valueOf(detalle.getCantidad()), normalFont));
                    cell.setBorder(Rectangle.BOX);
                    cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    detailTable.addCell(cell);

                    double precioUnitario = detalle.getPrecioUnitario().doubleValue();
                    cell = new PdfPCell(new Phrase(formatCOP(precioUnitario), normalFont));
                    cell.setBorder(Rectangle.BOX);
                    cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                    detailTable.addCell(cell);

                    double totalDetalle = precioUnitario * detalle.getCantidad();
                    cell = new PdfPCell(new Phrase(formatCOP(totalDetalle), normalFont));
                    cell.setBorder(Rectangle.BOX);
                    cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                    detailTable.addCell(cell);
                }
            }

            document.add(detailTable);
            document.add(Chunk.NEWLINE);

            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(50);
            totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalsTable.setWidths(new float[]{2f, 1f});

            addTotalsRow(totalsTable, "Subtotal:", formatCOP(factura.getSubtotal()), normalFont);
            addTotalsRow(totalsTable, "IVA (19%):", formatCOP(factura.getIva()), normalFont);
            addTotalsRow(totalsTable, "Total:", formatCOP(factura.getTotal()), normalFont, true);

            document.add(totalsTable);
            document.add(Chunk.NEWLINE);

            Paragraph footer = new Paragraph("Gracias por comprar en Tribu", smallFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            log.info("PDF generado: {}", filePath);
            return filePath;

        } catch (Exception e) {
            log.error("Error generando PDF de factura: {}", e.getMessage());
            throw new RuntimeException("Error al generar PDF de factura", e);
        }
    }

    private void addTotalsRow(PdfPTable table, String label, String value, Font font, boolean isBold) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, isBold ? new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD) : font));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, isBold ? new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD) : font));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(valueCell);
    }

    private void addTotalsRow(PdfPTable table, String label, String value, Font font) {
        addTotalsRow(table, label, value, font, false);
    }

    private String generarNumero() {
        long count = facturaRepo.count() + 1;
        return "FE-" + Year.now() + "-" + String.format("%05d", count);
    }

    public String formatCOP(double monto) {
        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("es", "CO"));
        return formatter.format(monto);
    }

    public FacturaElectronica getFacturaPorPedido(Long pedidoId) {
        return facturaRepo.findByPedidoId(pedidoId).orElse(null);
    }

    public java.util.List<FacturaElectronica> getMisFacturas(Long usuarioId) {
        return facturaRepo.findByUsuarioId(usuarioId);
    }

    public java.util.List<FacturaElectronica> listarTodas() {
        return facturaRepo.findAll();
    }
}

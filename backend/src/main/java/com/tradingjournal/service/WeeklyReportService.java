package com.tradingjournal.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.tradingjournal.model.Trade;
import com.tradingjournal.model.User;
import com.tradingjournal.repository.TradeRepository;
import com.tradingjournal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WeeklyReportService {

    private final UserRepository  userRepository;
    private final TradeRepository tradeRepository;
    private final EmailService    emailService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");

    // ── Scheduled: every Monday 8 AM UTC ────────────────────────────────────
    @Scheduled(cron = "0 0 8 * * MON")
    public void sendWeeklyReports() {
        log.info("Starting weekly report email job...");

        LocalDate weekEnd   = LocalDate.now().with(DayOfWeek.SUNDAY).minusWeeks(1);
        LocalDate weekStart = weekEnd.minusDays(6);
        LocalDateTime from  = weekStart.atStartOfDay();
        LocalDateTime to    = weekEnd.atTime(23, 59, 59);

        List<User> users = userRepository.findAll().stream()
                .filter(u -> u.isActive() && u.isWeeklyReportEmail())
                .collect(Collectors.toList());

        log.info("Sending weekly reports to {} users for week {}", users.size(), weekStart);
        for (User user : users) {
            try {
                sendWeeklyReportForUser(user, from, to, weekStart, weekEnd);
            } catch (Exception e) {
                log.error("Failed for user {}: {}", user.getEmail(), e.getMessage());
            }
        }
    }

    // ── PUBLIC: called by ReportTestController to test immediately ───────────
    public void sendWeeklyReportForCurrentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        // Use last 7 days so there are trades to show in the report
        LocalDate weekEnd   = LocalDate.now();
        LocalDate weekStart = weekEnd.minusDays(6);
        LocalDateTime from  = weekStart.atStartOfDay();
        LocalDateTime to    = weekEnd.atTime(23, 59, 59);

        log.info("TEST: Sending weekly report for {} ({} to {})",
                user.getEmail(), weekStart, weekEnd);

        sendWeeklyReportForUser(user, from, to, weekStart, weekEnd);
    }

    // ── Per-user report logic — package-private so test method can call it ──
    void sendWeeklyReportForUser(User user, LocalDateTime from, LocalDateTime to,
                                  LocalDate weekStart, LocalDate weekEnd) {
        List<Trade> weekTrades = tradeRepository
                .findByUserIdAndTradeDateBetweenOrderByTradeDateDesc(user.getId(), from, to);

        String userName = user.getDisplayName() != null ? user.getDisplayName()
                : user.getFullName() != null ? user.getFullName()
                : user.getEmail().split("@")[0];

        String weekLabel = weekStart.format(DATE_FMT) + " – " + weekEnd.format(DATE_FMT);

        if (weekTrades.isEmpty()) {
            log.info("No trades for {} in range — sending no-activity email", user.getEmail());
            sendNoActivityEmail(user.getEmail(), userName, weekLabel);
        } else {
            List<Trade> closed = weekTrades.stream()
                    .filter(t -> t.getOutcomeTag() != null
                              && t.getOutcomeTag() != Trade.OutcomeTag.OPEN
                              && t.getOutcomeTag() != Trade.OutcomeTag.NO_TRADE)
                    .collect(Collectors.toList());

            log.info("Found {} closed trades for {} — sending report", closed.size(), user.getEmail());
            WeekStats stats   = computeStats(closed);
            String htmlBody   = buildReportHtml(userName, weekLabel, stats, closed);

            try {
                byte[] pdf      = buildReportPdf(userName, weekLabel, stats, closed);
                String filename = "TradePulse_Report_" + weekStart + ".pdf";
                emailService.sendEmailWithAttachment(
                        user.getEmail(),
                        "📊 Your TradePulse Weekly Report — " + weekLabel,
                        htmlBody, pdf, filename);
            } catch (Exception e) {
                log.warn("PDF failed for {}, sending HTML only: {}", user.getEmail(), e.getMessage());
                emailService.sendHtmlEmail(user.getEmail(),
                        "📊 Your TradePulse Weekly Report — " + weekLabel, htmlBody);
            }
        }
    }

    // ── No-activity email ────────────────────────────────────────────────────
    private void sendNoActivityEmail(String email, String name, String weekLabel) {
        String subject = "TradePulse — No trades logged this week";
        String html = "<!DOCTYPE html><html><body style='font-family:Inter,sans-serif;"
                + "background:#0a0e1a;color:#e2e8f0;padding:0;margin:0'>"
                + "<div style='max-width:600px;margin:0 auto;padding:40px 24px'>"
                + "<div style='text-align:center;margin-bottom:32px'>"
                + "<span style='font-size:32px;font-weight:900;background:linear-gradient(135deg,#3b82f6,#8b5cf6);"
                + "-webkit-background-clip:text;-webkit-text-fill-color:transparent'>TradePulse</span></div>"
                + "<div style='background:#0d1117;border:1px solid #1e2433;border-radius:16px;padding:32px'>"
                + "<h2 style='color:#e2e8f0;margin:0 0 8px'>Hey " + name + " 👋</h2>"
                + "<p style='color:#64748b;margin:0 0 24px;font-size:14px'>Week: " + weekLabel + "</p>"
                + "<div style='background:#1e2433;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px'>"
                + "<div style='font-size:48px;margin-bottom:12px'>📭</div>"
                + "<h3 style='color:#e2e8f0;margin:0 0 8px'>No trades logged this week</h3>"
                + "<p style='color:#64748b;margin:0;font-size:14px'>Markets wait for no one — but discipline means knowing when to sit out too.</p>"
                + "</div>"
                + "<div style='border-left:3px solid #3b82f6;padding:12px 16px;background:rgba(59,130,246,0.08);border-radius:0 8px 8px 0;margin-bottom:24px'>"
                + "<p style='color:#94a3b8;margin:0;font-size:13px;line-height:1.6'>"
                + "<strong style='color:#3b82f6'>Reminder:</strong> Consistent journaling — even on non-trading days — "
                + "builds the pattern recognition that separates professional traders from amateurs.</p>"
                + "</div>"
                + "<div style='text-align:center'>"
                + "<a href='https://trading-journal-plum-gamma.vercel.app/journal' "
                + "style='display:inline-block;background:#3b82f6;color:#fff;padding:12px 28px;"
                + "border-radius:8px;text-decoration:none;font-weight:700;font-size:14px'>Open Journal →</a>"
                + "</div></div>"
                + "<p style='text-align:center;color:#334155;font-size:12px;margin-top:24px'>"
                + "You're receiving this because weekly report emails are enabled in your TradePulse profile.<br>"
                + "<a href='https://trading-journal-plum-gamma.vercel.app/profile' style='color:#475569'>Manage preferences</a>"
                + "</p></div></body></html>";
        emailService.sendHtmlEmail(email, subject, html);
    }

    // ── Stats ────────────────────────────────────────────────────────────────
    private WeekStats computeStats(List<Trade> closed) {
        WeekStats s = new WeekStats();
        s.totalTrades = closed.size();
        s.wins   = (int) closed.stream().filter(t -> t.getOutcomeTag() == Trade.OutcomeTag.PROFIT).count();
        s.losses = (int) closed.stream().filter(t -> t.getOutcomeTag() == Trade.OutcomeTag.LOSS).count();
        s.winRate = s.totalTrades > 0
                ? BigDecimal.valueOf(s.wins * 100.0 / s.totalTrades).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        s.totalPnl  = closed.stream().map(Trade::getPnlAbsolute).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        s.bestTrade = closed.stream().map(Trade::getPnlAbsolute).filter(Objects::nonNull).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        s.worstTrade= closed.stream().map(Trade::getPnlAbsolute).filter(Objects::nonNull).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        s.avgRR     = closed.stream().map(Trade::getActualRR).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        long rrCount = closed.stream().map(Trade::getActualRR).filter(Objects::nonNull).count();
        if (rrCount > 0) s.avgRR = s.avgRR.divide(BigDecimal.valueOf(rrCount), 2, RoundingMode.HALF_UP);
        s.slBreaches = (int) closed.stream().filter(t -> !t.isSlRespected()).count();
        return s;
    }

    // ── HTML ─────────────────────────────────────────────────────────────────
    private String buildReportHtml(String name, String weekLabel, WeekStats s, List<Trade> trades) {
        String pnlColor  = s.totalPnl.compareTo(BigDecimal.ZERO) >= 0 ? "#22c55e" : "#ef4444";
        String pnlPrefix = s.totalPnl.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "";
        String grade     = s.slBreaches == 0 ? "A" : s.slBreaches <= 1 ? "B" : "C";
        String gradeColor= grade.equals("A") ? "#22c55e" : grade.equals("B") ? "#f59e0b" : "#ef4444";

        StringBuilder tradeRows = new StringBuilder();
        for (Trade t : trades) {
            String tPnlColor = t.getPnlAbsolute() != null && t.getPnlAbsolute().compareTo(BigDecimal.ZERO) >= 0 ? "#22c55e" : "#ef4444";
            String tPnl = t.getPnlAbsolute() != null
                    ? (t.getPnlAbsolute().compareTo(BigDecimal.ZERO) >= 0 ? "+" : "") + "₹" + t.getPnlAbsolute().toPlainString() : "—";
            tradeRows.append("<tr>")
                    .append("<td style='padding:10px 8px;color:#94a3b8;border-bottom:1px solid #1e2433'>").append(t.getInstrument()).append("</td>")
                    .append("<td style='padding:10px 8px;color:#64748b;border-bottom:1px solid #1e2433'>").append(t.getTradeType()).append("</td>")
                    .append("<td style='padding:10px 8px;border-bottom:1px solid #1e2433;color:").append(t.getDirection() == Trade.Direction.BUY ? "#22c55e" : "#ef4444").append("'>").append(t.getDirection()).append("</td>")
                    .append("<td style='padding:10px 8px;color:").append(tPnlColor).append(";font-weight:700;border-bottom:1px solid #1e2433'>").append(tPnl).append("</td>")
                    .append("<td style='padding:10px 8px;border-bottom:1px solid #1e2433;color:#64748b'>").append(t.getOutcomeTag()).append("</td>")
                    .append("</tr>");
        }

        return "<!DOCTYPE html><html><body style='font-family:Inter,sans-serif;background:#0a0e1a;color:#e2e8f0;padding:0;margin:0'>"
                + "<div style='max-width:680px;margin:0 auto;padding:40px 24px'>"
                + "<div style='text-align:center;margin-bottom:32px'><span style='font-size:28px;font-weight:900;background:linear-gradient(135deg,#3b82f6,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent'>TradePulse</span>"
                + "<p style='color:#475569;font-size:13px;margin:6px 0 0'>Weekly Performance Report</p></div>"
                + "<div style='background:#0d1117;border:1px solid #1e2433;border-radius:16px;padding:32px;margin-bottom:20px'>"
                + "<h2 style='margin:0 0 4px;font-size:20px'>Hey " + name + " 👋</h2>"
                + "<p style='color:#64748b;margin:0 0 28px;font-size:14px'>" + weekLabel + "</p>"
                + "<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px'>"
                + kpiCard("Total P&L", pnlPrefix + "₹" + s.totalPnl.toPlainString(), pnlColor)
                + kpiCard("Win Rate", s.winRate + "%", s.winRate.compareTo(BigDecimal.valueOf(50)) >= 0 ? "#22c55e" : "#ef4444")
                + kpiCard("Trades", String.valueOf(s.totalTrades), "#94a3b8")
                + kpiCard("Best Trade", "+₹" + s.bestTrade.toPlainString(), "#22c55e")
                + kpiCard("Worst Trade", "₹" + s.worstTrade.toPlainString(), "#ef4444")
                + kpiCard("Discipline", grade, gradeColor)
                + "</div>"
                + "<h3 style='font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:#475569;margin:0 0 12px'>Trades This Week</h3>"
                + "<table style='width:100%;border-collapse:collapse;font-size:13px'><thead><tr>"
                + "<th style='text-align:left;padding:8px;color:#475569;font-size:11px;text-transform:uppercase;border-bottom:1px solid #1e2433'>Instrument</th>"
                + "<th style='text-align:left;padding:8px;color:#475569;font-size:11px;text-transform:uppercase;border-bottom:1px solid #1e2433'>Type</th>"
                + "<th style='text-align:left;padding:8px;color:#475569;font-size:11px;text-transform:uppercase;border-bottom:1px solid #1e2433'>Dir</th>"
                + "<th style='text-align:left;padding:8px;color:#475569;font-size:11px;text-transform:uppercase;border-bottom:1px solid #1e2433'>P&L</th>"
                + "<th style='text-align:left;padding:8px;color:#475569;font-size:11px;text-transform:uppercase;border-bottom:1px solid #1e2433'>Status</th>"
                + "</tr></thead><tbody>" + tradeRows + "</tbody></table>"
                + (s.slBreaches > 0
                    ? "<div style='margin-top:20px;background:rgba(239,68,68,.08);border-left:3px solid #ef4444;border-radius:0 8px 8px 0;padding:12px 16px'><p style='color:#f87171;margin:0;font-size:13px'>⚠ <strong>" + s.slBreaches + " SL breach(es)</strong> detected this week.</p></div>"
                    : "<div style='margin-top:20px;background:rgba(34,197,94,.08);border-left:3px solid #22c55e;border-radius:0 8px 8px 0;padding:12px 16px'><p style='color:#4ade80;margin:0;font-size:13px'>✓ Perfect discipline — no SL breaches. Keep it up.</p></div>")
                + "</div>"
                + "<div style='text-align:center;margin-bottom:20px'><a href='https://trading-journal-plum-gamma.vercel.app/analytics' style='display:inline-block;background:#3b82f6;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px'>View Full Analytics →</a></div>"
                + "<p style='text-align:center;color:#334155;font-size:12px'>PDF attached · <a href='https://trading-journal-plum-gamma.vercel.app/profile' style='color:#475569'>Manage preferences</a></p>"
                + "</div></body></html>";
    }

    private String kpiCard(String label, String value, String color) {
        return "<div style='background:#111827;border:1px solid #1e2433;border-radius:10px;padding:16px;text-align:center'>"
                + "<div style='font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px'>" + label + "</div>"
                + "<div style='font-size:22px;font-weight:700;color:" + color + "'>" + value + "</div></div>";
    }

    // ── PDF ──────────────────────────────────────────────────────────────────
    private byte[] buildReportPdf(String name, String weekLabel, WeekStats s, List<Trade> trades)
            throws DocumentException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 50, 50);
        PdfWriter.getInstance(doc, baos);
        doc.open();

        Font titleFont = new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD,   new BaseColor(59, 130, 246));
        Font headerFont= new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD,   new BaseColor(100, 116, 139));
        Font bodyFont  = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, new BaseColor(148, 163, 184));
        Font boldFont  = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD,   new BaseColor(226, 232, 240));
        Font greenFont = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD,   new BaseColor(34, 197, 94));
        Font redFont   = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD,   new BaseColor(239, 68, 68));
        Font smallGray = new Font(Font.FontFamily.HELVETICA,  9, Font.NORMAL, new BaseColor(71, 85, 105));

        Paragraph title = new Paragraph("TradePulse — Weekly Report", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        doc.add(title);

        Paragraph sub = new Paragraph(name + " · " + weekLabel, bodyFont);
        sub.setAlignment(Element.ALIGN_CENTER);
        sub.setSpacingBefore(4);
        sub.setSpacingAfter(20);
        doc.add(sub);

        // KPI table
        PdfPTable kpiTable = new PdfPTable(6);
        kpiTable.setWidthPercentage(100);
        kpiTable.setSpacingAfter(20);
        String[] kpiLabels = {"Total P&L", "Win Rate", "Trades", "Best Trade", "Worst Trade", "SL Breaches"};
        String[] kpiValues = {
            (s.totalPnl.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "") + "₹" + s.totalPnl.toPlainString(),
            s.winRate + "%", String.valueOf(s.totalTrades),
            "+₹" + s.bestTrade.toPlainString(), "₹" + s.worstTrade.toPlainString(),
            String.valueOf(s.slBreaches)
        };
        for (int i = 0; i < 6; i++) {
            PdfPCell cell = new PdfPCell();
            cell.setBorderColor(new BaseColor(30, 36, 51));
            cell.setBackgroundColor(new BaseColor(13, 17, 23));
            cell.setPadding(10);
            Paragraph lbl = new Paragraph(kpiLabels[i], smallGray);
            lbl.setAlignment(Element.ALIGN_CENTER);
            cell.addElement(lbl);
            Font valFont = i == 0 ? (s.totalPnl.compareTo(BigDecimal.ZERO) >= 0 ? greenFont : redFont)
                         : (i == 4 || (i == 5 && s.slBreaches > 0)) ? redFont : greenFont;
            Paragraph val = new Paragraph(kpiValues[i], valFont);
            val.setAlignment(Element.ALIGN_CENTER);
            cell.addElement(val);
            kpiTable.addCell(cell);
        }
        doc.add(kpiTable);

        // Trades table
        Paragraph tradeHeader = new Paragraph("Trades This Week", headerFont);
        tradeHeader.setSpacingAfter(8);
        doc.add(tradeHeader);

        PdfPTable table = new PdfPTable(new float[]{2.5f, 1.2f, 0.8f, 1.5f, 1.5f, 1.2f});
        table.setWidthPercentage(100);
        for (String col : new String[]{"Instrument", "Type", "Dir", "Entry", "P&L", "Status"}) {
            PdfPCell hCell = new PdfPCell(new Phrase(col, headerFont));
            hCell.setBackgroundColor(new BaseColor(17, 24, 39));
            hCell.setBorderColor(new BaseColor(30, 36, 51));
            hCell.setPadding(8);
            table.addCell(hCell);
        }
        for (Trade t : trades) {
            String pnlStr = t.getPnlAbsolute() != null
                    ? (t.getPnlAbsolute().compareTo(BigDecimal.ZERO) >= 0 ? "+" : "") + "₹" + t.getPnlAbsolute().toPlainString() : "—";
            Font pnlFont = t.getPnlAbsolute() != null && t.getPnlAbsolute().compareTo(BigDecimal.ZERO) >= 0
                    ? new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, new BaseColor(34, 197, 94))
                    : new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, new BaseColor(239, 68, 68));
            addCell(table, t.getInstrument(), boldFont);
            addCell(table, t.getTradeType()  != null ? t.getTradeType().name()  : "—", bodyFont);
            addCell(table, t.getDirection()  != null ? t.getDirection().name()  : "—", bodyFont);
            addCell(table, t.getEntryPrice() != null ? "₹" + t.getEntryPrice().toPlainString() : "—", bodyFont);
            addCell(table, pnlStr, pnlFont);
            addCell(table, t.getOutcomeTag() != null ? t.getOutcomeTag().name() : "—", bodyFont);
        }
        doc.add(table);

        Paragraph footer = new Paragraph("\nGenerated by TradePulse · " + LocalDate.now().format(DATE_FMT)
                + " · trading-journal-plum-gamma.vercel.app", smallGray);
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(20);
        doc.add(footer);

        doc.close();
        return baos.toByteArray();
    }

    private void addCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorderColor(new BaseColor(30, 36, 51));
        cell.setBackgroundColor(new BaseColor(13, 17, 23));
        cell.setPadding(8);
        table.addCell(cell);
    }

    static class WeekStats {
        int        totalTrades, wins, losses, slBreaches;
        BigDecimal winRate    = BigDecimal.ZERO;
        BigDecimal totalPnl   = BigDecimal.ZERO;
        BigDecimal bestTrade  = BigDecimal.ZERO;
        BigDecimal worstTrade = BigDecimal.ZERO;
        BigDecimal avgRR      = BigDecimal.ZERO;
    }
}
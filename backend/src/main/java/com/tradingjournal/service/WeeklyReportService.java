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

    private static final DateTimeFormatter DATE_FMT  = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final String            APP_NAME  = "Market Saga";
    private static final String            APP_URL   = "https://marketsaga.site";

    // Saturday 8 AM UTC
    @Scheduled(cron = "0 0 8 * * SAT")
    public void sendWeeklyReports() {
        log.info("Starting Saturday weekly report job...");
        LocalDate weekEnd   = LocalDate.now().minusDays(1);
        LocalDate weekStart = weekEnd.minusDays(6);
        LocalDateTime from  = weekStart.atStartOfDay();
        LocalDateTime to    = weekEnd.atTime(23, 59, 59);
        List<User> users = userRepository.findAll().stream()
                .filter(u -> u.isActive() && u.isWeeklyReportEmail()).collect(Collectors.toList());
        log.info("Sending reports to {} users ({} to {})", users.size(), weekStart, weekEnd);
        for (User user : users) {
            try { sendWeeklyReportForUser(user, from, to, weekStart, weekEnd); }
            catch (Exception e) { log.error("Failed for {}: {}", user.getEmail(), e.getMessage()); }
        }
    }

    public void sendWeeklyReportForCurrentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        LocalDate weekEnd   = LocalDate.now();
        LocalDate weekStart = weekEnd.minusDays(6);
        sendWeeklyReportForUser(user, weekStart.atStartOfDay(), weekEnd.atTime(23, 59, 59), weekStart, weekEnd);
    }

    public byte[] generateCustomReport(String userId, LocalDate from, LocalDate to, boolean sendEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        List<Trade> closed = tradeRepository
                .findByUserIdAndTradeDateBetweenOrderByTradeDateDesc(userId, from.atStartOfDay(), to.atTime(23,59,59))
                .stream().filter(t -> t.getOutcomeTag() != null
                        && t.getOutcomeTag() != Trade.OutcomeTag.OPEN
                        && t.getOutcomeTag() != Trade.OutcomeTag.NO_TRADE).collect(Collectors.toList());

        String userName   = user.getEffectiveDisplayName();
        String rangeLabel = from.format(DATE_FMT) + " – " + to.format(DATE_FMT);
        WeekStats stats   = computeStats(closed);
        String htmlBody   = buildReportHtml(userName, rangeLabel, stats, closed);
        byte[] pdfBytes;

        try { pdfBytes = buildReportPdf(userName, rangeLabel, stats, closed); }
        catch (Exception e) { throw new RuntimeException("PDF generation failed: " + e.getMessage(), e); }

        if (sendEmail) {
            String filename = "MarketSaga_Report_" + from + "_to_" + to + ".pdf";
            String subject  = "📊 " + APP_NAME + " Performance Report — " + rangeLabel;
            try { emailService.sendEmailWithAttachment(user.getEmail(), subject, htmlBody, pdfBytes, filename); }
            catch (Exception e) { emailService.sendHtmlEmail(user.getEmail(), subject, htmlBody); }
        }
        return pdfBytes;
    }

    void sendWeeklyReportForUser(User user, LocalDateTime from, LocalDateTime to,
                                  LocalDate weekStart, LocalDate weekEnd) {
        List<Trade> weekTrades = tradeRepository
                .findByUserIdAndTradeDateBetweenOrderByTradeDateDesc(user.getId(), from, to);
        String userName  = user.getEffectiveDisplayName();
        String weekLabel = weekStart.format(DATE_FMT) + " – " + weekEnd.format(DATE_FMT);

        if (weekTrades.isEmpty()) { sendNoActivityEmail(user.getEmail(), userName, weekLabel); return; }

        List<Trade> closed = weekTrades.stream().filter(t -> t.getOutcomeTag() != null
                && t.getOutcomeTag() != Trade.OutcomeTag.OPEN
                && t.getOutcomeTag() != Trade.OutcomeTag.NO_TRADE).collect(Collectors.toList());

        WeekStats stats = computeStats(closed);
        String htmlBody = buildReportHtml(userName, weekLabel, stats, closed);
        String subject  = "📊 " + APP_NAME + " Weekly Report — " + weekLabel;

        try {
            byte[] pdf = buildReportPdf(userName, weekLabel, stats, closed);
            emailService.sendEmailWithAttachment(user.getEmail(), subject, htmlBody, pdf,
                    "MarketSaga_Report_" + weekStart + ".pdf");
        } catch (Exception e) {
            log.warn("PDF failed for {}, HTML only: {}", user.getEmail(), e.getMessage());
            emailService.sendHtmlEmail(user.getEmail(), subject, htmlBody);
        }
    }

    // ── No-activity nudge ─────────────────────────────────────────────────
    private void sendNoActivityEmail(String email, String name, String weekLabel) {
        String shield = shield(32, 38);
        String html = page(shield,
                "<h2 style='color:#e2e8f0;margin:0 0 8px'>Hey " + name + " 👋</h2>"
                + "<p style='color:#64748b;margin:0 0 24px;font-size:14px'>Week: " + weekLabel + "</p>"
                + "<div style='background:#111827;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px'>"
                + "<div style='font-size:48px;margin-bottom:12px'>📭</div>"
                + "<h3 style='color:#e2e8f0;margin:0 0 8px'>No trades logged this week</h3>"
                + "<p style='color:#64748b;margin:0;font-size:14px'>Markets wait for no one — but discipline means knowing when to sit out too.</p>"
                + "</div>"
                + "<div style='border-left:3px solid #0D9488;padding:12px 16px;background:rgba(13,148,136,.08);border-radius:0 8px 8px 0;margin-bottom:24px'>"
                + "<p style='color:#5EEAD4;margin:0;font-size:13px;line-height:1.6'>"
                + "<strong>Reminder:</strong> Consistent journaling — even on non-trading days — builds the pattern recognition that separates professionals.</p>"
                + "</div>"
                + "<div style='text-align:center'><a href='" + APP_URL + "/journal' "
                + "style='display:inline-block;background:#0D9488;color:#fff;padding:12px 28px;"
                + "border-radius:8px;text-decoration:none;font-weight:700;font-size:14px'>Open Journal →</a></div>");
        emailService.sendHtmlEmail(email, APP_NAME + " — No trades logged this week", html);
    }

    // ── HTML email body ───────────────────────────────────────────────────
    private String buildReportHtml(String name, String rangeLabel, WeekStats s, List<Trade> trades) {
        String pnlColor  = s.totalPnl.compareTo(BigDecimal.ZERO) >= 0 ? "#22c55e" : "#ef4444";
        String pnlPrefix = s.totalPnl.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "";
        String grade     = s.slBreaches == 0 ? "A" : s.slBreaches <= 1 ? "B" : "C";
        String gradeColor= "A".equals(grade) ? "#22c55e" : "B".equals(grade) ? "#f59e0b" : "#ef4444";

        StringBuilder rows = new StringBuilder();
        for (Trade t : trades) {
            String tc  = t.getPnlAbsolute() != null && t.getPnlAbsolute().compareTo(BigDecimal.ZERO) >= 0 ? "#22c55e" : "#ef4444";
            String tPnl= t.getPnlAbsolute() != null
                    ? (t.getPnlAbsolute().compareTo(BigDecimal.ZERO) >= 0 ? "+" : "") + "₹" + t.getPnlAbsolute().toPlainString() : "—";
            rows.append("<tr>")
                .append("<td style='padding:10px 8px;color:#94a3b8;border-bottom:1px solid #1e2433'>").append(t.getInstrument()).append("</td>")
                .append("<td style='padding:10px 8px;color:#64748b;border-bottom:1px solid #1e2433'>").append(t.getTradeType()).append("</td>")
                .append("<td style='padding:10px 8px;border-bottom:1px solid #1e2433;color:").append(t.getDirection() == Trade.Direction.BUY ? "#22c55e" : "#ef4444").append("'>").append(t.getDirection()).append("</td>")
                .append("<td style='padding:10px 8px;color:").append(tc).append(";font-weight:700;border-bottom:1px solid #1e2433'>").append(tPnl).append("</td>")
                .append("<td style='padding:10px 8px;border-bottom:1px solid #1e2433;color:#64748b'>").append(t.getOutcomeTag()).append("</td>")
                .append("</tr>");
        }

        String body =
                "<h2 style='margin:0 0 4px;font-size:20px'>Hey " + name + " 👋</h2>"
                + "<p style='color:#64748b;margin:0 0 28px;font-size:14px'>" + rangeLabel + "</p>"
                + "<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px'>"
                + kpiCard("Total P&L",   pnlPrefix + "₹" + s.totalPnl.toPlainString(), pnlColor)
                + kpiCard("Win Rate",    s.winRate + "%", s.winRate.compareTo(BigDecimal.valueOf(50)) >= 0 ? "#22c55e" : "#ef4444")
                + kpiCard("Trades",      String.valueOf(s.totalTrades), "#94a3b8")
                + kpiCard("Best Trade",  "+₹" + s.bestTrade.toPlainString(), "#22c55e")
                + kpiCard("Worst Trade", "₹" + s.worstTrade.toPlainString(), "#ef4444")
                + kpiCard("Discipline",  grade, gradeColor)
                + "</div>"
                + "<h3 style='font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:#475569;margin:0 0 12px'>Trades This Period</h3>"
                + "<table style='width:100%;border-collapse:collapse;font-size:13px'><thead><tr>"
                + thCell("Instrument") + thCell("Type") + thCell("Dir") + thCell("P&L") + thCell("Status")
                + "</tr></thead><tbody>" + rows + "</tbody></table>"
                + (s.slBreaches > 0
                    ? "<div style='margin-top:20px;background:rgba(239,68,68,.08);border-left:3px solid #ef4444;border-radius:0 8px 8px 0;padding:12px 16px'><p style='color:#f87171;margin:0;font-size:13px'>⚠ <strong>" + s.slBreaches + " SL breach(es)</strong> this period.</p></div>"
                    : "<div style='margin-top:20px;background:rgba(13,148,136,.08);border-left:3px solid #0D9488;border-radius:0 8px 8px 0;padding:12px 16px'><p style='color:#5EEAD4;margin:0;font-size:13px'>✓ Perfect discipline — no SL breaches. Keep it up.</p></div>")
                + "<div style='text-align:center;margin-top:24px'>"
                + "<a href='" + APP_URL + "/analytics' style='display:inline-block;background:#0D9488;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px'>View Full Analytics →</a>"
                + "</div>";

        return page(shield(28, 33), body);
    }

    // ── Shared email page wrapper ─────────────────────────────────────────
    private String page(String shieldSvg, String bodyHtml) {
        return "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;background:#070b14;color:#e2e8f0;margin:0;padding:0'>"
            + "<table width='100%' cellpadding='0' cellspacing='0'><tr><td align='center' style='padding:40px 16px'>"
            + "<table width='620' cellpadding='0' cellspacing='0' style='max-width:620px'>"
            // Brand header
            + "<tr><td align='center' style='padding-bottom:28px'>"
            + "<table cellpadding='0' cellspacing='0'><tr>"
            + "<td style='padding-right:12px;vertical-align:middle'>" + shieldSvg + "</td>"
            + "<td style='vertical-align:middle'>"
            + "<div style='font-size:24px;font-weight:700;color:white'>Market<span style='color:#5EEAD4;font-weight:400'>Saga</span></div>"
            + "<div style='font-size:7px;font-weight:800;color:#475569;letter-spacing:3px;margin-top:2px'>TRADE WITH CLARITY</div>"
            + "</td></tr></table></td></tr>"
            // Badge
            + "<tr><td align='center' style='padding-bottom:16px'>"
            + "<div style='display:inline-block;background:rgba(13,148,136,.15);color:#5EEAD4;"
            + "border:1px solid rgba(13,148,136,.3);border-radius:100px;padding:5px 16px;"
            + "font-size:11px;font-weight:800;letter-spacing:2px'>📊 PERFORMANCE REPORT</div>"
            + "</td></tr>"
            // Card
            + "<tr><td style='background:#0d1117;border:1px solid #1e2433;border-radius:16px;padding:32px'>"
            + bodyHtml + "</td></tr>"
            // Footer
            + "<tr><td align='center' style='padding-top:20px'>"
            + "<p style='font-size:11px;color:#334155;margin:0'>Sent from "
            + "<a href='" + APP_URL + "' style='color:#0D9488;text-decoration:none'>" + APP_URL + "</a>"
            + " · <a href='" + APP_URL + "/profile' style='color:#334155;text-decoration:none'>Manage preferences</a></p>"
            + "</td></tr></table></td></tr></table></body></html>";
    }

    private String shield(int w, int h) {
        return "<svg width='" + w + "' height='" + h + "' viewBox='0 0 100 120' fill='none' xmlns='http://www.w3.org/2000/svg'>"
                + "<path d='M50 15L15 30V65C15 85 50 105 50 105C50 105 85 85 85 65V30L50 15Z' fill='#0D9488'/>"
                + "<path d='M35 68L48 50L58 60L75 35' stroke='#5EEAD4' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/>"
                + "<circle cx='75' cy='35' r='7' fill='white'/></svg>";
    }

    private String kpiCard(String label, String value, String color) {
        return "<div style='background:#111827;border:1px solid #1e2433;border-radius:10px;padding:16px;text-align:center'>"
                + "<div style='font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px'>" + label + "</div>"
                + "<div style='font-size:22px;font-weight:700;color:" + color + "'>" + value + "</div></div>";
    }

    private String thCell(String label) {
        return "<th style='text-align:left;padding:8px;color:#475569;font-size:11px;"
                + "text-transform:uppercase;border-bottom:1px solid #1e2433'>" + label + "</th>";
    }

    // ── PDF ───────────────────────────────────────────────────────────────
    public byte[] buildReportPdf(String name, String rangeLabel, WeekStats s, List<Trade> trades)
            throws DocumentException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 50, 50);
        PdfWriter.getInstance(doc, baos);
        doc.open();

        BaseColor teal    = new BaseColor(13,  148, 136);
        BaseColor tealLt  = new BaseColor(94,  234, 212);
        BaseColor slate6  = new BaseColor(71,   85, 105);
        BaseColor slate4  = new BaseColor(148, 163, 184);
        BaseColor ivory   = new BaseColor(226, 232, 240);
        BaseColor green   = new BaseColor(34,  197,  94);
        BaseColor red     = new BaseColor(239,  68,  68);
        BaseColor dark    = new BaseColor(13,   17,  23);
        BaseColor border  = new BaseColor(30,   36,  51);
        BaseColor headBg  = new BaseColor(17,   24,  39);

        Font brand  = new Font(Font.FontFamily.HELVETICA, 28, Font.BOLD,   teal);
        Font saga   = new Font(Font.FontFamily.HELVETICA, 28, Font.NORMAL, tealLt);
        Font tag    = new Font(Font.FontFamily.HELVETICA,  8, Font.BOLD,   slate6);
        Font hdr    = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD,   slate6);
        Font body   = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, slate4);
        Font bold   = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD,   ivory);
        Font gf     = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD,   green);
        Font rf     = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD,   red);
        Font tf     = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD,   teal);
        Font small  = new Font(Font.FontFamily.HELVETICA,  9, Font.NORMAL, slate6);
        Font badge  = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD,   tealLt);

        // ── Wordmark ──────────────────────────────────────────────────────
        Phrase wordmark = new Phrase();
        wordmark.add(new Chunk("Market", brand));
        wordmark.add(new Chunk("Saga",   saga));
        Paragraph brandPara = new Paragraph(wordmark);
        brandPara.setAlignment(Element.ALIGN_CENTER);
        doc.add(brandPara);

        Paragraph tagPara = new Paragraph("TRADE WITH CLARITY", tag);
        tagPara.setAlignment(Element.ALIGN_CENTER);
        tagPara.setSpacingAfter(4);
        doc.add(tagPara);

        Paragraph reportBadge = new Paragraph("PERFORMANCE REPORT", badge);
        reportBadge.setAlignment(Element.ALIGN_CENTER);
        reportBadge.setSpacingAfter(4);
        doc.add(reportBadge);

        Paragraph sub = new Paragraph(name + " · " + rangeLabel, body);
        sub.setAlignment(Element.ALIGN_CENTER);
        sub.setSpacingBefore(2);
        sub.setSpacingAfter(16);
        doc.add(sub);

        doc.add(new Chunk(new LineSeparator(1f, 100f, border, Element.ALIGN_CENTER, -2)));

        // ── KPI ───────────────────────────────────────────────────────────
        PdfPTable kpi = new PdfPTable(6);
        kpi.setWidthPercentage(100); kpi.setSpacingBefore(16); kpi.setSpacingAfter(20);
        String[] kl = {"Total P&L","Win Rate","Trades","Best Trade","Worst Trade","SL Breaches"};
        String[] kv = {
            (s.totalPnl.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "") + "₹" + s.totalPnl.toPlainString(),
            s.winRate + "%", String.valueOf(s.totalTrades),
            "+₹" + s.bestTrade.toPlainString(), "₹" + s.worstTrade.toPlainString(),
            String.valueOf(s.slBreaches)
        };
        for (int i = 0; i < 6; i++) {
            PdfPCell cell = new PdfPCell();
            cell.setBorderColor(border); cell.setBackgroundColor(headBg); cell.setPadding(10);
            Paragraph lbl = new Paragraph(kl[i], small); lbl.setAlignment(Element.ALIGN_CENTER); cell.addElement(lbl);
            Font vf = i == 0 ? (s.totalPnl.compareTo(BigDecimal.ZERO) >= 0 ? gf : rf)
                    : i == 2 ? new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD, slate4)
                    : (i == 4 || (i == 5 && s.slBreaches > 0)) ? rf : gf;
            Paragraph val = new Paragraph(kv[i], vf); val.setAlignment(Element.ALIGN_CENTER); cell.addElement(val);
            kpi.addCell(cell);
        }
        doc.add(kpi);

        // ── Trade table ───────────────────────────────────────────────────
        Paragraph th = new Paragraph("TRADES THIS PERIOD", hdr); th.setSpacingAfter(8); doc.add(th);
        PdfPTable table = new PdfPTable(new float[]{2.5f, 1.2f, 0.8f, 1.5f, 1.5f, 1.2f});
        table.setWidthPercentage(100);
        for (String col : new String[]{"Instrument","Type","Dir","Entry","P&L","Status"}) {
            PdfPCell hc = new PdfPCell(new Phrase(col, hdr));
            hc.setBackgroundColor(headBg); hc.setBorderColor(border); hc.setPadding(8);
            table.addCell(hc);
        }
        for (Trade t : trades) {
            String pnlStr = t.getPnlAbsolute() != null
                    ? (t.getPnlAbsolute().compareTo(BigDecimal.ZERO) >= 0 ? "+" : "") + "₹" + t.getPnlAbsolute().toPlainString() : "—";
            Font pf = t.getPnlAbsolute() != null && t.getPnlAbsolute().compareTo(BigDecimal.ZERO) >= 0
                    ? new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, green)
                    : new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, red);
            Font df = t.getDirection() == Trade.Direction.BUY
                    ? new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, green)
                    : new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, red);
            addPdfCell(table, t.getInstrument(), bold, dark, border);
            addPdfCell(table, t.getTradeType()  != null ? t.getTradeType().name()  : "—", body, dark, border);
            addPdfCell(table, t.getDirection()  != null ? t.getDirection().name()  : "—", df,   dark, border);
            addPdfCell(table, t.getEntryPrice() != null ? "₹" + t.getEntryPrice().toPlainString() : "—", body, dark, border);
            addPdfCell(table, pnlStr, pf, dark, border);
            addPdfCell(table, t.getOutcomeTag() != null ? t.getOutcomeTag().name() : "—", body, dark, border);
        }
        doc.add(table);

        // Discipline note
        Paragraph disc = s.slBreaches == 0
                ? new Paragraph("✓ Perfect discipline — no SL breaches this period.", tf)
                : new Paragraph("⚠ " + s.slBreaches + " SL breach(es) detected.", new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, red));
        disc.setSpacingBefore(12);
        doc.add(disc);

        // Footer
        Paragraph footer = new Paragraph(
                "\nGenerated by Market Saga · " + LocalDate.now().format(DATE_FMT) + " · marketsaga.site", small);
        footer.setAlignment(Element.ALIGN_CENTER); footer.setSpacingBefore(24);
        doc.add(footer);

        doc.close();
        return baos.toByteArray();
    }

    private void addPdfCell(PdfPTable t, String text, Font font, BaseColor bg, BaseColor border) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorderColor(border); cell.setBackgroundColor(bg); cell.setPadding(8);
        t.addCell(cell);
    }

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
        long rc = closed.stream().map(Trade::getActualRR).filter(Objects::nonNull).count();
        if (rc > 0) s.avgRR = s.avgRR.divide(BigDecimal.valueOf(rc), 2, RoundingMode.HALF_UP);
        s.slBreaches = (int) closed.stream().filter(t -> !t.isSlRespected()).count();
        return s;
    }

    static class WeekStats {
        int totalTrades, wins, losses, slBreaches;
        BigDecimal winRate = BigDecimal.ZERO, totalPnl = BigDecimal.ZERO,
                   bestTrade = BigDecimal.ZERO, worstTrade = BigDecimal.ZERO, avgRR = BigDecimal.ZERO;
    }
}
package com.tradingjournal.service;

import com.tradingjournal.model.Trade;
import com.tradingjournal.model.User;
import com.tradingjournal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

/**
 * Sends email alerts triggered by trade events.
 * All @Async — never blocks the API response.
 *
 * Triggered when emailNotifications = true:
 * 1. New trade logged          → confirmation with trade details
 * 2. Open trade closed         → P&L result email
 * 3. Discipline break detected → alert (SL ignored, FOMO, Revenge)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TradeNotificationService {

    private final UserRepository userRepository;
    private final EmailService   emailService;

    private static final DateTimeFormatter FMT     = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm");
    private static final String            APP_URL = "https://marketsaga.site";


    // ── 1. New trade logged ───────────────────────────────────────────────────
    @Async
    public void onTradeLogged(Trade trade, String userId) {
        User user = getUser(userId);
        if (user == null || !user.isEmailNotifications()) return;

        String name = displayName(user);
        String dir  = trade.getDirection() != null ? trade.getDirection().name() : "—";

        String html = page(
            "<h2 style='margin:0 0 6px'>Trade Logged 📝</h2>"
            + "<p style='color:#64748b;margin:0 0 20px;font-size:14px'>"
            + (trade.getTradeDate() != null ? trade.getTradeDate().format(FMT) : "") + "</p>"
            + grid(
                cell("Instrument", bold(trade.getInstrument())),
                cell("Direction",  colored(dir, "BUY".equals(dir) ? "#22c55e" : "#ef4444")),
                cell("Entry",      "₹" + str(trade.getEntryPrice())),
                cell("Stop Loss",  colored("₹" + str(trade.getStopLoss()), "#f59e0b")),
                cell("Target",     colored("₹" + str(trade.getTarget()), "#22c55e")),
                cell("Setup",      trade.getSetupType() != null ? trade.getSetupType().name() : "—")
            )
            + tip("Trade logged. Set a reminder to review it after it closes.")
            + btn("View in Journal →", APP_URL + "/trades")
            + footer(name)
        );

        emailService.sendHtmlEmail(user.getEmail(),
                "📝 Trade Logged — " + trade.getInstrument(), html);
        log.info("Trade-logged email → {}", user.getEmail());
    }

    // ── 2. Trade closed ───────────────────────────────────────────────────────
    @Async
    public void onTradeClosed(Trade trade, String userId) {
        User user = getUser(userId);
        if (user == null || !user.isEmailNotifications()) return;

        String name   = displayName(user);
        boolean profit = trade.getPnlAbsolute() != null
                && trade.getPnlAbsolute().compareTo(BigDecimal.ZERO) >= 0;
        String pnl    = trade.getPnlAbsolute() != null
                ? (profit ? "+" : "") + "₹" + trade.getPnlAbsolute().toPlainString() : "—";
        String color  = profit ? "#22c55e" : "#ef4444";

        String html = page(
            "<h2 style='margin:0 0 6px'>Trade Closed " + (profit ? "✅" : "❌") + "</h2>"
            + "<p style='color:#64748b;margin:0 0 16px;font-size:14px'>"
            + trade.getInstrument() + " · "
            + (trade.getExitDate() != null ? trade.getExitDate().format(FMT) : "") + "</p>"
            // Big P&L card
            + "<div style='background:#111827;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px'>"
            + "<div style='font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px'>Net P&L</div>"
            + "<div style='font-size:38px;font-weight:900;color:" + color + "'>" + pnl + "</div>"
            + "<div style='font-size:13px;color:#64748b;margin-top:4px'>"
            + (trade.getOutcomeTag() != null ? trade.getOutcomeTag().name() : "") + "</div></div>"
            + grid(
                cell("Entry",   "₹" + str(trade.getEntryPrice())),
                cell("Exit",    "₹" + str(trade.getExitPrice())),
                cell("R:R",     trade.getActualRR() != null ? trade.getActualRR().toPlainString() : "—"),
                cell("Setup",   trade.getSetupType() != null ? trade.getSetupType().name() : "—"),
                cell("SL Kept", trade.isSlRespected()
                        ? colored("✓ Yes", "#22c55e") : colored("✗ No", "#ef4444")),
                cell("Emotion", trade.getEmotionalState() != null
                        ? trade.getEmotionalState().name() : "—")
            )
            + tip("Add your post-trade reflection while the trade is fresh — it compounds your learning over time.")
            + btn("Add Reflection →", APP_URL + "/trades")
            + footer(name)
        );

        emailService.sendHtmlEmail(user.getEmail(),
                (profit ? "✅ PROFIT — " : "❌ LOSS — ") + trade.getInstrument() + " (" + pnl + ")", html);
        log.info("Trade-closed email → {} ({})", user.getEmail(), pnl);
    }

    // ── 3. Discipline break alert ─────────────────────────────────────────────
    @Async
    public void onDisciplineBreak(Trade trade, String userId, String reason) {
        User user = getUser(userId);
        if (user == null || !user.isEmailNotifications()) return;

        String name = displayName(user);

        String html = page(
            "<div style='background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);"
            + "border-radius:10px;padding:16px;margin-bottom:20px'>"
            + "<div style='font-size:16px;font-weight:700;color:#ef4444;margin-bottom:4px'>⚠️ Discipline Break Detected</div>"
            + "<div style='font-size:13px;color:#f87171'>" + reason + "</div></div>"
            + "<h2 style='margin:0 0 6px'>" + trade.getInstrument() + "</h2>"
            + "<p style='color:#64748b;margin:0 0 20px;font-size:14px'>"
            + (trade.getTradeDate() != null ? trade.getTradeDate().format(FMT) : "") + "</p>"
            + grid(
                cell("Emotion",  trade.getEmotionalState() != null
                        ? colored(trade.getEmotionalState().name(), "#f59e0b") : "—"),
                cell("SL Kept",  trade.isSlRespected()
                        ? colored("✓ Yes", "#22c55e") : colored("✗ No", "#ef4444")),
                cell("Setup",    trade.getSetupType() != null ? trade.getSetupType().name() : "—"),
                cell("P&L",      trade.getPnlAbsolute() != null
                        ? "₹" + trade.getPnlAbsolute().toPlainString() : "Pending")
            )
            + "<div style='background:rgba(245,158,11,.08);border-left:3px solid #f59e0b;"
            + "border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:20px'>"
            + "<p style='color:#fbbf24;margin:0;font-size:13px;line-height:1.6'>"
            + "<strong>Action:</strong> Review this in your journal. Spotting the pattern early breaks it.</p></div>"
            + btn("Open Journal →", APP_URL + "/journal")
            + footer(name)
        );

        emailService.sendHtmlEmail(user.getEmail(),
                "⚠️ Discipline Alert — " + trade.getInstrument(), html);
        log.info("Discipline-break email → {} ({})", user.getEmail(), reason);
    }

    // ── HTML helpers ──────────────────────────────────────────────────────────

    private String page(String body) {
        return "<!DOCTYPE html><html><body style='font-family:Inter,sans-serif;background:#0a0e1a;"
                + "color:#e2e8f0;padding:0;margin:0'><div style='max-width:600px;margin:0 auto;padding:40px 24px'>"
                + "<div style='text-align:center;margin-bottom:32px'>"
                + "<span style='font-size:26px;font-weight:900;background:linear-gradient(135deg,#3b82f6,#8b5cf6);"
                + "-webkit-background-clip:text;-webkit-text-fill-color:transparent'>MarketSaga</span></div>"
                + "<div style='background:#0d1117;border:1px solid #1e2433;border-radius:16px;padding:28px'>"
                + body + "</div></div></body></html>";
    }

    private String grid(String... cells) {
        StringBuilder sb = new StringBuilder(
                "<div style='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px'>");
        for (String c : cells) sb.append(c);
        return sb.append("</div>").toString();
    }

    private String cell(String label, String value) {
        return "<div style='background:#111827;border:1px solid #1e2433;border-radius:8px;padding:12px'>"
                + "<div style='font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:.5px;"
                + "margin-bottom:3px'>" + label + "</div>"
                + "<div style='font-size:14px;color:#94a3b8'>" + value + "</div></div>";
    }

    private String tip(String text) {
        return "<div style='background:rgba(59,130,246,.08);border-left:3px solid #3b82f6;"
                + "border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:20px'>"
                + "<p style='color:#94a3b8;margin:0;font-size:13px;line-height:1.6'>" + text + "</p></div>";
    }

    private String btn(String label, String url) {
        return "<div style='text-align:center;margin-bottom:16px'>"
                + "<a href='" + url + "' style='display:inline-block;background:#3b82f6;color:#fff;"
                + "padding:11px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px'>"
                + label + "</a></div>";
    }

    private String footer(String name) {
        return "<p style='text-align:center;color:#334155;font-size:12px;margin:16px 0 0'>"
                + "Sent to " + name + " · "
                + "<a href='" + APP_URL + "/profile' style='color:#475569'>Manage preferences</a></p>";
    }

    private String bold(String s)              { return "<strong style='color:#e2e8f0'>" + s + "</strong>"; }
    private String colored(String s, String c) { return "<span style='color:" + c + ";font-weight:700'>" + s + "</span>"; }
    private String str(BigDecimal v)           { return v != null ? v.toPlainString() : "—"; }

    private User getUser(String userId) {
        return userRepository.findById(userId).orElse(null);
    }

    private String displayName(User user) {
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) return user.getDisplayName();
        if (user.getFullName()    != null && !user.getFullName().isBlank())    return user.getFullName();
        if (user.getFirstName()   != null && !user.getFirstName().isBlank())   return user.getFirstName();
        return user.getEmail().split("@")[0];
    }
}

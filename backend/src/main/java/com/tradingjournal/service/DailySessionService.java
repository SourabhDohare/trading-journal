package com.tradingjournal.service;

import com.tradingjournal.dto.DailySessionDTO;
import com.tradingjournal.model.DailySession;
import com.tradingjournal.repository.DailySessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DailySessionService {

    private final DailySessionRepository repository;

    // ── Save or update today's session (upsert by userId + date) ─────────────
    public DailySessionDTO.Response saveSession(String userId, DailySessionDTO.SaveRequest req) {
        LocalDate date = req.getSessionDate() != null ? req.getSessionDate() : LocalDate.now();

        // Find existing session for this date, or create new
        DailySession session = repository.findByUserIdAndSessionDate(userId, date)
                .orElse(DailySession.builder()
                        .userId(userId)
                        .sessionDate(date)
                        .build());

        // Update all fields
        if (req.getMarketBias()      != null) session.setMarketBias(req.getMarketBias());
        if (req.getPreMarketNotes()  != null) session.setPreMarketNotes(req.getPreMarketNotes());
        if (req.getNewsToWatch()     != null) session.setNewsToWatch(req.getNewsToWatch());
        if (req.getLessonLearned()   != null) session.setLessonLearned(req.getLessonLearned());
        if (req.getSessionMood()     != null) session.setSessionMood(req.getSessionMood());
        if (req.getDisciplineScore() != null) session.setDisciplineScore(req.getDisciplineScore());
        if (req.getAdditionalNotes() != null) session.setAdditionalNotes(req.getAdditionalNotes());

        DailySession saved = repository.save(session);
        return toResponse(saved);
    }

    // ── Get today's session ───────────────────────────────────────────────────
    public DailySessionDTO.Response getTodaySession(String userId) {
        return repository.findByUserIdAndSessionDate(userId, LocalDate.now())
                .map(this::toResponse)
                .orElse(null);
    }

    // ── Get session for a specific date ───────────────────────────────────────
    public DailySessionDTO.Response getSessionByDate(String userId, LocalDate date) {
        return repository.findByUserIdAndSessionDate(userId, date)
                .map(this::toResponse)
                .orElse(null);
    }

    // ── Get all sessions (history) ────────────────────────────────────────────
    public List<DailySessionDTO.Response> getAllSessions(String userId) {
        return repository.findByUserIdOrderBySessionDateDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Get last N sessions ───────────────────────────────────────────────────
    public List<DailySessionDTO.Response> getRecentSessions(String userId, int limit) {
        return repository.findByUserIdOrderBySessionDateDesc(userId)
                .stream()
                .limit(limit)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Map to response ───────────────────────────────────────────────────────
    private DailySessionDTO.Response toResponse(DailySession s) {
        DailySessionDTO.Response r = new DailySessionDTO.Response();
        r.setId(s.getId());
        r.setSessionDate(s.getSessionDate());
        r.setMarketBias(s.getMarketBias());
        r.setPreMarketNotes(s.getPreMarketNotes());
        r.setNewsToWatch(s.getNewsToWatch());
        r.setLessonLearned(s.getLessonLearned());
        r.setSessionMood(s.getSessionMood());
        r.setDisciplineScore(s.getDisciplineScore());
        r.setAdditionalNotes(s.getAdditionalNotes());
        r.setCreatedAt(s.getCreatedAt());
        r.setUpdatedAt(s.getUpdatedAt());
        return r;
    }
}

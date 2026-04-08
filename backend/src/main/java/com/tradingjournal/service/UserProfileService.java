package com.tradingjournal.service;

import com.tradingjournal.dto.UserProfileDTO;
import com.tradingjournal.exception.ResourceNotFoundException;
import com.tradingjournal.model.User;
import com.tradingjournal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;

    public UserProfileDTO.Response getProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        return toResponse(user);
    }

    public UserProfileDTO.Response updateProfile(String userId, UserProfileDTO.UpdateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // ── Personal info ─────────────────────────────────────────────────
        if (req.getFullName()      != null) user.setFullName(req.getFullName());
        if (req.getDisplayName()   != null) user.setDisplayName(req.getDisplayName());
        if (req.getPhone()         != null) user.setPhone(req.getPhone());
        if (req.getCity()          != null) user.setCity(req.getCity());
        if (req.getCountry()       != null) user.setCountry(req.getCountry());
        if (req.getAvatarBase64()  != null) user.setAvatarBase64(req.getAvatarBase64());

        // ── Trading identity ──────────────────────────────────────────────
        if (req.getExperienceLevel() != null) user.setExperienceLevel(req.getExperienceLevel());
        if (req.getPrimaryStyle()    != null) user.setPrimaryStyle(req.getPrimaryStyle());
        if (req.getMarketsTraded()   != null) user.setMarketsTraded(req.getMarketsTraded());
        if (req.getPlatformsUsed()   != null) user.setPlatformsUsed(req.getPlatformsUsed());
        if (req.getPrimaryBroker()   != null) user.setPrimaryBroker(req.getPrimaryBroker());

        // ── Capital & risk ────────────────────────────────────────────────
        if (req.getTradingCapital()          != null) user.setTradingCapital(req.getTradingCapital());
        if (req.getRiskPerTradePercent()     != null) user.setRiskPerTradePercent(req.getRiskPerTradePercent());
        if (req.getMaxDrawdownTolerance()    != null) user.setMaxDrawdownTolerance(req.getMaxDrawdownTolerance());
        if (req.getTargetMonthlyReturnPct()  != null) user.setTargetMonthlyReturnPct(req.getTargetMonthlyReturnPct());
        if (req.getAvgTradesPerMonth()       != null) user.setAvgTradesPerMonth(req.getAvgTradesPerMonth());

        // ── Goals ─────────────────────────────────────────────────────────
        if (req.getTradingGoal()     != null) user.setTradingGoal(req.getTradingGoal());
        if (req.getBiggestWeakness() != null) user.setBiggestWeakness(req.getBiggestWeakness());
        if (req.getWhyImproving()    != null) user.setWhyImproving(req.getWhyImproving());

        // ── Settings ──────────────────────────────────────────────────────
        if (req.getStrictMode()         != null) user.setStrictMode(req.getStrictMode());
        if (req.getEmailNotifications() != null) user.setEmailNotifications(req.getEmailNotifications());
        if (req.getWeeklyReportEmail()  != null) user.setWeeklyReportEmail(req.getWeeklyReportEmail());

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    private UserProfileDTO.Response toResponse(User u) {
        UserProfileDTO.Response r = new UserProfileDTO.Response();
        r.setId(u.getId());
        r.setEmail(u.getEmail());

        // fullName: prefer dedicated field, fall back to firstName + lastName
        String fullName = u.getFullName();
        if (fullName == null || fullName.isBlank()) {
            String first = u.getFirstName() != null ? u.getFirstName() : "";
            String last  = u.getLastName()  != null ? u.getLastName()  : "";
            fullName = (first + " " + last).trim();
        }
        r.setFullName(fullName.isBlank() ? null : fullName);

        // displayName: prefer dedicated field, fall back to fullName
        String displayName = u.getDisplayName();
        if (displayName == null || displayName.isBlank()) displayName = fullName;
        r.setDisplayName(displayName);

        r.setPhone(u.getPhone());
        r.setCity(u.getCity());
        r.setCountry(u.getCountry());
        r.setAvatarBase64(u.getAvatarBase64());
        r.setExperienceLevel(u.getExperienceLevel());
        r.setPrimaryStyle(u.getPrimaryStyle());
        r.setMarketsTraded(u.getMarketsTraded());
        r.setPlatformsUsed(u.getPlatformsUsed());
        r.setPrimaryBroker(u.getPrimaryBroker());
        r.setTradingCapital(u.getTradingCapital());
        r.setRiskPerTradePercent(u.getRiskPerTradePercent());
        r.setMaxDrawdownTolerance(u.getMaxDrawdownTolerance());
        r.setTargetMonthlyReturnPct(u.getTargetMonthlyReturnPct());
        r.setAvgTradesPerMonth(u.getAvgTradesPerMonth());
        r.setTradingGoal(u.getTradingGoal());
        r.setBiggestWeakness(u.getBiggestWeakness());
        r.setWhyImproving(u.getWhyImproving());
        r.setStrictMode(u.isStrictMode());
        r.setEmailNotifications(u.isEmailNotifications());
        r.setWeeklyReportEmail(u.isWeeklyReportEmail());
        r.setRole(u.getRole());
        r.setPlanType(u.getPlanType() != null ? u.getPlanType() : User.PlanType.FREE);
        r.setCreatedAt(u.getCreatedAt());
        r.setUpdatedAt(u.getUpdatedAt());
        return r;
    }
}
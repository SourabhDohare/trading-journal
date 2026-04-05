# TradePulse API — Example Requests
# Base URL: http://localhost:8080/api/v1

# ─── 1. Register ──────────────────────────────────────────────────────────────
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Raj",
    "lastName": "Sharma",
    "email": "raj@example.com",
    "password": "securepassword"
  }'

# ─── 2. Login ─────────────────────────────────────────────────────────────────
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "raj@example.com",
    "password": "securepassword"
  }'

# TOKEN=$(above response .accessToken)

# ─── 3. Log a Trade ───────────────────────────────────────────────────────────
curl -X POST http://localhost:8080/api/v1/trades \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "instrument": "NIFTY",
    "instrumentType": "FO_OPTIONS",
    "tradeType": "INTRADAY",
    "direction": "BUY",
    "entryPrice": 21450.00,
    "stopLoss": 21380.00,
    "target": 21620.00,
    "positionSize": 1,
    "lotSize": 50,
    "exchange": "NSE",
    "riskPerTradePercent": 1.0,
    "setupType": "BREAKOUT",
    "marketContext": "TRENDING_UP",
    "whyTookTrade": "NIFTY broke above 21400 key resistance with 2.3x average volume. Bank Nifty leading the move. FII data shows net buying.",
    "edgeOrSetupLogic": "Historical breakouts above multi-session resistance with volume > 2x average have 67% success rate in trending markets.",
    "confirmationUsed": "15-min candle close above 21400, RSI 58, sector momentum aligned",
    "invalidationReason": "Close back below 21400 on 15-min candle invalidates the breakout thesis",
    "emotionalState": "CALM",
    "brokerage": 200,
    "taxes": 150,
    "tags": ["#HighConfidence"]
  }'

# ─── 4. Update Trade with Exit + Reflection ───────────────────────────────────
curl -X PUT http://localhost:8080/api/v1/trades/{TRADE_ID} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exitPrice": 21620.00,
    "outcomeTag": "PROFIT",
    "whatWentRight": "Waited for volume confirmation, followed the plan exactly",
    "whatWentWrong": "Nothing major",
    "willRepeat": "Volume confirmation before entry",
    "willAvoid": "Entering on anticipation without confirmation",
    "disciplineScore": 9,
    "slRespected": true,
    "isReviewed": true
  }'

# ─── 5. Query: All FOMO losses ────────────────────────────────────────────────
curl -X POST http://localhost:8080/api/v1/trades/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emotionalState": "FOMO",
    "outcomeTag": "LOSS"
  }'

# ─── 6. Query: Trades with R:R > 2 ───────────────────────────────────────────
curl -X POST http://localhost:8080/api/v1/trades/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "minRR": 2.0 }'

# ─── 7. Query: SL Breaches ───────────────────────────────────────────────────
curl -X POST http://localhost:8080/api/v1/trades/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "slRespected": false }'

# ─── 8. Query: Last 10 Trades ────────────────────────────────────────────────
curl -X POST http://localhost:8080/api/v1/trades/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "limit": 10, "sortBy": "tradeDate", "sortDir": "desc" }'

# ─── 9. Get Analytics ─────────────────────────────────────────────────────────
curl -X GET http://localhost:8080/api/v1/trades/analytics \
  -H "Authorization: Bearer $TOKEN"

# ─── 10. Weekly Report ───────────────────────────────────────────────────────
curl -X GET http://localhost:8080/api/v1/reports/weekly \
  -H "Authorization: Bearer $TOKEN"

# ─── 11. Custom Date Range Report ────────────────────────────────────────────
curl -X GET "http://localhost:8080/api/v1/reports/custom?from=2024-01-01&to=2024-03-31" \
  -H "Authorization: Bearer $TOKEN"

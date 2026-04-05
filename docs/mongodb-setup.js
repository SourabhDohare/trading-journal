// MongoDB Atlas Setup Script
// Run this in MongoDB Atlas Data Explorer or mongosh

// Create indexes
db.trades.createIndex({ "userId": 1, "tradeDate": -1 });
db.trades.createIndex({ "userId": 1, "instrument": 1 });
db.trades.createIndex({ "userId": 1, "outcomeTag": 1 });
db.trades.createIndex({ "userId": 1, "emotionalState": 1 });
db.trades.createIndex({ "userId": 1, "setupType": 1 });
db.trades.createIndex({ "userId": 1, "slRespected": 1 });
db.trades.createIndex({ "userId": 1, "tags": 1 });
db.daily_sessions.createIndex({ "userId": 1, "sessionDate": -1 }, { unique: true });

// ─── Sample Trades for Testing ──────────────────────────────────────────────
// Replace USER_ID with an actual user ID after registering

const sampleTrades = [
  {
    tradeId: "TRD-20240115-0001",
    userId: "USER_ID",
    tradeDate: new Date("2024-01-15T09:35:00"),
    exitDate: new Date("2024-01-15T14:22:00"),
    instrument: "NIFTY",
    instrumentType: "FO_OPTIONS",
    tradeType: "INTRADAY",
    direction: "BUY",
    entryPrice: 21450,
    exitPrice: 21620,
    stopLoss: 21380,
    target: 21620,
    positionSize: 1,
    lotSize: 50,
    riskPerTradePercent: 1.0,
    setupType: "BREAKOUT",
    marketContext: "TRENDING_UP",
    whyTookTrade: "NIFTY broke above the key 21400 resistance level that had held for 3 sessions. Volume was 2.3x the 20-day average on the breakout candle. Bank Nifty was leading the move.",
    edgeOrSetupLogic: "Historical data shows NIFTY breakouts above multi-session resistance with volume > 2x average have a 67% success rate in trending markets.",
    confirmationUsed: "15-min candle close above 21400, RSI 58 with room to run, sector momentum positive",
    invalidationReason: "If price closes back below 21400 on a 15-min candle, thesis is invalid",
    emotionalState: "CALM",
    outcomeTag: "PROFIT",
    pnlAbsolute: 8500,
    pnlPercent: 0.79,
    plannedRR: 2.43,
    actualRR: 2.43,
    whatWentRight: "Waited for volume confirmation, respected the setup rules, held until target",
    whatWentWrong: "Nothing major — could have sized up given the clear setup",
    willRepeat: "Waiting for volume confirmation on breakouts",
    willAvoid: "Entering without volume confirmation",
    disciplineScore: 9,
    tags: ["#HighConfidence", "#PerfectExecution", "#HighRR"],
    slRespected: true,
    isReviewed: true,
    exchange: "NSE",
    brokerage: 200,
    taxes: 150,
    createdAt: new Date("2024-01-15T09:35:00"),
    updatedAt: new Date("2024-01-15T15:00:00")
  },
  {
    tradeId: "TRD-20240116-0001",
    userId: "USER_ID",
    tradeDate: new Date("2024-01-16T10:15:00"),
    exitDate: new Date("2024-01-16T11:45:00"),
    instrument: "BANKNIFTY",
    instrumentType: "FO_OPTIONS",
    tradeType: "INTRADAY",
    direction: "SELL",
    entryPrice: 48200,
    exitPrice: 48450,
    stopLoss: 48350,
    target: 47900,
    positionSize: 1,
    lotSize: 25,
    setupType: "REVERSAL",
    marketContext: "RANGING",
    whyTookTrade: "Bank Nifty was at strong resistance at 48200 for the 4th time. RSI divergence visible on 15-min chart. Selling pressure increasing.",
    edgeOrSetupLogic: "Multiple touches at resistance weakens the level. Combined with RSI divergence, short setup at key resistance.",
    confirmationUsed: "RSI bearish divergence on 15-min, bearish engulfing candle at resistance",
    invalidationReason: "If price closes above 48350 with volume, short thesis is invalid",
    emotionalState: "FOMO",
    outcomeTag: "LOSS",
    pnlAbsolute: -3750,
    pnlPercent: -0.31,
    plannedRR: 2.0,
    actualRR: -1.67,
    whatWentRight: "Identified a valid setup",
    whatWentWrong: "Entered FOMO — should have waited for candle close. SL was also moved wider after entry which was a discipline break.",
    willRepeat: "The setup identification",
    willAvoid: "Entering before candle close, moving SL wider",
    disciplineScore: 4,
    tags: ["#FOMO", "#DisciplineBreak"],
    slRespected: false,
    isReviewed: true,
    exchange: "NSE",
    brokerage: 200,
    taxes: 100,
    createdAt: new Date("2024-01-16T10:15:00"),
    updatedAt: new Date("2024-01-16T12:00:00")
  },
  {
    tradeId: "TRD-20240117-0001",
    userId: "USER_ID",
    tradeDate: new Date("2024-01-17T09:20:00"),
    exitDate: new Date("2024-01-19T15:30:00"),
    instrument: "RELIANCE",
    instrumentType: "STOCK",
    tradeType: "SWING",
    direction: "BUY",
    entryPrice: 2845,
    exitPrice: 2920,
    stopLoss: 2800,
    target: 2950,
    positionSize: 100,
    setupType: "PULLBACK",
    marketContext: "TRENDING_UP",
    whyTookTrade: "Reliance pulled back to the 20-EMA after a strong breakout. Volume on pullback was declining — sign of healthy correction. Strong fundamental support with new JioMart announcements.",
    edgeOrSetupLogic: "Pullback to 20-EMA in an uptrend with declining volume is a high-probability long setup. Risk is well-defined.",
    confirmationUsed: "Price bounced off 20-EMA with a bullish hammer candle, sector ETF also strong",
    invalidationReason: "Close below 2800 (below EMA and prior support) invalidates the setup",
    emotionalState: "CALM",
    outcomeTag: "PROFIT",
    pnlAbsolute: 7500,
    pnlPercent: 2.64,
    plannedRR: 2.33,
    actualRR: 1.67,
    whatWentRight: "Patient entry at the right level, let trade develop",
    whatWentWrong: "Exited slightly early — target was 2950 but exited at 2920 on nervousness",
    willRepeat: "Patience during pullback, EMA entry",
    willAvoid: "Early exits — cost 3000 in missed profit",
    disciplineScore: 7,
    tags: ["#HighConfidence", "#EarlyExit"],
    slRespected: true,
    isReviewed: true,
    exchange: "NSE",
    brokerage: 500,
    taxes: 300,
    createdAt: new Date("2024-01-17T09:20:00"),
    updatedAt: new Date("2024-01-19T16:00:00")
  }
];

// Insert sample trades (update USER_ID first)
// db.trades.insertMany(sampleTrades);

print("Setup complete. Update USER_ID and uncomment insertMany to add sample data.");

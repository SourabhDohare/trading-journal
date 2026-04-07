// src/app/shared/models/analytics.model.ts

export interface SetupStat {
  count: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
}

export interface EmotionStat {
  count: number;
  winRate: number;
  avgPnl: number;
}

export interface InstrumentStat {
  count: number;
  winRate: number;
  totalPnl: number;
}

export interface TimeStat {
  count: number;
  winRate: number;
  avgPnl: number;
}

// NEW — for time frame performance table rows
export interface TimeFrameStat {
  timeFrame: string;
  trades: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
}

export interface Analytics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  totalPnl: number;
  avgProfitPerWin: number;
  avgLossPerLoss: number;
  profitFactor: number;
  expectancy: number;
  avgActualRR: number;
  avgPlannedRR: number;
  maxDrawdown: number;
  maxConsecutiveLosses: number;
  maxConsecutiveWins: number;
  bestTrade: number;
  worstTrade: number;
  avgDisciplineScore: number;

  // Record-style maps — component accesses these as analytics()!.setupPerformance[key].count
  setupPerformance:      Record<string, SetupStat>;
  emotionPerformance:    Record<string, EmotionStat>;
  instrumentPerformance: Record<string, InstrumentStat>;
  timePerformance:       Record<string, TimeStat>;
  monthlyPnl:            Record<string, number>;

  // NEW time frame fields
  timeFrameUsage:       Record<string, number>;  // { "15min": 5, "1hr": 3, ... }
  timeFramePerformance: TimeFrameStat[];          // array sorted by usage

  repeatingMistakes: string[];
  bestSetups:        string[];
  worstBehaviors:    string[];
  recommendations:   string[];
  disciplineRating:  number;
  disciplineGrade:   string;
  disciplineBreaks:  string[];
}

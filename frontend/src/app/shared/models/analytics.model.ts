// src/app/shared/models/analytics.model.ts

export interface TimeFrameStat {
  timeFrame: string;
  trades: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
}

export interface SetupPerformance {
  setup: string;
  trades: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
}

export interface EmotionPerformance {
  state: string;
  trades: number;
  winRate: number;
  avgPnl: number;
}

export interface InstrumentPerformance {
  instrument: string;
  trades: number;
  winRate: number;
  totalPnl: number;
}

export interface TimePerformance {
  period: string;
  trades: number;
  winRate: number;
  avgPnl: number;
}

export interface MonthlyPnl {
  month: string;
  pnl: number;
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
  setupPerformance: SetupPerformance[];
  emotionPerformance: EmotionPerformance[];
  instrumentPerformance: InstrumentPerformance[];
  timePerformance: TimePerformance[];
  timeFrameUsage: Record<string, number>; // NEW
  timeFramePerformance: TimeFrameStat[]; // NEW
  monthlyPnl: MonthlyPnl[];
  repeatingMistakes: string[];
  bestSetups: string[];
  worstBehaviors: string[];
  recommendations: string[];
  disciplineRating: number;
  disciplineGrade: string;
  disciplineBreaks: string[];
}

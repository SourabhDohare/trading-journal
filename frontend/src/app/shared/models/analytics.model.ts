// src/app/shared/models/analytics.model.ts

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
  avgRR: number;
  avgPlannedRR: number;
  avgActualRR: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  maxConsecutiveLosses: number;
  maxConsecutiveWins: number;
  bestTrade: number;
  worstTrade: number;
  largestWin: number;
  largestLoss: number;
  avgDisciplineScore: number;
  setupPerformance: Record<string, SetupPerformance>;
  emotionPerformance: Record<string, EmotionPerformance>;
  instrumentPerformance: Record<string, InstrumentPerformance>;
  timePerformance: Record<string, TimePerformance>;
  monthlyPnl: Record<string, number>;
  repeatingMistakes: string[];
  bestSetups: string[];
  worstBehaviors: string[];
  recommendations: string[];
  disciplineRating: number;
  disciplineGrade: string;
  disciplineBreaks: string[];
}

export interface SetupPerformance {
  setupType: string;
  count: number;
  winRate: number;
  avgPnl: number;
  avgRR: number;
  totalPnl: number;
}

export interface EmotionPerformance {
  emotionalState: string;
  count: number;
  winRate: number;
  avgPnl: number;
}

export interface InstrumentPerformance {
  instrument: string;
  count: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
}

export interface TimePerformance {
  period: string;
  count: number;
  winRate: number;
  avgPnl: number;
}

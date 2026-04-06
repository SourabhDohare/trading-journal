// src/app/shared/models/trade.model.ts

export type InstrumentType = 'STOCK' | 'CRYPTO' | 'FO_FUTURES' | 'FO_OPTIONS' | 'FOREX' | 'COMMODITY' | 'INDEX';
export type TradeType = 'INTRADAY' | 'SWING' | 'POSITIONAL';
export type Direction = 'BUY' | 'SELL';
export type OutcomeTag = 'PROFIT' | 'LOSS' | 'BREAKEVEN' | 'NO_TRADE' | 'OPEN';
export type SetupType = 'BREAKOUT' | 'REVERSAL' | 'PULLBACK' | 'TREND_FOLLOW' | 'RANGE_TRADE' | 'GAP_PLAY' | 'MOMENTUM' | 'MEAN_REVERSION' | 'VOLUME_BASED' | 'NEWS_BASED' | 'OTHER';
export type MarketContext = 'TRENDING_UP' | 'TRENDING_DOWN' | 'RANGING' | 'VOLATILE' | 'NEWS_DRIVEN' | 'CONSOLIDATION';
export type EmotionalState = 'CALM' | 'FOMO' | 'REVENGE' | 'HESITATION' | 'OVERCONFIDENT' | 'ANXIOUS' | 'DISCIPLINED';

export interface Trade {
  id: string;
  tradeId: string;
  tradeDate: string;
  exitDate?: string;
  instrument: string;
  instrumentType: InstrumentType;
  tradeType: TradeType;
  direction: Direction;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  target: number;
  positionSize: number;
  lotSize?: number;
  riskPerTradePercent?: number;
  outcomeTag: OutcomeTag;
  pnlAbsolute?: number;
  pnlPercent?: number;
  plannedRR?: number;
  actualRR?: number;
  setupType: SetupType;
  marketContext: MarketContext;
  whyTookTrade: string;
  edgeOrSetupLogic: string;
  confirmationUsed: string;
  invalidationReason: string;
  emotionalState: EmotionalState;
  whatWentRight?: string;
  whatWentWrong?: string;
  willRepeat?: string;
  willAvoid?: string;
  disciplineScore?: number;
  tags: string[];
  chartImageUrls?: string[];
  notes?: string;
  exchange?: string;
  brokerage?: number;
  taxes?: number;
  slRespected: boolean;
  isReviewed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTradeRequest {
  instrument: string;
  instrumentType: InstrumentType;
  tradeType: TradeType;
  direction: Direction;
  entryPrice: number;
  stopLoss: number;
  target: number;
  exitPrice?: number;
  tradeDate?: string;
  exitDate?: string;
  positionSize: number;
  lotSize?: number;
  riskPerTradePercent?: number;
  setupType: SetupType;
  marketContext: MarketContext;
  whyTookTrade: string;
  edgeOrSetupLogic: string;
  confirmationUsed: string;
  invalidationReason: string;
  emotionalState: EmotionalState;
  outcomeTag?: OutcomeTag;
  pnlAbsolute?: number;
  pnlPercent?: number;
  tags?: string[];
  notes?: string;
  exchange?: string;
  brokerage?: number;
  taxes?: number;
  slRespected?: boolean;
}

export interface TradeQuery {
  instrument?: string;
  instrumentType?: InstrumentType; 
  outcomeTag?: OutcomeTag;
  emotionalState?: EmotionalState;
  setupType?: SetupType;
  tradeType?: TradeType;
  tags?: string[];
  minRR?: number;
  slRespected?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
